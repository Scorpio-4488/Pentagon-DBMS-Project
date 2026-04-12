/**
 * ============================================================
 * Notification Controller — User Notifications
 * ============================================================
 *
 * Handles retrieval and status management of user notifications.
 * Notifications are created by stored procedures (e.g., event
 * cancellation) and by application-level logic.
 *
 * Raw SQL only — no ORM.
 * ============================================================
 */

const { pool } = require('../config/db');

/**
 * GET /api/users/me/notifications
 *
 * Fetch the authenticated user's notifications.
 *
 * Query params:
 *   ?unread_only=true  — Show only unread notifications
 *   ?limit=50          — Max results (default: 50)
 */
async function getMyNotifications(req, res) {
  try {
    const user_id = req.user.user_id;
    const { unread_only, limit = 50 } = req.query;

    const limitVal = Math.min(100, Math.max(1, parseInt(limit)));

    let sql = `
      SELECT
        n.notification_id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.sent_at,
        n.event_id,
        e.event_name
      FROM notifications n
        LEFT JOIN events e ON n.event_id = e.event_id
      WHERE n.user_id = ?
    `;
    const params = [user_id];

    if (unread_only === 'true') {
      sql += ' AND n.is_read = FALSE';
    }

    sql += ' ORDER BY n.sent_at DESC LIMIT ?';
    params.push(limitVal);

    const [notifications] = await pool.execute(sql, params);

    // Get unread count
    const [[{ unread_count }]] = await pool.execute(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [user_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        unread_count,
        notifications,
      }
    });

  } catch (err) {
    console.error('[NotificationController] getMyNotifications error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications.' }
    });
  }
}

/**
 * PATCH /api/notifications/:id/read
 *
 * Mark a single notification as read.
 */
async function markAsRead(req, res) {
  try {
    const notification_id = parseInt(req.params.id);
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [notification_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found.' }
      });
    }

    return res.status(200).json({
      success: true,
      data: { notification_id, is_read: true }
    });

  } catch (err) {
    console.error('[NotificationController] markAsRead error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update notification.' }
    });
  }
}

/**
 * PATCH /api/notifications/read-all
 *
 * Mark all notifications for the authenticated user as read.
 */
async function markAllAsRead(req, res) {
  try {
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [user_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        updated_count: result.affectedRows,
        message: `${result.affectedRows} notification(s) marked as read.`
      }
    });

  } catch (err) {
    console.error('[NotificationController] markAllAsRead error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update notifications.' }
    });
  }
}

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
