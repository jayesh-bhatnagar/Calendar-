const mongoose = require('mongoose');

async function connectDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to server/.env.');
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
}

function getDatabaseStatus() {
  const connectionStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return connectionStates[mongoose.connection.readyState] || 'unknown';
}

module.exports = { connectDatabase, getDatabaseStatus };