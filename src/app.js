const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (req, res) => {
    res.json({
      name: 'Virtual Event Management Platform API',
      status: 'ok',
      endpoints: [
        'POST /register',
        'POST /login',
        'GET /me',
        'GET /events',
        'POST /events',
        'GET /events/:id',
        'PUT /events/:id',
        'DELETE /events/:id',
        'POST /events/:id/register',
        'DELETE /events/:id/register',
        'GET /events/me/registrations',
      ],
    });
  });

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/', authRoutes);
  app.use('/events', eventRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
