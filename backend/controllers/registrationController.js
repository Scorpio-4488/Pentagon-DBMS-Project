const crypto = require('crypto');
const { pool } = require('../config/db');

async function registerForEvent(req, res) {
  try {
    const event_id = parseInt(req.params.id);
    const user_id  = req.user.user_id;

    await pool.query('CALL sp_register_student(?, ?, @result)', [user_id, event_id]);
    const [[{ '@result': result }]] = await pool.query('SELECT @result');

    switch (result) {
      case 'SUCCESS': {

        const [regRows] = await pool.query(
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

async function cancelRegistration(req, res) {
  try {
    const event_id = parseInt(req.params.id);
    const user_id  = req.user.user_id;

    await pool.query('CALL sp_cancel_registration(?, ?, @result)', [user_id, event_id]);
    const [[{ '@result': result }]] = await pool.query('SELECT @result');

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

    const [registrations] = await pool.query(sql, params);

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

    if (!['qr_scan', 'manual'].includes(method)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_METHOD', message: 'method must be "qr_scan" or "manual".' }
      });
    }

    await pool.query('CALL sp_mark_attendance(?, ?, ?, @result)', [user_id, event_id, method]);
    const [[{ '@result': result }]] = await pool.query('SELECT @result');

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

async function generateCertificate(req, res) {
  try {
    const event_id = parseInt(req.params.id);
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'user_id is required.' }
      });
    }

    const [regRows] = await pool.query(
      `SELECT r.registration_id, r.status AS reg_status,
              e.event_name,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name
       FROM registrations r
         INNER JOIN events e ON r.event_id = e.event_id
         INNER JOIN users u  ON r.user_id  = u.user_id
       WHERE r.user_id = ? AND r.event_id = ? AND r.status IN ('attended', 'completed')`,
      [user_id, event_id]
    );

    if (regRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_ELIGIBLE',
          message: 'Student must have attended the event to receive a certificate.'
        }
      });
    }

    const reg = regRows[0];

    const [existingCert] = await pool.query(
      'SELECT certificate_id, certificate_url FROM certificates WHERE registration_id = ?',
      [reg.registration_id]
    );

    if (existingCert.length > 0) {
      return res.status(200).json({
        success: true,
        data: {
          ...existingCert[0],
          message: 'Certificate already exists.',
          already_exists: true,
        }
      });
    }

    const certHash = crypto
      .createHash('sha256')
      .update(`${reg.registration_id}-${event_id}-${user_id}-${Date.now()}`)
      .digest('hex');

    const certUrl = `/certificates/${certHash}.pdf`;

    const [result] = await pool.query(
      `INSERT INTO certificates (registration_id, certificate_url, certificate_hash)
       VALUES (?, ?, ?)`,
      [reg.registration_id, certUrl, certHash]
    );

    await pool.query(
      `UPDATE registrations SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE registration_id = ? AND status = 'attended'`,
      [reg.registration_id]
    );

    return res.status(201).json({
      success: true,
      data: {
        certificate_id: result.insertId,
        registration_id: reg.registration_id,
        student_name: reg.student_name,
        event_name: reg.event_name,
        certificate_url: certUrl,
        certificate_hash: certHash,
        message: `Certificate generated for ${reg.student_name}.`
      }
    });

  } catch (err) {
    console.error('[RegistrationController] generateCertificate error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate certificate.' }
    });
  }
}

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  markAttendance,
  generateCertificate,
};
