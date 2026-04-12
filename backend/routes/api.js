/**
 * ============================================================
 * API Routes — Express Router Configuration
 * ============================================================
 *
 * Maps all RESTful endpoints to their controller functions
 * with appropriate authentication and authorization middleware.
 *
 * Route groups:
 *   /api/auth          — Public auth routes (register, login)
 *   /api/events        — Event CRUD (mixed access)
 *   /api/users/me      — Authenticated user's own resources
 *   /api/analytics     — Reporting endpoints (organizer/admin)
 *   /api/notifications — User notification management
 * ============================================================
 */

const express = require('express');
const router  = express.Router();

// ── Middleware ──
const { authenticate, authorize } = require('../middleware/auth');

// ── Controllers ──
const authController         = require('../controllers/authController');
const eventController        = require('../controllers/eventController');
const registrationController = require('../controllers/registrationController');
const feedbackController     = require('../controllers/feedbackController');
const analyticsController    = require('../controllers/analyticsController');
const notificationController = require('../controllers/notificationController');


// ╔══════════════════════════════════════════════════════════╗
// ║  AUTH ROUTES (Public — no token required)               ║
// ╚══════════════════════════════════════════════════════════╝

router.post('/auth/register', authController.register);
router.post('/auth/login',    authController.login);
router.get('/auth/me',        authenticate, authController.getProfile);


// ╔══════════════════════════════════════════════════════════╗
// ║  EVENT ROUTES                                           ║
// ╚══════════════════════════════════════════════════════════╝

// Public (authenticated) — any role can browse events
router.get('/events',     authenticate, eventController.listEvents);
router.get('/events/:id', authenticate, eventController.getEvent);

// Organizer/Admin — event management
router.post('/events',
  authenticate,
  authorize('organizer', 'admin'),
  eventController.createEvent
);

router.put('/events/:id',
  authenticate,
  authorize('organizer', 'admin'),
  eventController.updateEvent
);

router.post('/events/:id/cancel',
  authenticate,
  authorize('organizer', 'admin'),
  eventController.cancelEvent
);

router.get('/events/:id/participants',
  authenticate,
  authorize('organizer', 'admin'),
  eventController.getParticipants
);


// ╔══════════════════════════════════════════════════════════╗
// ║  REGISTRATION ROUTES                                    ║
// ╚══════════════════════════════════════════════════════════╝

// Student — register/cancel for events
router.post('/events/:id/register',
  authenticate,
  authorize('student'),
  registrationController.registerForEvent
);

router.delete('/events/:id/register',
  authenticate,
  authorize('student'),
  registrationController.cancelRegistration
);

// Organizer/Admin — mark attendance
router.post('/events/:id/attendance',
  authenticate,
  authorize('organizer', 'admin'),
  registrationController.markAttendance
);

// Organizer/Admin — generate certificate
router.post('/events/:id/certificates',
  authenticate,
  authorize('organizer', 'admin'),
  registrationController.generateCertificate
);


// ╔══════════════════════════════════════════════════════════╗
// ║  FEEDBACK ROUTES                                        ║
// ╚══════════════════════════════════════════════════════════╝

router.post('/events/:id/feedback',
  authenticate,
  authorize('student'),
  feedbackController.submitFeedback
);

router.get('/events/:id/feedback',
  authenticate,
  feedbackController.getEventFeedback
);


// ╔══════════════════════════════════════════════════════════╗
// ║  USER ROUTES (Authenticated user's own resources)       ║
// ╚══════════════════════════════════════════════════════════╝

router.get('/users/me/registrations',
  authenticate,
  registrationController.getMyRegistrations
);

router.get('/users/me/notifications',
  authenticate,
  notificationController.getMyNotifications
);


// ╔══════════════════════════════════════════════════════════╗
// ║  NOTIFICATION ROUTES                                    ║
// ╚══════════════════════════════════════════════════════════╝

router.patch('/notifications/:id/read',
  authenticate,
  notificationController.markAsRead
);

router.patch('/notifications/read-all',
  authenticate,
  notificationController.markAllAsRead
);


// ╔══════════════════════════════════════════════════════════╗
// ║  ANALYTICS ROUTES (Organizer/Admin)                     ║
// ╚══════════════════════════════════════════════════════════╝

router.get('/analytics/events/:id/attendance',
  authenticate,
  authorize('organizer', 'admin'),
  analyticsController.getAttendanceRate
);

router.get('/analytics/events/:id/feedback',
  authenticate,
  authorize('organizer', 'admin'),
  analyticsController.getFeedbackStats
);

router.get('/analytics/departments',
  authenticate,
  authorize('organizer', 'admin'),
  analyticsController.getDepartmentStats
);

router.get('/analytics/trends',
  authenticate,
  authorize('organizer', 'admin'),
  analyticsController.getMonthlyTrends
);

router.get('/analytics/popular-events',
  authenticate,
  analyticsController.getPopularEvents
);

router.get('/analytics/student-engagement',
  authenticate,
  authorize('admin'),
  analyticsController.getStudentEngagement
);


module.exports = router;
