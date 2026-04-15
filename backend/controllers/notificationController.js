const { pool } = require('../config/db');

async function getMyNotifications(req, res) {
  try {
    const userId = req.user.user_id;
    const unreadOnly = req.query.unread_only === 'true';
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));

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

    if (unreadOnly) {
      sql += ' AND n.is_read = FALSE';
    }

    sql += ' ORDER BY n.sent_at DESC LIMIT ?';

    const [notifications] = await pool.query(sql, [userId, limit]);
    const [[{ unread_count: unreadCount }]] = await pool.query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        unread_count: unreadCount,
        notifications,
      },
    });
  } catch (error) {
    console.error('[NotificationController] getMyNotifications failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications.' },
    });
  }
}

async function markAsRead(req, res) {
  try {
    const notificationId = Number.parseInt(req.params.id, 10);
    const userId = req.user.user_id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: { notification_id: notificationId, is_read: true },
    });
  } catch (error) {
    console.error('[NotificationController] markAsRead failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update notification.' },
    });
  }
}

async function markAllAsRead(req, res) {
  try {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.user_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        updated_count: result.affectedRows,
        message: `${result.affectedRows} notification(s) marked as read.`,
      },
    });
  } catch (error) {
    console.error('[NotificationController] markAllAsRead failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update notifications.' },
    });
  }
}

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
