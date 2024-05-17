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
    try {
        console.log('Connecting to the database...');
        const client = await pool.connect();
        console.log('Connected to the database.');

        // SQL query to retrieve data
        const selectQuery = 'SELECT job_id, job_title FROM test';
        
        // Executing the SQL command
        const result = await client.query(selectQuery);
        
        // Release the client back to the pool
        client.release();

        // Fetch all rows from the result
        const records = result.rows;

        // Sending the records as response
        return {
            statusCode: 200,
            body: JSON.stringify(records),
        };
    } catch (error) {
        console.error('Error connecting to the database:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error retrieving data' }),
        };
    }
};
