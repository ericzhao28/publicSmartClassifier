// Config

module.exports = {
  database: process.env.MONGO_URI || 'localhost',
  senseVecHost: 'localhost',
  senseVecPort: 5000,
  homeDir: __dirname
};