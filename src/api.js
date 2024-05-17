const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')

var corsOptions = {
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true, //access-control-allow-credentials:true
  optionsSuccessStatus: 200,
}

const app = express()
const router = express.Router()

app.options('*', cors());
app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }));
app.use(bodyParser.json({limit: '50mb'}));

app.use(express.urlencoded())
app.use(express.json())
app.use(
  cors(corsOptions)
)

app.get("/", (req, res) => {
  res.send('Hello, world!');
})


module.exports = app
module.exports.handler = serverless(app)

const PORT = process.env.APPPORT || 9000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
}) 

