require('dotenv').config();
// require models
require('./models/userModel');
require('./models/exhibitionModel');
require('./models/standModel');
require('./models/visitorModel');
require('./models/standLogModel');
require('./models/exhibitionLogModel');
require('./models/ticketModel');

require('./config/dbConfig');
require('./config/passportConfig');
const http = require("http");
const express = require("express");
const helmet =require('helmet');
const cors = require('cors');
const path = require('path');



const passport = require('passport');

const app = express();
//app.use(helmet());
app.use("/stripe", express.raw({ type: "*/*" }));
app.use(express.json());
app.use(cors());
app.use(passport.initialize())

app.get('/env', (req, res) => {
  const envVariables = process.env;
  res.json({ environmentVariables: envVariables });
});

//import routes
const userRoute = require('./routes/userRoute');
const exhibitionRoute = require('./routes/exhibitionRoute');
const standRoute = require('./routes/standRoute');
const standLogRoute = require('./routes/standLogRoute');
const visitorRoute = require('./routes/visitorRoute');
const exhibitionLogRoute = require('./routes/exhibitionLogRoute');
const stripeRoute = require('./routes/stripeRoute');


//use routes
app.use('/user', userRoute);
app.use('/exhibition', exhibitionRoute);
app.use('/stand', standRoute);
app.use('/stats', standLogRoute);
app.use('/exhibition/stats', exhibitionLogRoute);
app.use('/stripe', stripeRoute);
app.use('/visitor', visitorRoute);


app.use('/public',express.static(path.join(__dirname, 'public')));

/** catch 404 and forward to error handler */
app.use('*', (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'API endpoint doesnt exist'
  })
});

/** Create HTTP server. */
const server = http.createServer(app);

/** Listen on provided port, on all network interfaces. */
server.listen(process.env.PORT);
/** Event listener for HTTP server "listening" event. */
server.on("listening", () => {
  console.log('it works')
});