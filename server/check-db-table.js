
exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        body: "Hello, world!"
    };
};



// exports.handler = async (event, context) => {
//     try {
//         // SQL query to retrieve data
//         const selectQuery = 'SELECT job_id, job_title FROM test';
        
//         // Executing the SQL command
//         const result = await pool.query(selectQuery);
        
//         // Fetch all rows from the database
//         const records = result.rows;

//         // Sending the records as response
//         return {
//             statusCode: 200,
//             body: JSON.stringify(records),
//         };
//     } catch (error) {
//         console.error(error);
//         return {
//             statusCode: 500,
//             body: JSON.stringify({ error: 'Error retrieving data' }),
//         };
//     }
// };
