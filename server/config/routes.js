const path = require('path');
const io = require('./socket.js');
const PersonModel = require('../models/person.js');
const ResponseModel = require('../models/response.js');
const colors = require('colors');
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
	// app.get('/', (req, res) => {
	// 	console.log("somebody went to the normal route.");
	// 	res.sendFile(path.join( __dirname, '../../client/html' ,'index.html') )
	// });
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
	app.post('/createperson', (req, res) => {
		console.log(req.body);
		const person = new PersonModel({name: req.body.name});
		person.save()
		.then(err => {
			if(err) {console.log(err);}
			res.json("Success!");
		})
	});
	app.post('/createresponse', (req, res) => {
		console.log(req.body);
		const response = new ResponseModel({type: req.body.type, text:req.body.text});
		response.save()
		.then(err => {
			if(err) {console.log(err);}
			res.json("Success!");
		})
	});
	app.post('/getresponse', (req, res) => {
		console.log(req.body);
		ResponseModel.
		  find({ type: req.body.type }).
		  limit(1).
		  sort('-_id').
		  select('type text readCount').
		  exec((err, response) => {
				if(err) {console.log(err)}
				console.log(response);
				if(response[0].readCount>0){
					res.json({response:{text:"Could you give me a few more seconds? I'm still processing everything that's going on."}})
				} else{
					ResponseModel.update({_id:response[0]._id}, {readCount:1}, (err, raw) => {if(err){console.log(err);}})
					res.json({response: response[0]})
				}
			});
	});
	app.post('/login', (req, res) => {
		console.log(`USERNAME: ${req.body.username}`.red);
		console.log(`PASSWORD ATTEMPT: ${req.body.password}`.yellow);
		if(req.body.username == "admin" && req.body.password == "ccd"){
			res.json("success")
		} else {
			res.json("wrong password, try again.")
		}
	});
	app.post('/socket-request', (req, res) => {
		console.log("socket request recieved");
		console.log(req.body);
		io.to('pi-client').emit(req.body.request_type, req.body)
		res.json({
			response: "You have accessed the test route."
		});
	});
	app.all("*", (req, res) => {
		res.sendStatus(404);
	});
}
