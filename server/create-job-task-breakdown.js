const axios = require('axios');
const { Pool } = require('pg');

// Your OpenAI API key
const apiKey = process.env.API_KEY; // Store your API key in environment variables for security

// Database connection pool
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

// Function to call OpenAI API
async function llmService(prompt) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// Netlify function handler
exports.handler = async (event, context) => {
  const { job_title, median_salary } = event.queryStringParameters || {};
  const basePrompt = `Given the job title '${job_title}' and given Median Salary '${median_salary || 'worldwide median salary amount'}' if Median_salary not available then use Median_salary=worldwide median salary amount outline a detailed task breakdown for a typical 8-hour workday. Include monthly salary with two decimal points, time allocations, and key responsibilities. The response must adhere to the following JSON format: final response only need to containe json data ony . don't add any explanation or extra text
  [
    {
      'Job Title': '${job_title}',
      'Job Description': 'Outline of typical tasks and responsibilities',
      'Median Salary': 'Median Salary', #don't add any text or explanation only add salary amount
      'Number Of Jobs': '200,000',  # use worldwide number of jobs
      'Job Outlook': '16%'  # use worldwide job outlook
    },
    {
      'Task ID': '1',
      'Task Description': 'Description of a specific task',
      'Task Money Cost': '$200',
      'Task Time Cost': '4 Hours',
      'Total Money Cost': '$40,000,000',  # This multiplies the individual money cost by the 200,000 people that do this job
      'Total Time Cost': '800,000 Hours'  # This multiplies the individual time cost by the 200,000 people that do this job
    },
    {
      'Task ID': '2',
      'Task Description': 'Description of another specific task',
      'Task Money Cost': '$200',
      'Task Time Cost': '4 Hours',
      'Total Money Cost': '$40,000,000',
      'Total Time Cost': '800,000 Hours'
    }
    # Add additional tasks as needed
  ]`;

  try {
    const result = await llmService(basePrompt);
    let data;
    try {
      data = JSON.parse(result.replace(/'/g, '"'));
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return {
        statusCode: 500,
        body: `please regenerate data for the job ${job_title}`
      };
    }

    const insertQuery = 'INSERT INTO test (job_title, job_details) VALUES ($1, $2)';
    const jsonData = JSON.stringify(data);

    console.log('Inserting data into database');
    const dbStartTime = Date.now();

    // Check if job_title is defined before calling toLowerCase()
    const jobTitleLowerCase = job_title ? job_title.toLowerCase() : '';

    await pool.query(insertQuery, [jobTitleLowerCase, jsonData]);

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'done', data: data })
    };
  } catch (error) {
    console.error('Error in processing:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};
