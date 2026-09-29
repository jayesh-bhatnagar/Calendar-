const { getDatabaseStatus } = require('../config/db');

function getHealth(request, response) {
  const databaseStatus = getDatabaseStatus();
  const isDatabaseConnected = databaseStatus === 'connected';

  response.status(isDatabaseConnected ? 200 : 503).json({
    status: isDatabaseConnected ? 'ok' : 'unavailable',
    api: 'available',
    database: { status: databaseStatus },
  });
}

module.exports = { getHealth };