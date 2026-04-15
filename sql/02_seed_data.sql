USE college_events;

INSERT INTO users (first_name, last_name, email, password_hash, role, department, phone) VALUES
('Arjun',    'Mehta',     'arjun.mehta@iiit-bh.ac.in',     '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'admin',     'Computer Science', '9876543210'),
('Priya',    'Sharma',    'priya.sharma@iiit-bh.ac.in',    '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'organizer', 'Computer Science', '9876543211'),
('Rohan',    'Gupta',     'rohan.gupta@iiit-bh.ac.in',     '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'organizer', 'Electronics',      '9876543212'),
('Sneha',    'Reddy',     'sneha.reddy@iiit-bh.ac.in',     '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'student',   'Computer Science', '9876543213'),
('Vikram',   'Singh',     'vikram.singh@iiit-bh.ac.in',    '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'student',   'Mechanical',       '9876543214'),
('Ananya',   'Patel',     'ananya.patel@iiit-bh.ac.in',    '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'student',   'Electronics',      '9876543215'),
('Karthik',  'Nair',      'karthik.nair@iiit-bh.ac.in',    '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'student',   'Civil',            '9876543216'),
('Deepika',  'Joshi',     'deepika.joshi@iiit-bh.ac.in',   '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'student',   'Computer Science', '9876543217'),
('Rahul',    'Verma',     'rahul.verma@iiit-bh.ac.in',     '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'student',   'Information Tech', '9876543218'),
('Meera',    'Kulkarni',  'meera.kulkarni@iiit-bh.ac.in',  '$2b$10$xK4Ej5QaO0Gz1nMVx2F5aeZQx7b5Yj2KlM9Rv3NpWfHsD4TqE6GO', 'organizer', 'Sports Science',   '9876543219');

INSERT INTO event_categories (category_name, description) VALUES
('Technical',  'Hackathons, coding contests, tech talks, and workshops'),
('Cultural',   'Music, dance, drama, art exhibitions, and literary events'),
('Sports',     'Inter-department and inter-college sports tournaments'),
('Workshop',   'Hands-on skill-building sessions and boot camps'),
('Seminar',    'Guest lectures, panel discussions, and academic talks');

INSERT INTO venues (venue_name, building, capacity, facilities) VALUES
('Main Auditorium',     'Central Block',    500,  'Projector, Sound System, AC, Stage Lighting'),
('Seminar Hall A',      'Academic Block 1', 150,  'Projector, Whiteboard, AC, Video Conferencing'),
('Seminar Hall B',      'Academic Block 2', 120,  'Projector, Whiteboard, AC'),
('Open Air Theatre',    'Campus Ground',    1000, 'Stage, Flood Lights, Open Seating'),
('Computer Lab 1',      'IT Block',         60,   'Networked PCs, Projector, AC'),
('Sports Complex',      'Sports Block',     2000, 'Indoor Courts, Scoreboards, PA System'),
('Conference Room 101', 'Admin Block',      40,   'Smart Board, Video Conferencing, AC');

INSERT INTO events (event_name, description, category_id, venue_id, organizer_id, event_date, end_date, max_capacity, available_seats, status, registration_fee) VALUES
('CodeStorm 2026',
 'A 24-hour national-level hackathon. Build innovative solutions for real-world problems. Teams of 2-4 members.',
 1, 5, 2, '2026-05-15 09:00:00', '2026-05-16 09:00:00', 60, 45, 'upcoming', 200.00),

('Rhythm & Blues Night',
 'Annual cultural evening featuring live band performances, solo singing, and group dance competitions.',
 2, 4, 3, '2026-05-20 18:00:00', '2026-05-20 22:00:00', 800, 650, 'upcoming', 0.00),

('Inter-Department Cricket Tournament',
 'T20 format cricket tournament. Each department fields one team. Matches held over 3 days.',
 3, 6, 10, '2026-06-01 08:00:00', '2026-06-03 18:00:00', 200, 180, 'upcoming', 50.00),

('AI/ML Workshop: From Zero to Deploy',
 'Intensive 2-day workshop covering machine learning fundamentals, model training, and deployment with Flask.',
 4, 2, 2, '2026-05-10 10:00:00', '2026-05-11 17:00:00', 100, 72, 'upcoming', 500.00),

('Guest Lecture: Future of Quantum Computing',
 'Distinguished lecture by Dr. Kavitha Ranganathan on quantum computing advances and industry applications.',
 5, 1, 3, '2026-04-25 14:00:00', '2026-04-25 16:00:00', 400, 350, 'upcoming', 0.00),

('Web Dev Bootcamp',
 'Full-stack web development bootcamp covering React, Node.js, and MySQL. Certificate upon completion.',
 4, 5, 2, '2026-04-18 09:00:00', '2026-04-20 17:00:00', 55, 10, 'ongoing', 750.00),

('Annual Sports Day',
 'Track and field events, tug-of-war, relay races. Open to all students and faculty.',
 3, 6, 10, '2026-03-15 07:00:00', '2026-03-15 18:00:00', 1500, 0, 'completed', 0.00);

INSERT INTO registrations (user_id, event_id, status) VALUES

(4, 1, 'registered'),
(5, 1, 'registered'),
(6, 1, 'registered'),
(8, 1, 'registered'),

(4, 2, 'registered'),
(5, 2, 'registered'),
(7, 2, 'registered'),
(9, 2, 'registered'),

(4, 4, 'registered'),
(6, 4, 'registered'),
(8, 4, 'registered'),
(9, 4, 'registered'),

(4, 5, 'registered'),
(5, 5, 'registered'),
(6, 5, 'registered'),
(7, 5, 'registered'),
(8, 5, 'registered'),

(4, 6, 'attended'),
(5, 6, 'attended'),
(6, 6, 'attended'),
(7, 6, 'registered'),
(8, 6, 'attended'),
(9, 6, 'registered'),

(4, 7, 'completed'),
(5, 7, 'completed'),
(6, 7, 'completed'),
(7, 7, 'completed'),
(8, 7, 'completed'),
(9, 7, 'completed');

INSERT INTO attendance (registration_id, check_in_time, check_out_time, method) VALUES

(18, '2026-04-18 08:55:00', NULL, 'qr_scan'),
(19, '2026-04-18 09:02:00', NULL, 'qr_scan'),
(20, '2026-04-18 09:10:00', NULL, 'manual'),
(22, '2026-04-18 08:50:00', NULL, 'qr_scan'),

(24, '2026-03-15 06:50:00', '2026-03-15 17:30:00', 'manual'),
(25, '2026-03-15 07:00:00', '2026-03-15 18:00:00', 'manual'),
(26, '2026-03-15 07:05:00', '2026-03-15 16:45:00', 'qr_scan'),
(27, '2026-03-15 06:55:00', '2026-03-15 17:50:00', 'manual'),
(28, '2026-03-15 07:10:00', '2026-03-15 17:00:00', 'qr_scan'),
(29, '2026-03-15 07:15:00', '2026-03-15 16:30:00', 'qr_scan');

INSERT INTO feedback (user_id, event_id, rating, comments) VALUES
(4, 7, 5, 'Excellent organization! The relay race was the highlight. Would love more inter-college events.'),
(5, 7, 4, 'Great event, but the schedule was a bit tight. More water stations needed.'),
(6, 7, 5, 'Best sports day in years! Loved the tug-of-war finals.'),
(7, 7, 3, 'Decent event. Some events started late. Better time management would help.'),
(8, 7, 4, 'Well organized overall. The track events were thrilling.'),
(9, 7, 5, 'Amazing atmosphere. The closing ceremony was fantastic.');

INSERT INTO certificates (registration_id, certificate_url, certificate_hash) VALUES
(24, '/certificates/sports_day_2026_sneha_reddy.pdf',   SHA2('CERT-7-4-2026', 256)),
(25, '/certificates/sports_day_2026_vikram_singh.pdf',   SHA2('CERT-7-5-2026', 256)),
(26, '/certificates/sports_day_2026_ananya_patel.pdf',   SHA2('CERT-7-6-2026', 256)),
(27, '/certificates/sports_day_2026_karthik_nair.pdf',   SHA2('CERT-7-7-2026', 256)),
(28, '/certificates/sports_day_2026_deepika_joshi.pdf',  SHA2('CERT-7-8-2026', 256)),
(29, '/certificates/sports_day_2026_rahul_verma.pdf',    SHA2('CERT-7-9-2026', 256));

INSERT INTO notifications (user_id, event_id, title, message, type, is_read) VALUES
(4, 1, 'Registration Confirmed', 'You are registered for CodeStorm 2026. See you on May 15!', 'general', TRUE),
(5, 1, 'Registration Confirmed', 'You are registered for CodeStorm 2026. See you on May 15!', 'general', TRUE),
(4, 4, 'Workshop Reminder', 'AI/ML Workshop starts tomorrow at 10:00 AM in Seminar Hall A.', 'reminder', FALSE),
(6, 4, 'Workshop Reminder', 'AI/ML Workshop starts tomorrow at 10:00 AM in Seminar Hall A.', 'reminder', FALSE),
(4, 7, 'Certificate Ready', 'Your participation certificate for Annual Sports Day is ready for download.', 'general', FALSE),
(5, 7, 'Certificate Ready', 'Your participation certificate for Annual Sports Day is ready for download.', 'general', TRUE);
