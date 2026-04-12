-- ============================================================
-- College Event Management System — DDL (Schema Definition)
-- Engine: MySQL 8.0+ (InnoDB)
-- Normalization: BCNF
-- ============================================================

CREATE DATABASE IF NOT EXISTS college_events
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE college_events;

-- ──────────────────────────────────────────────
-- 1. Users
-- ──────────────────────────────────────────────
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    first_name    VARCHAR(50)   NOT NULL,
    last_name     VARCHAR(50)   NOT NULL,
    email         VARCHAR(100)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('student', 'organizer', 'admin') NOT NULL DEFAULT 'student',
    department    VARCHAR(100),
    phone         VARCHAR(15),
    fcm_token     VARCHAR(255),
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ──────────────────────────────────────────────
-- 2. Event Categories
-- ──────────────────────────────────────────────
CREATE TABLE event_categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50)  NOT NULL UNIQUE,
    description   VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ──────────────────────────────────────────────
-- 3. Venues
-- ──────────────────────────────────────────────
CREATE TABLE venues (
    venue_id   INT AUTO_INCREMENT PRIMARY KEY,
    venue_name VARCHAR(100) NOT NULL,
    building   VARCHAR(100),
    capacity   INT UNSIGNED NOT NULL,
    facilities VARCHAR(500),

    CHECK (capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ──────────────────────────────────────────────
-- 4. Events
-- ──────────────────────────────────────────────
CREATE TABLE events (
    event_id        INT AUTO_INCREMENT PRIMARY KEY,
    event_name      VARCHAR(200) NOT NULL,
    description     TEXT,
    category_id     INT          NOT NULL,
    venue_id        INT          NOT NULL,
    organizer_id    INT          NOT NULL,
    event_date      DATETIME     NOT NULL,
    end_date        DATETIME,
    max_capacity    INT UNSIGNED NOT NULL,
    available_seats INT UNSIGNED NOT NULL,
    status          ENUM('upcoming', 'ongoing', 'completed', 'cancelled')
                        NOT NULL DEFAULT 'upcoming',
    registration_fee DECIMAL(10,2) DEFAULT 0.00,
    banner_url      VARCHAR(500),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_category  FOREIGN KEY (category_id)  REFERENCES event_categories(category_id) ON UPDATE CASCADE,
    CONSTRAINT fk_events_venue     FOREIGN KEY (venue_id)     REFERENCES venues(venue_id)               ON UPDATE CASCADE,
    CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users(user_id)                 ON UPDATE CASCADE,

    CHECK (max_capacity > 0),
    CHECK (available_seats <= max_capacity),
    CHECK (end_date IS NULL OR end_date > event_date),

    INDEX idx_events_date (event_date),
    INDEX idx_events_status (status),
    INDEX idx_events_category (category_id),
    FULLTEXT INDEX ft_events_search (event_name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ──────────────────────────────────────────────
-- 5. Registrations
-- ──────────────────────────────────────────────
CREATE TABLE registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    event_id        INT NOT NULL,
    status          ENUM('registered', 'attended', 'completed', 'cancelled')
                        NOT NULL DEFAULT 'registered',
    registered_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reg_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_user_event (user_id, event_id),
    INDEX idx_reg_event (event_id),
    INDEX idx_reg_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ──────────────────────────────────────────────
-- 6. Attendance
-- ──────────────────────────────────────────────
CREATE TABLE attendance (
    attendance_id   INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    check_in_time   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_time  TIMESTAMP NULL,
    method          ENUM('qr_scan', 'manual') NOT NULL DEFAULT 'manual',

    CONSTRAINT fk_att_registration FOREIGN KEY (registration_id)
        REFERENCES registrations(registration_id) ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_attendance_reg (registration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ──────────────────────────────────────────────
-- 7. Feedback
-- ──────────────────────────────────────────────
CREATE TABLE feedback (
    feedback_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT      NOT NULL,
    event_id     INT      NOT NULL,
    rating       TINYINT  NOT NULL,
    comments     TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fb_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fb_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE ON UPDATE CASCADE,

    CHECK (rating BETWEEN 1 AND 5),
    UNIQUE KEY uq_feedback_user_event (user_id, event_id),
    INDEX idx_fb_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ──────────────────────────────────────────────
-- 8. Certificates
-- ──────────────────────────────────────────────
CREATE TABLE certificates (
    certificate_id   INT AUTO_INCREMENT PRIMARY KEY,
    registration_id  INT          NOT NULL,
    certificate_url  VARCHAR(500) NOT NULL,
    certificate_hash VARCHAR(64)  NOT NULL UNIQUE,
    issued_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cert_registration FOREIGN KEY (registration_id)
        REFERENCES registrations(registration_id) ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_cert_reg (registration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ──────────────────────────────────────────────
-- 9. Notifications
-- ──────────────────────────────────────────────
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT          NOT NULL,
    event_id        INT,
    title           VARCHAR(200) NOT NULL,
    message         TEXT         NOT NULL,
    type            ENUM('reminder', 'update', 'cancellation', 'general')
                        NOT NULL DEFAULT 'general',
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notif_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_notif_user_read (user_id, is_read),
    INDEX idx_notif_sent (sent_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
