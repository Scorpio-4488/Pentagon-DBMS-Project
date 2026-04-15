const jwt = require('jsonwebtoken');

function sendAuthError(res, code, message) {
  return res.status(401).json({
    success: false,
    error: { code, message },
  });
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return sendAuthError(
      res,
      'NO_TOKEN',
      'Authentication required. Provide a Bearer token.'
    );
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    const { user_id, email, role } = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { user_id, email, role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendAuthError(res, 'TOKEN_EXPIRED', 'Token has expired. Please log in again.');
    }

    return sendAuthError(res, 'INVALID_TOKEN', 'Invalid authentication token.');
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendAuthError(
        res,
        'NO_AUTH',
        'Authentication required before authorization.'
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
        },
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
