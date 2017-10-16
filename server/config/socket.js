var io = require('socket.io')();
const colors = require('colors');
const ResponseModel = require('../models/response.js');
io.on('connection', function (socket) {
	console.log(socket.conn.id);
	socket.on('chat message', function (data) {
		console.log("MESSAGE:"+ data + " FROM:"["red"] + socket.conn.id);
		io.emit('chat message', data)
		const response = new ResponseModel({type: "maya_class", text:data});
		response.save().then(err => {console.log(err);}).catch(err => {console.log(err);})
	});
	socket.on('subscribe', function (data) {
		console.log("User:"+ socket.conn.id + " IS JOINING ROOM:" + data.room);
		socket.join(data.room)
	});
});

module.exports = io;
