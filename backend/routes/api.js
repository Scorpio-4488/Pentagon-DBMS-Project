const express = require('express');

const { authenticate, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');
const authController = require('../controllers/authController');
const eventController = require('../controllers/eventController');
const feedbackController = require('../controllers/feedbackController');
const notificationController = require('../controllers/notificationController');
const registrationController = require('../controllers/registrationController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getProfile);
router.get('/debug/user', authController.debugUser);

router.get('/events', authenticate, eventController.listEvents);
router.get('/events/:id', authenticate, eventController.getEvent);
router.post(
  '/events',
  authenticate,
  authorize('organizer', 'admin'),
  eventController.createEvent
);
router.put(
  '/events/:id',
  authenticate,
  authorize('organizer', 'admin'),
  eventController.updateEvent
);
router.post(
  '/events/:id/cancel',
  authenticate,
  authorize('organizer', 'admin'),
  eventController.cancelEvent
);
router.get(
  '/events/:id/participants',
  authenticate,
  authorize('organizer', 'admin'),
  eventController.getParticipants
);

router
  .route('/events/:id/register')
  .post(authenticate, authorize('student'), registrationController.registerForEvent)
  .delete(authenticate, authorize('student'), registrationController.cancelRegistration);

router.post(
  '/events/:id/attendance',
  authenticate,
  authorize('organizer', 'admin'),
  registrationController.markAttendance
);
router.post(
  '/events/:id/certificates',
  authenticate,
  authorize('organizer', 'admin'),
  registrationController.generateCertificate
);

router
  .route('/events/:id/feedback')
  .post(authenticate, authorize('student'), feedbackController.submitFeedback)
  .get(authenticate, feedbackController.getEventFeedback);

router.get(
  '/users/me/registrations',
  authenticate,
  registrationController.getMyRegistrations
);
router.get(
  '/users/me/notifications',
  authenticate,
  notificationController.getMyNotifications
);

router.patch('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.patch('/notifications/read-all', authenticate, notificationController.markAllAsRead);

router.get(
  '/analytics/events/:id/attendance',
  authenticate,
  authorize('organizer', 'admin'),
  analyticsController.getAttendanceRate
);
router.get(
  '/analytics/events/:id/feedback',
  authenticate,
  authorize('organizer', 'admin'),
  analyticsController.getFeedbackStats
);
router.get(
  '/analytics/departments',
  authenticate,
  authorize('organizer', 'admin'),
  analyticsController.getDepartmentStats
);
router.get(
  '/analytics/trends',
  authenticate,
  authorize('organizer', 'admin'),
  analyticsController.getMonthlyTrends
);
router.get('/analytics/popular-events', authenticate, analyticsController.getPopularEvents);
router.get(
  '/analytics/student-engagement',
  authenticate,
  authorize('admin'),
  analyticsController.getStudentEngagement
);

module.exports = router;
