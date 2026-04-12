/**
 * ============================================================
 * Event Controller — CRUD Operations for Events
 * ============================================================
 *
 * Handles creation, retrieval, update, and cancellation of
 * events. Executes raw SQL queries and stored procedures
 * directly against the MySQL database — no ORM.
 *
 * Query patterns mirror those defined in 04_queries.sql.
 * ============================================================
 */

const { pool } = require('../config/db');

/**
 * GET /api/events
 *
 * List events with optional filters and search.
 *
 * Query params:
 *   ?status=upcoming        — Filter by event status
 *   ?category=Technical     — Filter by category name
 *   ?search=hackathon       — Full-text search on name + description
 *   ?date_from=2026-05-01   — Events starting on or after this date
 *   ?date_to=2026-06-30     — Events starting on or before this date
 *   ?sort_by=popularity     — Sort by fill rate (default: event_date ASC)
 *   ?page=1&limit=20        — Pagination
 */
async function listEvents(req, res) {
  try {
    const {
      status,
      category,
      search,
      date_from,
      date_to,
      sort_by = 'date',
      page  = 1,
      limit = 20,
    } = req.query;

    // ── Build dynamic WHERE clause ──
    const conditions = [];
    const params     = [];

    if (status) {
      conditions.push('e.status = ?');
      params.push(status);
    }

    if (category) {
      conditions.push('ec.category_name = ?');
      params.push(category);
    }

    if (date_from) {
      conditions.push('e.event_date >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('e.event_date <= ?');
      params.push(date_to);
    }

    // Full-text search requires a separate approach
    let searchClause = '';
    let relevanceSelect = '';
    if (search) {
      searchClause = 'AND MATCH(e.event_name, e.description) AGAINST(? IN NATURAL LANGUAGE MODE)';
      relevanceSelect = ', MATCH(e.event_name, e.description) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance';
      params.push(search); // for WHERE
    }

    const whereSQL = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ') + ' ' + searchClause
      : (searchClause ? 'WHERE 1=1 ' + searchClause : '');

    // ── Sorting ──
    let orderSQL;
    switch (sort_by) {
      case 'popularity':
        orderSQL = 'ORDER BY fill_rate_pct DESC, e.event_date ASC';
        break;
      case 'date_desc':
        orderSQL = 'ORDER BY e.event_date DESC';
        break;
      case 'name':
        orderSQL = 'ORDER BY e.event_name ASC';
        break;
      case 'relevance':
        orderSQL = search ? 'ORDER BY relevance DESC' : 'ORDER BY e.event_date ASC';
        break;
      default:
        orderSQL = 'ORDER BY e.event_date ASC';
    }

    // ── Pagination ──
    const pageNum   = Math.max(1, parseInt(page) || 1);
    const limitVal  = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset    = (pageNum - 1) * limitVal;

    // ── Count total matching rows (for pagination metadata) ──
    const countParams = [...params];
    const countSQL = `
      SELECT COUNT(*) AS total
      FROM events e
        INNER JOIN event_categories ec ON e.category_id = ec.category_id
      ${whereSQL}
    `;
    const [countRows] = await pool.query(countSQL, countParams);
    const total = countRows[0].total;

    // ── Fetch page of results ──
    // For the main query, if search is used we need the param twice
    // (once for SELECT relevance, once for WHERE)
    const mainParams = search ? [search, ...params] : [...params];
    mainParams.push(limitVal, offset);

    const sql = `
      SELECT
        e.event_id,
        e.event_name,
        e.description,
        e.event_date,
        e.end_date,
        e.status,
        e.max_capacity,
        e.available_seats,
        e.registration_fee,
        e.banner_url,
        ROUND(((e.max_capacity - e.available_seats) / e.max_capacity) * 100, 1) AS fill_rate_pct,
        ec.category_id,
        ec.category_name,
        v.venue_id,
        v.venue_name,
        v.building,
        e.organizer_id,
        CONCAT(u.first_name, ' ', u.last_name) AS organizer_name
        ${relevanceSelect}
      FROM events e
        INNER JOIN event_categories ec ON e.category_id  = ec.category_id
        INNER JOIN venues v            ON e.venue_id     = v.venue_id
        INNER JOIN users u             ON e.organizer_id = u.user_id
      ${whereSQL}
      ${orderSQL}
      LIMIT ? OFFSET ?
    `;

    const [events] = await pool.query(sql, mainParams);

    return res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page:     pageNum,
          per_page: limitVal,
          total,
          pages:    Math.ceil(total / limitVal),
        }
      }
    });

  } catch (err) {
    console.error('[EventController] listEvents error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch events.' }
    });
  }
}

/**
 * GET /api/events/:id
 *
 * Fetch full details of a single event, including venue,
 * category, organizer, and participant count.
 */
async function getEvent(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        e.event_id,
        e.event_name,
        e.description,
        e.event_date,
        e.end_date,
        e.status,
        e.max_capacity,
        e.available_seats,
        (e.max_capacity - e.available_seats) AS registered_count,
        e.registration_fee,
        e.banner_url,
        e.created_at,
        e.updated_at,
        ec.category_id,
        ec.category_name,
        v.venue_id,
        v.venue_name,
        v.building,
        v.capacity   AS venue_capacity,
        v.facilities AS venue_facilities,
        e.organizer_id,
        CONCAT(u.first_name, ' ', u.last_name) AS organizer_name,
        u.email      AS organizer_email
      FROM events e
        INNER JOIN event_categories ec ON e.category_id  = ec.category_id
        INNER JOIN venues v            ON e.venue_id     = v.venue_id
        INNER JOIN users u             ON e.organizer_id = u.user_id
      WHERE e.event_id = ?
    `;
    const [rows] = await pool.execute(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: `Event with ID ${id} does not exist.` }
      });
    }

    return res.status(200).json({ success: true, data: rows[0] });

  } catch (err) {
    console.error('[EventController] getEvent error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch event details.' }
    });
  }
}

/**
 * POST /api/events
 *
 * Create a new event.
 * Requires: organizer or admin role.
 *
 * Body: { event_name, description, category_id, venue_id, event_date,
 *         end_date?, max_capacity, registration_fee?, banner_url? }
 */
async function createEvent(req, res) {
  try {
    const {
      event_name,
      description  = null,
      category_id,
      venue_id,
      event_date,
      end_date     = null,
      max_capacity,
      registration_fee = 0.00,
      banner_url   = null,
    } = req.body;

    // ── Input validation ──
    if (!event_name || !category_id || !venue_id || !event_date || !max_capacity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Fields event_name, category_id, venue_id, event_date, and max_capacity are required.'
        }
      });
    }

    if (max_capacity <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CAPACITY', message: 'max_capacity must be greater than 0.' }
      });
    }

    // The organizer is the authenticated user
    const organizer_id = req.user.user_id;

    const sql = `
      INSERT INTO events
        (event_name, description, category_id, venue_id, organizer_id,
         event_date, end_date, max_capacity, available_seats,
         registration_fee, banner_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      event_name, description, category_id, venue_id, organizer_id,
      event_date, end_date, max_capacity, max_capacity, // available_seats starts at max
      registration_fee, banner_url,
    ]);

    const newEventId = result.insertId;

    // ── Notify all students about the new event ──
    // Single INSERT...SELECT — no JS loop, fully server-side
    const eventDateFormatted = new Date(event_date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

    try {
      await pool.execute(`
        INSERT INTO notifications (user_id, event_id, title, message, type)
        SELECT
          u.user_id,
          ?,
          ?,
          ?,
          'update'
        FROM users u
        WHERE u.role = 'student'
      `, [
        newEventId,
        `New Event: ${event_name}`,
        `A new event "${event_name}" has been announced for ${eventDateFormatted}. Check it out and register before seats fill up!`,
      ]);
    } catch (notifErr) {
      // Log but don't fail the request — the event was created successfully
      console.error('[EventController] Failed to broadcast notifications:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      data: {
        event_id: newEventId,
        event_name,
        organizer_id,
        max_capacity,
        available_seats: max_capacity,
        status: 'upcoming',
      }
    });

  } catch (err) {
    // ── Handle FK constraint violations ──
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Invalid category_id or venue_id. Referenced record does not exist.'
        }
      });
    }

    // ── Handle CHECK constraint violations (MySQL 8.0.16+) ──
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.errno === 3819) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONSTRAINT_VIOLATION',
          message: 'Data validation failed. Check capacity values and date ordering.'
        }
      });
    }

    console.error('[EventController] createEvent error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create event.' }
    });
  }
}

/**
 * PUT /api/events/:id
 *
 * Update an existing event's details.
 * Requires: organizer (owner) or admin role.
 *
 * Body: Any subset of { event_name, description, category_id, venue_id,
 *        event_date, end_date, max_capacity, registration_fee, status, banner_url }
 */
async function updateEvent(req, res) {
  try {
    const { id } = req.params;

    // ── Verify event exists and user is the owner (or admin) ──
    const [existing] = await pool.execute(
      'SELECT event_id, organizer_id, max_capacity, available_seats FROM events WHERE event_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: `Event with ID ${id} does not exist.` }
      });
    }

    // Only the organizer who created the event or an admin can update
    if (req.user.role !== 'admin' && existing[0].organizer_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only update events you organized.' }
      });
    }

    // ── Build dynamic SET clause from provided fields ──
    const allowedFields = [
      'event_name', 'description', 'category_id', 'venue_id',
      'event_date', 'end_date', 'registration_fee', 'status', 'banner_url',
    ];

    const setClauses = [];
    const params     = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    // Handle max_capacity change — also adjust available_seats proportionally
    if (req.body.max_capacity !== undefined) {
      const newMax = parseInt(req.body.max_capacity);
      const oldMax = existing[0].max_capacity;
      const oldAvail = existing[0].available_seats;
      const registered = oldMax - oldAvail;

      if (newMax < registered) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CAPACITY_TOO_LOW',
            message: `Cannot reduce capacity below current registrations (${registered}).`
          }
        });
      }

      setClauses.push('max_capacity = ?', 'available_seats = ?');
      params.push(newMax, newMax - registered);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_CHANGES', message: 'No valid fields provided for update.' }
      });
    }

    params.push(id); // WHERE event_id = ?

    const sql = `UPDATE events SET ${setClauses.join(', ')} WHERE event_id = ?`;
    await pool.execute(sql, params);

    // Fetch updated event and return
    const [updated] = await pool.execute(
      'SELECT * FROM events WHERE event_id = ?', [id]
    );

    return res.status(200).json({ success: true, data: updated[0] });

  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REFERENCE', message: 'Invalid category_id or venue_id.' }
      });
    }
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.errno === 3819) {
      return res.status(400).json({
        success: false,
        error: { code: 'CONSTRAINT_VIOLATION', message: 'Data validation failed.' }
      });
    }

    console.error('[EventController] updateEvent error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update event.' }
    });
  }
}

/**
 * DELETE /api/events/:id/cancel
 *
 * Cancel an event using the sp_cancel_event stored procedure.
 * This atomically cancels all registrations, restores seats,
 * and sends notifications to affected users.
 *
 * Requires: organizer (owner) or admin role.
 */
async function cancelEvent(req, res) {
  try {
    const { id } = req.params;

    // ── Verify ownership ──
    const [existing] = await pool.execute(
      'SELECT organizer_id FROM events WHERE event_id = ?', [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: `Event with ID ${id} does not exist.` }
      });
    }

    if (req.user.role !== 'admin' && existing[0].organizer_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only cancel events you organized.' }
      });
    }

    // ── Call stored procedure (must use pool.query for @session vars) ──
    const [rows] = await pool.query('CALL sp_cancel_event(?, @result)', [id]);
    const [[{ '@result': result }]] = await pool.query('SELECT @result');

    if (result !== 'SUCCESS') {
      const messages = {
        ERROR_CANNOT_CANCEL: 'Event cannot be cancelled (may not be in upcoming status).',
      };
      return res.status(400).json({
        success: false,
        error: {
          code: result,
          message: messages[result] || 'Event cancellation failed.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: { event_id: parseInt(id), status: 'cancelled', message: 'Event cancelled. All registrants have been notified.' }
    });

  } catch (err) {
    console.error('[EventController] cancelEvent error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel event.' }
    });
  }
}

/**
 * GET /api/events/:id/participants
 *
 * List all registered participants for an event, including
 * their attendance status.
 *
 * Requires: organizer (owner) or admin role.
 */
async function getParticipants(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        u.email,
        u.department,
        r.registration_id,
        r.status          AS registration_status,
        r.registered_at,
        CASE WHEN a.attendance_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS checked_in,
        a.check_in_time,
        a.method          AS check_in_method
      FROM registrations r
        INNER JOIN users u      ON r.user_id         = u.user_id
        LEFT  JOIN attendance a ON r.registration_id  = a.registration_id
      WHERE r.event_id = ?
        AND r.status != 'cancelled'
      ORDER BY r.registered_at ASC
    `;
    const [participants] = await pool.execute(sql, [id]);

    return res.status(200).json({
      success: true,
      data: {
        event_id:     parseInt(id),
        total_active: participants.length,
        participants,
      }
    });

  } catch (err) {
    console.error('[EventController] getParticipants error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch participants.' }
    });
  }
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  getParticipants,
};
