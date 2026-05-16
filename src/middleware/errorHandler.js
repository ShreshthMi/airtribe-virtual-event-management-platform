function notFoundHandler(req, res, next) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

function errorHandler(err, req, res, next) {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const status = err.status || 500;
  const message = err.expose ? err.message : status === 500 ? 'Internal server error' : err.message;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
