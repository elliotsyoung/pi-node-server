const path = require('path');
const PersonModel = require( global.__base+ 'server/models/person.js');
const ResponseModel = require(global.__base+ 'server/models/response.js');
module.exports = function(app){
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
};
