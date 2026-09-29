const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

app.use(express.json());
app.use('/api/health', healthRoutes);
app.use('/api/events', eventRoutes);

app.use((request, response, next) => {
  const error = new Error(`Route not found: ${request.method} ${request.originalUrl}`);
  error.status = 404;
  next(error);
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ message: 'Request body must contain valid JSON.' });
  }

  const statusCode = error.status || 500;
  response.status(statusCode).json({
    message: statusCode === 500 ? 'An unexpected error occurred.' : error.message,
  });
});

module.exports = app;