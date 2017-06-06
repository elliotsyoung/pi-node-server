//################################################################
// Major Components
//################################################################
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const server = require('http').createServer(app;
//################################################################
// Other Node dependencies
//################################################################
const path = require('path');

app.use(express.static(path.join(root, 'client')));
app.use(express.static(path.join(root, 'bower_components')));
app.use(bodyParser.json());
require('./server/config/routes.js')(app);


server.listen(app.get('port'), () => {
  console.log(`server running on port ${port}`);
});

require('./server/config/socket.js')(server);
