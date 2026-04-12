/**
 * ============================================================
 * Feedback Controller — Post-Event Feedback
 * ============================================================
 *
 * Handles submission and retrieval of event feedback.
 * Enforces one-feedback-per-user-per-event at the DB level
 * (UNIQUE constraint on user_id + event_id).
 *
 * Raw SQL only — no ORM.
 * ============================================================
 */

const { pool } = require('../config/db');

/**
 * POST /api/events/:id/feedback
 *
 * Submit feedback for a completed event.
 *
 * Body: { rating (1-5), comments? }
 * Requires: student role + must have a non-cancelled registration.
 */
async function submitFeedback(req, res) {
  try {
    const event_id = parseInt(req.params.id);
    const user_id  = req.user.user_id;
    const { rating, comments = null } = req.body;

    // ── Input validation ──
    if (rating === undefined || rating === null) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'rating is required (1-5).' }
      });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RATING', message: 'rating must be an integer between 1 and 5.' }
      });
    }

    // ── Verify user was registered for this event ──
    const [regCheck] = await pool.execute(
      `SELECT registration_id FROM registrations
       WHERE user_id = ? AND event_id = ? AND status != 'cancelled'`,
      [user_id, event_id]
    );

    if (regCheck.length === 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_PARTICIPANT',
          message: 'You can only submit feedback for events you participated in.'
        }
      });
    }

    // ── Insert feedback ──
    const sql = `
      INSERT INTO feedback (user_id, event_id, rating, comments)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [user_id, event_id, ratingNum, comments]);

    return res.status(201).json({
      success: true,
      data: {
        feedback_id: result.insertId,
        user_id,
        event_id,
        rating: ratingNum,
        comments,
      }
    });

  } catch (err) {
    // ── Handle duplicate feedback (UNIQUE constraint) ──
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'FEEDBACK_EXISTS',
          message: 'You have already submitted feedback for this event.'
        }
      });
    }

    // ── Handle CHECK constraint (rating out of range) ──
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.errno === 3819) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RATING',
          message: 'Rating must be between 1 and 5.'
        }
      });
    }

    console.error('[FeedbackController] submitFeedback error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to submit feedback.' }
    });
  }
}

/**
 * GET /api/events/:id/feedback
 *
 * Retrieve all feedback for a specific event.
 */
async function getEventFeedback(req, res) {
  try {
    const event_id = parseInt(req.params.id);

    const sql = `
      SELECT
        f.feedback_id,
        f.rating,
        f.comments,
        f.submitted_at,
        CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name,
        u.department
      FROM feedback f
        INNER JOIN users u ON f.user_id = u.user_id
      WHERE f.event_id = ?
      ORDER BY f.submitted_at DESC
    `;
    const [feedback] = await pool.execute(sql, [event_id]);

    // Compute summary stats inline
    const totalReviews = feedback.length;
    const avgRating = totalReviews > 0
      ? parseFloat((feedback.reduce((sum, f) => sum + f.rating, 0) / totalReviews).toFixed(2))
      : null;

    return res.status(200).json({
      success: true,
      data: {
        event_id,
        summary: {
          total_reviews: totalReviews,
          avg_rating:    avgRating,
          min_rating:    totalReviews > 0 ? Math.min(...feedback.map(f => f.rating)) : null,
          max_rating:    totalReviews > 0 ? Math.max(...feedback.map(f => f.rating)) : null,
        },
        feedback,
      }
    });

  } catch (err) {
    console.error('[FeedbackController] getEventFeedback error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch feedback.' }
    });
  }
}

module.exports = { submitFeedback, getEventFeedback };
