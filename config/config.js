const dotenv = require("dotenv");
dotenv.config();

const pkg = require('pg');
const { Pool } = pkg;

const pool = new Pool({
  user:  process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Adjust as necessary for your environment
  }
})

const API_KEY = process.env.API_KEY

module.exports = {
  pool,
  API_KEY
};