/**
 * ============================================================
 * Registration Controller — Student Registration & Attendance
 * ============================================================
 *
 * Handles event registration, cancellation, and attendance
 * marking. The core registration logic delegates to the
 * sp_register_student stored procedure for concurrency-safe
 * seat management using SELECT ... FOR UPDATE.
 *
 * Raw SQL only — no ORM.
 * ============================================================
 */

const { pool } = require('../config/db');

/**
 * POST /api/events/:id/register
 *
 * Register the authenticated student for an event.
 *
 * CRITICAL: This handler calls the `sp_register_student` stored
 * procedure, which uses pessimistic locking (SELECT ... FOR UPDATE)
 * to prevent race conditions during concurrent registrations.
 *
 * The procedure handles:
 *   1. Row-level locking on the event
 *   2. Event status validation (must be 'upcoming')
 *   3. Duplicate registration check
 *   4. Seat availability verification
 *   5. Atomic INSERT + seat decrement
 *
 * Requires: student role.
 */
async function registerForEvent(req, res) {
  try {
    const event_id = parseInt(req.params.id);
    const user_id  = req.user.user_id;

    // ── Call the concurrency-safe stored procedure ──
    // sp_register_student(IN p_user_id, IN p_event_id, OUT p_result)
    await pool.execute('CALL sp_register_student(?, ?, @result)', [user_id, event_id]);

    // ── Retrieve the OUT parameter result ──
    const [[{ '@result': result }]] = await pool.execute('SELECT @result');

    // ── Map stored procedure result to HTTP response ──
    switch (result) {
      case 'SUCCESS': {
        // Fetch the created registration details for the response
        const [regRows] = await pool.execute(
          `SELECT r.registration_id, r.user_id, r.event_id, r.status, r.registered_at,
                  e.available_seats AS available_seats_remaining
           FROM registrations r
             INNER JOIN events e ON r.event_id = e.event_id
           WHERE r.user_id = ? AND r.event_id = ? AND r.status = 'registered'`,
          [user_id, event_id]
        );
        return res.status(201).json({
          success: true,
          data: regRows[0],
        });
      }

      case 'ERROR_EVENT_NOT_OPEN':
        return res.status(400).json({
          success: false,
          error: {
            code: 'EVENT_NOT_OPEN',
            message: 'This event is not open for registration (status is not upcoming).'
          }
        });

      case 'ERROR_ALREADY_REGISTERED':
        return res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_REGISTERED',
            message: 'You are already registered for this event.'
          }
        });

      case 'ERROR_NO_SEATS':
        return res.status(409).json({
          success: false,
          error: {
            code: 'NO_SEATS_AVAILABLE',
            message: 'This event has reached maximum capacity. No seats available.'
          }
        });

      default:
        return res.status(500).json({
          success: false,
          error: {
            code: 'UNKNOWN_RESULT',
            message: `Stored procedure returned unexpected result: ${result}`
          }
        });
    }

  } catch (err) {
    console.error('[RegistrationController] registerForEvent error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Registration failed. Please try again.' }
    });
  }
}

/**
 * DELETE /api/events/:id/register
 *
 * Cancel the authenticated student's registration for an event.
 *
 * Calls the sp_cancel_registration stored procedure, which
 * atomically cancels the registration and restores the seat.
 *
 * Requires: student role.
 */
async function cancelRegistration(req, res) {
  try {
    const event_id = parseInt(req.params.id);
    const user_id  = req.user.user_id;

    // ── Call stored procedure ──
    await pool.execute('CALL sp_cancel_registration(?, ?, @result)', [user_id, event_id]);
    const [[{ '@result': result }]] = await pool.execute('SELECT @result');

    switch (result) {
      case 'SUCCESS':
        return res.status(200).json({
          success: true,
          data: {
            user_id,
            event_id,
            status: 'cancelled',
            message: 'Registration cancelled successfully. Seat has been released.'
          }
        });

      case 'ERROR_NOT_FOUND':
        return res.status(404).json({
          success: false,
          error: {
            code: 'REGISTRATION_NOT_FOUND',
            message: 'No registration found for this event.'
          }
        });

      case 'ERROR_ALREADY_CANCELLED':
        return res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_CANCELLED',
            message: 'This registration has already been cancelled.'
          }
        });

      default:
        return res.status(500).json({
          success: false,
          error: { code: 'UNKNOWN_RESULT', message: `Unexpected result: ${result}` }
        });
    }

  } catch (err) {
    console.error('[RegistrationController] cancelRegistration error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Cancellation failed. Please try again.' }
    });
  }
}

/**
 * GET /api/users/me/registrations
 *
 * List all events the authenticated student is registered for,
 * with event details and registration status.
 *
 * Query params:
 *   ?status=registered   — Filter by registration status
 */
async function getMyRegistrations(req, res) {
  try {
    const user_id = req.user.user_id;
    const { status } = req.query;

    let sql = `
      SELECT
        r.registration_id,
        r.status          AS registration_status,
        r.registered_at,
        e.event_id,
        e.event_name,
        e.event_date,
        e.end_date,
        e.status          AS event_status,
        ec.category_name,
        v.venue_name,
        v.building,
        CONCAT(u.first_name, ' ', u.last_name) AS organizer_name,
        CASE WHEN a.attendance_id IS NOT NULL THEN TRUE ELSE FALSE END AS has_attended,
        CASE WHEN c.certificate_id IS NOT NULL THEN c.certificate_url ELSE NULL END AS certificate_url
      FROM registrations r
        INNER JOIN events e            ON r.event_id         = e.event_id
        INNER JOIN event_categories ec ON e.category_id      = ec.category_id
        INNER JOIN venues v            ON e.venue_id         = v.venue_id
        INNER JOIN users u             ON e.organizer_id     = u.user_id
        LEFT  JOIN attendance a        ON r.registration_id  = a.registration_id
        LEFT  JOIN certificates c      ON r.registration_id  = c.registration_id
      WHERE r.user_id = ?
    `;

    const params = [user_id];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY e.event_date DESC';

    const [registrations] = await pool.execute(sql, params);

    return res.status(200).json({
      success: true,
      data: {
        total: registrations.length,
        registrations,
      }
    });

  } catch (err) {
    console.error('[RegistrationController] getMyRegistrations error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch registrations.' }
    });
  }
}

/**
 * POST /api/events/:id/attendance
 *
 * Mark attendance for a student at an event.
 *
 * Calls the sp_mark_attendance stored procedure.
 *
 * Body: { user_id, method? }
 *   - user_id: The student to mark as attended
 *   - method:  'qr_scan' or 'manual' (default: 'manual')
 *
 * Requires: organizer or admin role.
 */
async function markAttendance(req, res) {
  try {
    const event_id = parseInt(req.params.id);
    const { user_id, method = 'manual' } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'user_id is required in the request body.' }
      });
    }

    // Validate method
    if (!['qr_scan', 'manual'].includes(method)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_METHOD', message: 'method must be "qr_scan" or "manual".' }
      });
    }

    // ── Call stored procedure ──
    await pool.execute('CALL sp_mark_attendance(?, ?, ?, @result)', [user_id, event_id, method]);
    const [[{ '@result': result }]] = await pool.execute('SELECT @result');

    switch (result) {
      case 'SUCCESS':
        return res.status(200).json({
          success: true,
          data: {
            user_id: parseInt(user_id),
            event_id,
            method,
            status: 'attended',
            message: 'Attendance marked successfully.'
          }
        });

      case 'ERROR_NOT_REGISTERED':
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_REGISTERED',
            message: 'Student is not registered for this event.'
          }
        });

      case 'ERROR_CANCELLED':
        return res.status(400).json({
          success: false,
          error: {
            code: 'REGISTRATION_CANCELLED',
            message: 'Cannot mark attendance — registration has been cancelled.'
          }
        });

      default:
        return res.status(500).json({
          success: false,
          error: { code: 'UNKNOWN_RESULT', message: `Unexpected result: ${result}` }
        });
    }

  } catch (err) {
    console.error('[RegistrationController] markAttendance error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to mark attendance.' }
    });
  }
}

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  markAttendance,
};
