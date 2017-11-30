// attach root directory for later processes.
global.__base = __dirname + "/";
//################################################################
// Major Components
//################################################################
const express = require('express'); // for app server object and other middleware
const app = express(); // set up server on this object and will later pass this to the http to listen on
const server = require('http').createServer(app); // the actual server that listens on a port on server.listen(). We will need to pass server into socket.io
const routes = require(global.__base+'server/config/routes.js');
const io = require(global.__base+'server/config/socket.js'); // Websocket utility for chat and real time interaction. Can be accessed anywhere to emit messages through: const io = require('./server/config/socket.js')
const keys = require(global.__base+'keys');
//################################################################
// Other Node dependencies
//################################################################
const bodyParser = require('body-parser'); // populates req.body
const path = require('path'); // joins directory paths since mac and windows have different conventions
const root = __dirname;
//Import the mongoose module
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
//Set up default mongoose connection
// const mongoDB = `mongodb://admin:${keys.mongodbpassword}@localhost:27017/FPAL_TA_DB`;
const mongoDB = 'mongodb://localhost/FPAL_TA_DB';

mongoose.connect(mongoDB, {
  useMongoClient: true
});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
//################################################################
// App settings
//################################################################
app.set('port', process.env.PORT || 3000); // process.env.PORT can be set outside the app using the terminal or through configured settings
//################################################################
// App Middleware
//################################################################
app.use(bodyParser.json()); // the server will expect incoming data to have a JSON format. In Postman this means a request's body should be set to RAW
app.use(bodyParser.urlencoded({ extended: false })) //Allows postman to send post requests with the request body as x-www-form-urlencoded
routes(app); // pass in server to have routes set up
app.use(express.static(path.join(root, 'client'))); // requesting a file with an extension, like home.html, will search the client folder in our root directory.
app.use(express.static(path.join(root, 'bower_components'))); // requests for script tags go into this folder. On the client side you do not need to specify the bower_components folder, just reference from the root directory (e.g. <script src="jquery/dist/jquery.min.js")
//################################################################
// Start the serverexi
//################################################################
server.listen(app.get('port'), function() {
  console.log(`listening on ${app.get('port')}`);
});
io.attach(server); //activates websockets for server.
