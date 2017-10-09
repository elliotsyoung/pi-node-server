var io = require('socket.io')();

io.on('connection', function (socket) {
	console.log(socket.conn.id);
	socket.on('chat message', function (data) {
		console.log("MESSAGE:"+ data + " FROM:" + socket.conn.id);
		io.emit('chat message', data)
	});
	socket.on('subscribe', function (data) {
		console.log("User:"+ socket.conn.id + " IS JOINING ROOM:" + data.room);
		socket.join(data.room)
	});
});

module.exports = io;
