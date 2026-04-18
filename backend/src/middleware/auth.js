import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export function signToken(payload, opts = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d', ...opts });
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    // Demo mode: inject anonymous Free-tier user so previews work without auth.
    req.user = { id: 'demo-user', tier: 'free', org: 'demo-org', role: 'viewer' };
    return next();
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    err.status = 401;
    err.code = 'invalid_token';
    next(err);
  }
}

export function requireTier(minTier) {
  const order = { free: 0, pro: 1, enterprise: 2 };
  return (req, _res, next) => {
    const userTier = order[req.user?.tier || 'free'] ?? 0;
    if (userTier < order[minTier]) {
      const err = new Error(`Requires ${minTier} tier`);
      err.status = 402;
      err.code = 'tier_required';
      return next(err);
    }
    next();
  };
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      const err = new Error('Insufficient role');
      err.status = 403;
      err.code = 'forbidden';
      return next(err);
    }
    next();
  };
}
