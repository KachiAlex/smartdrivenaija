import { randomUUID } from 'crypto';

export function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const requestId = req.id || 'unknown';
  const timestamp = new Date().toISOString();

  // Structured log
  const logEntry = {
    requestId,
    timestamp,
    method: req.method,
    path: req.path,
    status,
    error: err.message,
    code: err.code,
  };

  if (status >= 500) {
    console.error('[ERROR]', JSON.stringify(logEntry));
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  } else {
    console.warn('[WARN]', JSON.stringify(logEntry));
  }

  const body = {
    error: status >= 500 ? 'Internal server error' : err.message,
    requestId,
    timestamp,
  };

  if (err.code) body.code = err.code;
  if (err.details) body.details = err.details;

  res.status(status).json(body);
}

export class AppError extends Error {
  constructor(message, status = 400, code = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'AppError';
  }
}
