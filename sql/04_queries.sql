USE college_events;

SELECT
    e.event_id,
    e.event_name,
    e.event_date,
    e.end_date,
    e.status,
    e.max_capacity,
    e.available_seats,
    e.registration_fee,
    ec.category_name,
    v.venue_name,
    v.building,
    CONCAT(u.first_name, ' ', u.last_name) AS organizer_name
FROM events e
    INNER JOIN event_categories ec ON e.category_id  = ec.category_id
    INNER JOIN venues v            ON e.venue_id     = v.venue_id
    INNER JOIN users u             ON e.organizer_id = u.user_id
WHERE e.status = 'upcoming'
ORDER BY e.event_date ASC;

SELECT
    e.event_id,
    e.event_name,
    ec.category_name,
    e.event_date,
    e.available_seats,
    MATCH(e.event_name, e.description) AGAINST('hackathon coding' IN NATURAL LANGUAGE MODE) AS relevance
FROM events e
    INNER JOIN event_categories ec ON e.category_id = ec.category_id
WHERE MATCH(e.event_name, e.description) AGAINST('hackathon coding' IN NATURAL LANGUAGE MODE)
ORDER BY relevance DESC;

SELECT
    e.event_id,
    e.event_name,
    ec.category_name,
    e.event_date,
    v.venue_name,
    e.available_seats
FROM events e
    INNER JOIN event_categories ec ON e.category_id = ec.category_id
    INNER JOIN venues v            ON e.venue_id    = v.venue_id
WHERE ec.category_name = 'Technical'
  AND e.event_date BETWEEN '2026-05-01' AND '2026-06-30'
  AND e.status = 'upcoming'
ORDER BY e.event_date ASC;

SELECT
    e.event_id,
    e.event_name,
    ec.category_name,
    e.event_date,
    v.venue_name,
    r.status        AS registration_status,
    r.registered_at
FROM registrations r
    INNER JOIN events e            ON r.event_id    = e.event_id
    INNER JOIN event_categories ec ON e.category_id = ec.category_id
    INNER JOIN venues v            ON e.venue_id    = v.venue_id
WHERE r.user_id = 4
ORDER BY e.event_date DESC;

SELECT
    e.event_id,
    e.event_name,
    ec.category_name,
    e.max_capacity,
    (e.max_capacity - e.available_seats) AS registrations,
    ROUND(((e.max_capacity - e.available_seats) / e.max_capacity) * 100, 1) AS fill_rate_pct
FROM events e
    INNER JOIN event_categories ec ON e.category_id = ec.category_id
WHERE e.status IN ('upcoming', 'ongoing')
ORDER BY fill_rate_pct DESC
LIMIT 10;

SELECT
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    u.email,
    u.department,
    r.status          AS registration_status,
    r.registered_at,
    CASE WHEN a.attendance_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS checked_in
FROM registrations r
    INNER JOIN users u      ON r.user_id         = u.user_id
    LEFT  JOIN attendance a ON r.registration_id  = a.registration_id
WHERE r.event_id = 1
  AND r.status != 'cancelled'
ORDER BY r.registered_at ASC;

UPDATE events
SET
    event_name   = 'CodeStorm 2026 — National Hackathon',
    description  = 'Updated: Now a 36-hour hackathon with ₹1L prize pool!',
    end_date     = '2026-05-16 21:00:00',
    updated_at   = CURRENT_TIMESTAMP
WHERE event_id = 1;

INSERT INTO attendance (registration_id, check_in_time, method)
SELECT r.registration_id, NOW(), 'qr_scan'
FROM registrations r
WHERE r.user_id = 4 AND r.event_id = 1 AND r.status = 'registered'
ON DUPLICATE KEY UPDATE check_in_time = NOW();

SELECT
    e.event_id,
    e.event_name,
    (e.max_capacity - e.available_seats) AS total_registered,
    COUNT(a.attendance_id)               AS total_attended,
    ROUND(
        (COUNT(a.attendance_id) / NULLIF(e.max_capacity - e.available_seats, 0)) * 100, 1
    ) AS attendance_rate_pct
FROM events e
    LEFT JOIN registrations r ON e.event_id = r.event_id AND r.status != 'cancelled'
    LEFT JOIN attendance a    ON r.registration_id = a.registration_id
WHERE e.event_id = 7
GROUP BY e.event_id, e.event_name, e.max_capacity, e.available_seats;

SELECT
    e.event_id,
    e.event_name,
    COUNT(f.feedback_id)     AS total_reviews,
    ROUND(AVG(f.rating), 2)  AS avg_rating,
    MIN(f.rating)            AS min_rating,
    MAX(f.rating)            AS max_rating
FROM events e
    INNER JOIN feedback f ON e.event_id = f.event_id
GROUP BY e.event_id, e.event_name
ORDER BY avg_rating DESC;

SELECT
    u.department,
    COUNT(DISTINCT r.registration_id) AS total_registrations,
    COUNT(DISTINCT r.event_id)        AS unique_events,
    COUNT(DISTINCT r.user_id)         AS unique_students
FROM registrations r
    INNER JOIN users u ON r.user_id = u.user_id
WHERE r.status != 'cancelled'
GROUP BY u.department
ORDER BY total_registrations DESC;

SELECT
    DATE_FORMAT(event_date, '%Y-%m')    AS month,
    COUNT(*)                            AS total_events,
    SUM(max_capacity - available_seats) AS total_registrations,
    ROUND(AVG(max_capacity - available_seats), 0) AS avg_registrations_per_event
FROM events
WHERE status != 'cancelled'
GROUP BY DATE_FORMAT(event_date, '%Y-%m')
ORDER BY month DESC;

SELECT
    e.event_id,
    e.event_name,
    ec.category_name,
    ROUND(AVG(f.rating), 2) AS avg_rating,
    COUNT(f.feedback_id)    AS review_count
FROM events e
    INNER JOIN event_categories ec ON e.category_id = ec.category_id
    INNER JOIN feedback f          ON e.event_id    = f.event_id
GROUP BY e.event_id, e.event_name, ec.category_name
HAVING COUNT(f.feedback_id) >= 3   -- minimum 3 reviews
ORDER BY avg_rating DESC, review_count DESC;

SELECT
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    u.department,
    COUNT(DISTINCT r.event_id)                                            AS events_registered,
    COUNT(DISTINCT CASE WHEN r.status = 'attended'  THEN r.event_id END) AS events_attended,
    COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.event_id END) AS events_completed,
    COUNT(DISTINCT f.event_id)                                            AS feedbacks_given
FROM users u
    LEFT JOIN registrations r ON u.user_id = r.user_id AND r.status != 'cancelled'
    LEFT JOIN feedback f      ON u.user_id = f.user_id
WHERE u.role = 'student'
GROUP BY u.user_id, u.first_name, u.last_name, u.department
ORDER BY events_registered DESC;
