var io = require('socket.io')();
const colors = require('colors');
const ResponseModel = require('../models/response.js');

var savedInputs = ["this will be the first entry", "this wil be the second entry", "this will be the third entry", "Justin got this feature working", "Justin made this function work. Thank him sometime."];

io.on('connection', function(socket) {

  io.emit('chat message', "Use the number's to enter prerecorded text")
  for (var i = 0; i < savedInputs.length; i++) {
    io.emit('chat message', (i + 1) + " " + savedInputs[i])
  }

  console.log(socket.conn.id);
  socket.on('chat message', function(data) {
    console.log("MESSAGE:" + data + " FROM:" ["red"] + socket.conn.id);
    io.to('customAlexaResponsePage').emit('chat message', data) //relay chat message back to all in chat room
    let readCount = 0
    if (data === "stop") {
      readCount = 1 //the server will not read the message if the readcount is greater than 0
    }
    const response = new ResponseModel({type: "maya_class", text: data, readCount: readCount});
    response.save().then(err => {
      console.log(err);
    }).catch(err => {
      console.log(err);
    })
  });
  socket.on('subscribe', function(data) {
    console.log("User:" + socket.conn.id + " IS JOINING ROOM:" + data.room);
    socket.join(data.room)
    socket.emit("message", "Successfully connected to chatroom.")
  });

  socket.on('to room', function(msg) {
    console.log(msg);
    if (msg.room) {
      if (msg.room == "pi-client" && msg.type == "chat message") {
        var shouldGivePredefinedInput = false;
        for (var i = 0; i < savedInputs.length; i++) {
          if (msg.data == "-" + (
          i + 1)) {
            shouldGivePredefinedInput = true;
          }
        }
        if (shouldGivePredefinedInput) {
          const contentToSend = parseInt(msg.data.split("")[1]) - 1;
          console.log(contentToSend)
          io.to("pi-client").emit('chat message', savedInputs[contentToSend]);
        } else {
          io.to("pi-client").emit('chat message', msg.data);
        }
      } else {
        io.to(msg.room).emit(msg.type, msg.data)
      }
    }
  });

  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
  socket.on('changeBrushSize', (data) => socket.broadcast.emit('changeBrushSize', data));
  socket.on('clear whiteboard', (data) => socket.broadcast.emit('clear whiteboard', data));
});

module.exports = io;
