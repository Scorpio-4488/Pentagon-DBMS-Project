const { pool } = require('../config/db');

async function submitFeedback(req, res) {
  try {
    const eventId = Number.parseInt(req.params.id, 10);
    const userId = req.user.user_id;
    const { rating, comments = null } = req.body;

    if (rating === undefined || rating === null) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'rating is required (1-5).' },
      });
    }

    const ratingValue = Number.parseInt(rating, 10);
    if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RATING',
          message: 'rating must be an integer between 1 and 5.',
        },
      });
    }

    const [registrationRows] = await pool.execute(
      `SELECT registration_id
       FROM registrations
       WHERE user_id = ? AND event_id = ? AND status != 'cancelled'`,
      [userId, eventId]
    );

    if (registrationRows.length === 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_PARTICIPANT',
          message: 'You can only submit feedback for events you participated in.',
        },
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO feedback (user_id, event_id, rating, comments)
       VALUES (?, ?, ?, ?)`,
      [userId, eventId, ratingValue, comments]
    );

    return res.status(201).json({
      success: true,
      data: {
        feedback_id: result.insertId,
        user_id: userId,
        event_id: eventId,
        rating: ratingValue,
        comments,
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'FEEDBACK_EXISTS',
          message: 'You have already submitted feedback for this event.',
        },
      });
    }

    if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || error.errno === 3819) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5.' },
      });
    }

    console.error('[FeedbackController] submitFeedback failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to submit feedback.' },
    });
  }
}

async function getEventFeedback(req, res) {
  try {
    const eventId = Number.parseInt(req.params.id, 10);

    const [feedback] = await pool.execute(
      `SELECT
         f.feedback_id,
         f.rating,
         f.comments,
         f.submitted_at,
         CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name,
         u.department
       FROM feedback f
       INNER JOIN users u ON f.user_id = u.user_id
       WHERE f.event_id = ?
       ORDER BY f.submitted_at DESC`,
      [eventId]
    );

    const totalReviews = feedback.length;
    const ratings = feedback.map((entry) => entry.rating);
    const avgRating = totalReviews
      ? Number.parseFloat(
          (ratings.reduce((sum, value) => sum + value, 0) / totalReviews).toFixed(2)
        )
      : null;

    return res.status(200).json({
      success: true,
      data: {
        event_id: eventId,
        summary: {
          total_reviews: totalReviews,
          avg_rating: avgRating,
          min_rating: totalReviews ? Math.min(...ratings) : null,
          max_rating: totalReviews ? Math.max(...ratings) : null,
        },
        feedback,
      },
    });
  } catch (error) {
    console.error('[FeedbackController] getEventFeedback failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch feedback.' },
    });
  }
}

module.exports = { submitFeedback, getEventFeedback };
