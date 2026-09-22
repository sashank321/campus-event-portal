const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED');
  let message =
    status === 500 && env.isProd ? 'Internal server error' : err.message || 'Something went wrong';

  // Backstop: schema validation errors keep the standard envelope
  if (err.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Multer upload errors (e.g. file size limit reached in middleware)
  if (err.name === 'MulterError') {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_FILE';
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 5 MB limit' : `Upload failed: ${err.code}`;
  }

  // Only intentional ApiError instances reach clients; unexpected errors
  // (including raw MongoDB transaction/session failures) are sanitized.
  const isApiError = err instanceof ApiError;
  if (status >= 500) console.error('[error]', err);

  if (!isApiError && status >= 500) {
    code = 'INTERNAL_ERROR';
    message = env.isProd ? 'Internal server error' : 'Unexpected server error';
  }

  res.status(status).json({ error: { code, message } });
}

module.exports = { notFound, errorHandler };
