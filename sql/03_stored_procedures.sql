USE college_events;

DELIMITER //

CREATE PROCEDURE sp_register_student(
    IN p_user_id  INT,
    IN p_event_id INT,
    OUT p_result  VARCHAR(50)
)
BEGIN
    DECLARE v_available    INT;
    DECLARE v_existing     INT;
    DECLARE v_event_status ENUM('upcoming', 'ongoing', 'completed', 'cancelled');

    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    START TRANSACTION;

    SELECT available_seats, status
    INTO v_available, v_event_status
    FROM events
    WHERE event_id = p_event_id
    FOR UPDATE;

    IF v_event_status != 'upcoming' THEN
        SET p_result = 'ERROR_EVENT_NOT_OPEN';
        ROLLBACK;

    ELSE
        SELECT COUNT(*) INTO v_existing
        FROM registrations
        WHERE user_id  = p_user_id
          AND event_id = p_event_id
          AND status  != 'cancelled';

        IF v_existing > 0 THEN
            SET p_result = 'ERROR_ALREADY_REGISTERED';
            ROLLBACK;

        ELSEIF v_available <= 0 THEN
            SET p_result = 'ERROR_NO_SEATS';
            ROLLBACK;

        ELSE
            INSERT INTO registrations (user_id, event_id, status)
            VALUES (p_user_id, p_event_id, 'registered');

            UPDATE events
            SET available_seats = available_seats - 1
            WHERE event_id = p_event_id;

            SET p_result = 'SUCCESS';
            COMMIT;
        END IF;
    END IF;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE sp_cancel_registration(
    IN p_user_id  INT,
    IN p_event_id INT,
    OUT p_result  VARCHAR(50)
)
BEGIN
    DECLARE v_reg_id     INT;
    DECLARE v_reg_status VARCHAR(20);

    START TRANSACTION;

    SELECT registration_id, status
    INTO v_reg_id, v_reg_status
    FROM registrations
    WHERE user_id = p_user_id AND event_id = p_event_id
    FOR UPDATE;

    IF v_reg_id IS NULL THEN
        SET p_result = 'ERROR_NOT_FOUND';
        ROLLBACK;
    ELSEIF v_reg_status = 'cancelled' THEN
        SET p_result = 'ERROR_ALREADY_CANCELLED';
        ROLLBACK;
    ELSE

        UPDATE registrations
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE registration_id = v_reg_id;

        UPDATE events
        SET available_seats = available_seats + 1
        WHERE event_id = p_event_id;

        SET p_result = 'SUCCESS';
        COMMIT;
    END IF;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE sp_cancel_event(
    IN p_event_id INT,
    OUT p_result  VARCHAR(50)
)
BEGIN
    DECLARE v_event_name VARCHAR(200);

    START TRANSACTION;

    SELECT event_name INTO v_event_name
    FROM events
    WHERE event_id = p_event_id AND status = 'upcoming'
    FOR UPDATE;

    IF v_event_name IS NULL THEN
        SET p_result = 'ERROR_CANNOT_CANCEL';
        ROLLBACK;
    ELSE

        UPDATE events
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE event_id = p_event_id;

        UPDATE registrations
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE event_id = p_event_id AND status IN ('registered');

        UPDATE events
        SET available_seats = max_capacity
        WHERE event_id = p_event_id;

        INSERT INTO notifications (user_id, event_id, title, message, type)
        SELECT r.user_id, p_event_id,
               'Event Cancelled',
               CONCAT('The event "', v_event_name, '" has been cancelled.'),
               'cancellation'
        FROM registrations r
        WHERE r.event_id = p_event_id AND r.status = 'cancelled';

        SET p_result = 'SUCCESS';
        COMMIT;
    END IF;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE sp_mark_attendance(
    IN p_user_id  INT,
    IN p_event_id INT,
    IN p_method   ENUM('qr_scan', 'manual'),
    OUT p_result  VARCHAR(50)
)
BEGIN
    DECLARE v_reg_id     INT;
    DECLARE v_reg_status VARCHAR(20);

    START TRANSACTION;

    SELECT registration_id, status
    INTO v_reg_id, v_reg_status
    FROM registrations
    WHERE user_id = p_user_id AND event_id = p_event_id
    FOR UPDATE;

    IF v_reg_id IS NULL THEN
        SET p_result = 'ERROR_NOT_REGISTERED';
        ROLLBACK;
    ELSEIF v_reg_status = 'cancelled' THEN
        SET p_result = 'ERROR_CANCELLED';
        ROLLBACK;
    ELSE

        INSERT INTO attendance (registration_id, check_in_time, method)
        VALUES (v_reg_id, NOW(), p_method)
        ON DUPLICATE KEY UPDATE check_in_time = NOW(), method = p_method;

        UPDATE registrations
        SET status = 'attended', updated_at = CURRENT_TIMESTAMP
        WHERE registration_id = v_reg_id AND status = 'registered';

        SET p_result = 'SUCCESS';
        COMMIT;
    END IF;
END //

DELIMITER ;
