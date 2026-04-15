const { pool } = require('../config/db');

async function getAttendanceRate(req, res) {
  try {
    const event_id = parseInt(req.params.id);

    const sql = `
      SELECT
        e.event_id,
        e.event_name,
        e.status,
        e.max_capacity,
        (e.max_capacity - e.available_seats)     AS total_registered,
        COUNT(a.attendance_id)                    AS total_attended,
        ROUND(
          (COUNT(a.attendance_id) / NULLIF(e.max_capacity - e.available_seats, 0)) * 100, 1
        ) AS attendance_rate_pct
      FROM events e
        LEFT JOIN registrations r ON e.event_id = r.event_id AND r.status != 'cancelled'
        LEFT JOIN attendance a    ON r.registration_id = a.registration_id
      WHERE e.event_id = ?
      GROUP BY e.event_id, e.event_name, e.status, e.max_capacity, e.available_seats
    `;
    const [rows] = await pool.execute(sql, [event_id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: `Event with ID ${event_id} does not exist.` }
      });
    }

    return res.status(200).json({ success: true, data: rows[0] });

  } catch (err) {
    console.error('[AnalyticsController] getAttendanceRate error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to compute attendance rate.' }
    });
  }
}

async function getFeedbackStats(req, res) {
  try {
    const event_id = parseInt(req.params.id);

    const sql = `
      SELECT
        e.event_id,
        e.event_name,
        COUNT(f.feedback_id)     AS total_reviews,
        ROUND(AVG(f.rating), 2)  AS avg_rating,
        MIN(f.rating)            AS min_rating,
        MAX(f.rating)            AS max_rating
      FROM events e
        LEFT JOIN feedback f ON e.event_id = f.event_id
      WHERE e.event_id = ?
      GROUP BY e.event_id, e.event_name
    `;
    const [rows] = await pool.execute(sql, [event_id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: `Event with ID ${event_id} does not exist.` }
      });
    }

    return res.status(200).json({ success: true, data: rows[0] });

  } catch (err) {
    console.error('[AnalyticsController] getFeedbackStats error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to compute feedback statistics.' }
    });
  }
}

async function getDepartmentStats(req, res) {
  try {
    const sql = `
      SELECT
        u.department,
        COUNT(DISTINCT r.registration_id) AS total_registrations,
        COUNT(DISTINCT r.event_id)        AS unique_events,
        COUNT(DISTINCT r.user_id)         AS unique_students
      FROM registrations r
        INNER JOIN users u ON r.user_id = u.user_id
      WHERE r.status != 'cancelled'
      GROUP BY u.department
      ORDER BY total_registrations DESC
    `;
    const [departments] = await pool.execute(sql);

    return res.status(200).json({
      success: true,
      data: { departments }
    });

  } catch (err) {
    console.error('[AnalyticsController] getDepartmentStats error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch department statistics.' }
    });
  }
}

async function getMonthlyTrends(req, res) {
  try {
    const months = Math.min(36, Math.max(1, parseInt(req.query.months) || 12));

    const sql = `
      SELECT
        DATE_FORMAT(event_date, '%Y-%m')                     AS month,
        COUNT(*)                                              AS total_events,
        SUM(max_capacity - available_seats)                   AS total_registrations,
        ROUND(AVG(max_capacity - available_seats), 0)         AS avg_registrations_per_event
      FROM events
      WHERE status != 'cancelled'
        AND event_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(event_date, '%Y-%m')
      ORDER BY month DESC
    `;
    const [trends] = await pool.execute(sql, [months]);

    return res.status(200).json({
      success: true,
      data: { period_months: months, trends }
    });

  } catch (err) {
    console.error('[AnalyticsController] getMonthlyTrends error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch monthly trends.' }
    });
  }
}

async function getPopularEvents(req, res) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const sql = `
      SELECT
        e.event_id,
        e.event_name,
        ec.category_name,
        e.event_date,
        e.status,
        e.max_capacity,
        (e.max_capacity - e.available_seats) AS registrations,
        ROUND(((e.max_capacity - e.available_seats) / e.max_capacity) * 100, 1) AS fill_rate_pct
      FROM events e
        INNER JOIN event_categories ec ON e.category_id = ec.category_id
      WHERE e.status IN ('upcoming', 'ongoing', 'completed')
      ORDER BY fill_rate_pct DESC
      LIMIT ?
    `;
    const [events] = await pool.execute(sql, [limit]);

    return res.status(200).json({
      success: true,
      data: { events }
    });

  } catch (err) {
    console.error('[AnalyticsController] getPopularEvents error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch popular events.' }
    });
  }
}

async function getStudentEngagement(req, res) {
  try {
    const sql = `
      SELECT
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name)                                    AS student_name,
        u.department,
        COUNT(DISTINCT r.event_id)                                                  AS events_registered,
        COUNT(DISTINCT CASE WHEN r.status = 'attended'  THEN r.event_id END)        AS events_attended,
        COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.event_id END)        AS events_completed,
        COUNT(DISTINCT f.event_id)                                                  AS feedbacks_given
      FROM users u
        LEFT JOIN registrations r ON u.user_id = r.user_id AND r.status != 'cancelled'
        LEFT JOIN feedback f      ON u.user_id = f.user_id
      WHERE u.role = 'student'
      GROUP BY u.user_id, u.first_name, u.last_name, u.department
      ORDER BY events_registered DESC
    `;
    const [students] = await pool.execute(sql);

    return res.status(200).json({
      success: true,
      data: { total_students: students.length, students }
    });

  } catch (err) {
    console.error('[AnalyticsController] getStudentEngagement error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch student engagement.' }
    });
  }
}

module.exports = {
  getAttendanceRate,
  getFeedbackStats,
  getDepartmentStats,
  getMonthlyTrends,
  getPopularEvents,
  getStudentEngagement,
};
