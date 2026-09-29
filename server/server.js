const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { connectDatabase } = require('./config/db');

const port = Number(process.env.PORT) || 5000;

app.listen(port, '0.0.0.0', () => {
  console.log(`API server listening on port ${port}`);
});

connectDatabase().then(
  () => console.log('Connected to MongoDB.'),
  (error) => console.error(`MongoDB connection failed: ${error.message}`),
);