const serverless = require("serverless-http");
const express = require('express');
const app = express();
app.use(express.json());
const { pool, API_KEY } = require("../config/config");
const axios = require('axios');


app.get('/', async (req, res) => {
   res.send("success!")
});

app.post('/get_all_available_jobs_from_db', async (req, res) => {
  try {
      // SQL query to retrieve data
      const selectQuery = 'SELECT job_id, job_title FROM test';
      
      // Executing the SQL command
      const result = await pool.query(selectQuery);
      
      // Fetch all rows from the database
      const records = result.rows;

      // Sending the records as response
      res.json(records);
  } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving data');
  }
});

app.post('/get_job_task_breakdown_from_db', async (req, res) => {
  let { job_id, job_title } = req.query;

  // Default values if parameters are not provided
  if (!job_id) {
      job_id = 0;
  }
  if (!job_title) {
      job_title = 'empty';
  }

  try {
      // SQL query to retrieve data
      const selectQuery = `
          SELECT job_id, job_details
          FROM test
          WHERE LOWER(job_title) = $1 OR job_id = $2
      `;

      // Executing the SQL command
      const result = await pool.query(selectQuery, [job_title.toLowerCase(), job_id]);
      
      // Fetch the first row from the result
      const records = result.rows[0];

      if (!records) {
          return res.status(404).send('No result found');
      }

      // Preparing the response
      const response = [{ job_id: records.job_id }, ...records.job_details];

      // Sending the response
      res.json(response);
  } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving data');
  }
});


const apiKey = API_KEY;
const client = axios.create({
    baseURL: 'https://api.openai.com/v1',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    }
});

async function llmService(prompt) {
    try {
        const response = await client.post('/chat/completions', {
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }]
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error;
    }
}

app.post('/generate_job_task_breakdown_using_GPT', async (req, res) => {
    const { job_title, median_salary } = req.query;
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
            return res.status(500).send(`please regenerate data for the job ${job_title}`);
        }

        const insertQuery = 'INSERT INTO test (job_title, job_details) VALUES ($1, $2)';
        const jsonData = JSON.stringify(data);
        await pool.query(insertQuery, [job_title.toLowerCase(), jsonData]);
        return res.json({ status: 'done', data: data });
    } catch (error) {
        console.error('Error in processing:', error);
        return res.status(500).send('Internal Server Error');
    }
});


const port = 8081;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports.handler = serverless(app);
