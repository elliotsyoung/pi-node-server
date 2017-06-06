const fs = require('fs');
module.exports = function(server) {
	var io = require("socket.io").listen(server);

	io.on('connection', function(socket){
	  socket.on('chat message', function(msg){
	    io.emit('chat message', msg);
	  });
	});
	let test = io.of('/test');
	test.on('connection', function(socket){
		console.log("Connected to test!!");
	  socket.on('chat message', function(msg){
	    test.emit('chat message', msg + "Test channel!");
			fs.readdir('./', (err, files) => {
				console.log(files);
			});
	  });
	});
}
