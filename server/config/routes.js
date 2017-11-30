const path = require('path');
const io = require('./socket.js');
const PersonModel = require('../models/person.js');
const ResponseModel = require('../models/response.js');
const colors = require('colors');

const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({ storage });
const fs = require('fs');

const aws = require('aws-sdk');
aws.config.loadFromPath('keys/config.json')
const s3 = new aws.S3({region: 'us-west-1'});
const createItemObject = (callback) => {
  const params = {
        Bucket: 'e-pi-projects',
        Key: `testing.txt`,
        ACL: 'public-read',
        Body:'just some text I guess.'
    };
	s3.putObject(params, function (err, data) {
		if (err) {
	    	console.log("Error uploading image: ", err);
	    	callback(err, null)
	    } else {
	    	console.log("Successfully uploaded image on S3", data);
	    	callback(null, data)
	    }
	})
}

createItemObject((data) =>{
	console.log(data);
});
//################################################################

// const testPerson = new PersonModel({name: "test"}).save().then(err => {console.log(err);});

//################################################################
module.exports = function(app) {
	app.get('/test', (req, res) => {
		console.log("accessed test route.");
		io.to('town hall').emit("chat message", "this is from the server!")
		res.json({
			response: "You have accessed the test route."
		});
	});

	app.post('/file', upload.single('file'), (req, res) => {
		fs.writeFile("./server/config/"+req.file.originalname, req.file.buffer, (err) => { if(err) 	console.log(err); })
		res.json("Success!")
	});

	app.get('/', (req, res) => {
		console.log("somebody went to the normal route.");
		res.sendFile(path.join( __dirname, '../../client/html' ,'index.html') )
	});


	app.get('/david', (req, res) => {
		console.log("somebody went to the normal route.");
		res.sendFile(path.join( __dirname, '../../client/html' ,'customAlexaResponsePage.html') )
	});
	app.get('/luis', (req, res) => {
		console.log("somebody went to the normal route.");
		res.sendFile(path.join( __dirname, '../../client/html' ,'customPiResponsePage.html') )
		// res.json("Goodbye Kelton.");
	});
	app.get('/roman', (req, res) => {
		console.log("somebody went to the normal route.");
		res.sendFile(path.join( __dirname, '../../client/html' ,'roman.html') )
		// res.json("Goodbye Kelton.");
	});
	app.get('/nic', (req, res) => {
		console.log("somebody went to the normal route.");
		res.sendFile(path.join( __dirname, '../../client/html' ,'nic.html') )
		// res.json("Goodbye Kelton.");
	});
	app.get('/wes', (req, res) => {
		console.log("somebody went to the normal route.");
		res.sendFile(path.join( __dirname, '../../client/html' ,'wes.html') )
		// res.json("Goodbye Kelton.");
	});
	app.get('/daniel-goodbye-card', (req, res) => {
		console.log("somebody went to the normal route.");
		res.sendFile(path.join( __dirname, '../../client/html' ,'daniel-goodbye-card.html') )
		// res.json("Goodbye Kelton.");
	});

	// Whiteboard Setup
	require(global.__base + 'server/controllers/whiteboard-controller.js')(app);

	// Alexa Teaching Assistant routes
	require(global.__base + 'server/controllers/alexa-ta-controller.js')(app);

	app.post('/socket-request', (req, res) => {
		console.log("socket request recieved");
		console.log(req.body);
		io.to('pi-client').emit(req.body.request_type, req.body)
		res.json({
			response: "You have accessed the test route."
		});
	});

}
