/**
 * ============================================================
 * Authentication Middleware — JWT Verification
 * ============================================================
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches the decoded payload (user_id, role)
 * to `req.user` for downstream controllers.
 * ============================================================
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware: Require a valid JWT on the request.
 * Returns 401 if token is missing/invalid/expired.
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Authentication required. Provide a Bearer token.' }
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user payload to request for downstream use
    req.user = {
      user_id: decoded.user_id,
      email:   decoded.email,
      role:    decoded.role,
    };

    next();
  } catch (err) {
    // Differentiate between expired and malformed tokens
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired. Please log in again.' }
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token.' }
    });
  }
}

/**
 * Middleware factory: Restrict access to specific roles.
 * Usage: authorize('organizer', 'admin')
 *
 * Must be used AFTER authenticate middleware.
 *
 * @param  {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_AUTH', message: 'Authentication required before authorization.' }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`
        }
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
