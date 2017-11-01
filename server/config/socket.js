var io = require('socket.io')();
const colors = require('colors');
const ResponseModel = require('../models/response.js');
io.on('connection', function (socket) {
	console.log(socket.conn.id);
	socket.on('chat message', function (data) {
		console.log("MESSAGE:"+ data + " FROM:"["red"] + socket.conn.id);
		io.to('alexa-client').emit('chat message', data) //relay chat message back to all in chat room
		let readCount = 0
		if(data === "stop"){
			readCount=1 //the server will not read the message if the readcount is greater than 0
		}
		const response = new ResponseModel({type: "maya_class", text:data, readCount:readCount});
		response.save().then(err => {console.log(err);}).catch(err => {console.log(err);})
	});
	socket.on('subscribe', function (data) {
		console.log("User:"+ socket.conn.id + " IS JOINING ROOM:" + data.room);
		socket.join(data.room)
	});
	socket.on('to room', function(data){
		console.log(data);
		if(data.room){
			io.to(data.room).emit(data.type, data.data)
		}
	});
});

module.exports = io;
