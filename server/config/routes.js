const path = require('path');
const io = require('./socket.js');
const PersonModel = require('../models/person.js');
const colors = require('colors');
//################################################################

const testPerson = new PersonModel({name: "test"}).save().then(err => {console.log(err);});

//################################################################
module.exports = function(app) {
	app.get('/test', (req, res) => {
		console.log("accessed test route.");
		io.to('town hall').emit("chat message", "this is from the server!")
		res.json({
			response: "You have accessed the test route."
		});
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
	app.post('/login', (req, res) => {
		console.log(`USERNAME: ${req.body.username}`.red);
		console.log(`PASSWORD ATTEMPT: ${req.body.password}`.yellow);
		if(req.body.username == "admin" && req.body.password == "ccd"){
			res.json("success")
		} else {
			res.json("wrong password, try again.")
		}
	});
	app.all("*", (req, res) => {
		res.sendStatus(404);
	});
}
