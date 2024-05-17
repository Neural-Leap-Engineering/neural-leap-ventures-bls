const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Adjust as necessary for your environment
  }
});

exports.handler = async (event, context) => {
  const { job_id, job_title } = event.queryStringParameters || {};

  // Default values if parameters are not provided
  const jobId = job_id || 0;
  const jobTitle = job_title || 'empty';

  try {
    console.log('Connecting to the database...');
    const client = await pool.connect();
    console.log('Connected to the database.');

    // SQL query to retrieve data
    const selectQuery = `
      SELECT job_id, job_details
      FROM test
      WHERE LOWER(job_title) = $1 OR job_id = $2
    `;

    // Executing the SQL command
    const result = await client.query(selectQuery, [jobTitle.toLowerCase(), jobId]);

    // Release the client back to the pool
    client.release();

    // Fetch the first row from the result
    const records = result.rows[0];

    if (!records) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No result found' }),
      };
    }

    // Preparing the response
    const response = [{ job_id: records.job_id }, ...records.job_details];

    // Sending the response
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error retrieving data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error retrieving data' }),
    };
  }
};
