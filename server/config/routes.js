const path = require('path');
const io = require('./socket.js');
const PersonModel = require('../models/person.js');
const ResponseModel = require('../models/response.js');
const SongModel = require('../models/song.js');
const colors = require('colors');

const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({storage});
const fs = require('fs');

// const testPerson = new PersonModel({name: "" + Math.floor(Math.random()*100)}).save().then(err => {console.log(err);});

module.exports = function(app) {

  app.get('/test', (req, res) => {
    console.log("accessed test route.");
    io.to('town hall').emit("chat message", "this is from the server!")
    res.json({response: "You have accessed the test route."});
  });

  app.post('/file', upload.single('file'), (req, res) => {
    fs.writeFile("./server/config/" + req.file.originalname, req.file.buffer, (err) => {
      if (err) 
        console.log(err);
      }
    )
    res.json("Success!")
  });

  app.get('/', (req, res) => {
    console.log("somebody went to the normal route.");
    res.sendFile(path.join(__dirname, '../../client/html', 'index.html'))
  });

  app.get('/david', (req, res) => {
    console.log("somebody went to the normal route.");
    res.sendFile(path.join(__dirname, '../../client/html', 'customAlexaResponsePage.html'))
  });

  app.get('/luis', (req, res) => {
    console.log("somebody went to the normal route.");
    res.sendFile(path.join(__dirname, '../../client/html', 'customPiResponsePage.html'))
    // res.json("Goodbye Kelton.");
  });

  app.get('/roman', (req, res) => {
    console.log("somebody went to the normal route.");
    res.sendFile(path.join(__dirname, '../../client/html', 'roman.html'))
    // res.json("Goodbye Kelton.");
  });

  app.get('/nic', (req, res) => {
    console.log("somebody went to the normal route.");
    res.sendFile(path.join(__dirname, '../../client/html', 'nic.html'))
    // res.json("Goodbye Kelton.");
  });

  app.get('/wes', (req, res) => {
    console.log("somebody went to the normal route.");
    res.sendFile(path.join(__dirname, '../../client/html', 'wes.html'))
    // res.json("Goodbye Kelton.");
  });

  app.get('/pete', (req, res) => {
    res.sendFile(path.join(global.__base, '/client/html', 'song_adder.html'))
  });

  app.post('/create_song', (req, res) => {
    const requiredFields = ['song_name', 'artist_first_name', 'artist_last_name', 'genre', 'sound_cloud_link'];
    const missingFields = getMissingFields(requiredFields, req.body)
    if (missingFields.length < 1) {
      const newSong = new SongModel(req.body);
      newSong.save((err) => {
        if (err) {
          console.log(err);
          res.send("Error Saving to Database")
        } else {
          console.log("======song saved to database:======");
          console.log(req.body);
          console.log("===================================");
          res.redirect("/pete");
        }
      });
    } else {
      res.send("Missing fields:" + missingFields.join(", "));
    }
  });

  app.post('/get_newest_song_from_artist', (req, res) => {
    const requiredFields = ['artist_first_name'];
    const missingFields = getMissingFields(requiredFields, req.body);
    if (missingFields.length < 1) {
      SongModel.find({artist_first_name: req.body.artist_first_name}).sort({_id: -1}).limit(1).exec((err, data) => {
        if (err) {
          console.log(err);
          res.json({response_text: "There was an error with the database."})
        } else {
          if (data.length > 0) {
            const newestSong = data[0];
            const response_text = `${newestSong.artist_first_name} has a new ${newestSong.genre} song called ${newestSong.song_name}, I'll put it up on the big screen.`;
            res.json({response_text: response_text});
            setTimeout(() => {
              io.to('pi-client').emit('play song', {sound_cloud_link: newestSong.sound_cloud_link});
            }, 3000);
          } else {
            res.json({response_text: "I couldn't find any songs from that author, sorry."})
          }
        }
      });
    } else {
      res.json("ERROR: No Artist Name Given");
    }
  });

  function getMissingFields(requiredFields, submittedInputs) {
    let missingFields = [];
    for (field of requiredFields) {
      if (!submittedInputs[field]) {
        missingFields.push(field)
      }
    }
    return missingFields;
  }

  app.get('/clinton', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/html', 'clinton.html'))
  });

  app.get('/daniel-goodbye-card', (req, res) => {
    console.log("somebody went to the normal route.");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.sendFile(path.join(__dirname, '../../client/html', 'daniel-goodbye-card.html'))
    // res.json("Goodbye Kelton.");
  });

  // Whiteboard Setup
  require(global.__base + 'server/controllers/whiteboard-controller.js')(app);

  // Alexa Teaching Assistant routes
  require(global.__base + 'server/controllers/alexa-ta-controller.js')(app);

  //  testing routes
  // require(global.__base + 'server/controllers/testing.js')(app);

  app.post('/socket-request', (req, res) => {
    console.log("socket request recieved");
    console.log(req.body);
    io.to('pi-client').emit(req.body.request_type, req.body);
    res.json({response: "You have accessed the test route."});
  });

}; //end of module.exports