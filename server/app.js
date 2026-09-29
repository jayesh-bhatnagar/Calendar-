const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

app.use(express.json());
app.use('/api/health', healthRoutes);
app.use('/api/events', eventRoutes);

const clientBuildDirectory = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientBuildDirectory)) {
  app.use(express.static(clientBuildDirectory));
  app.use((request, response, next) => {
    const isApiRequest = request.path === '/api' || request.path.startsWith('/api/');
    if (request.method !== 'GET' || isApiRequest) {
      return next();
    }

    response.sendFile(path.join(clientBuildDirectory, 'index.html'), (error) => {
      if (error) {
        next(error);
      }
    });
  });
}

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