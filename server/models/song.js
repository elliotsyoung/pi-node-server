//Require Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
//Define a schema
const Schema = mongoose.Schema;

const SongSchema = new Schema({
  song_name: String,
  artist_first_name: String,
  artist_last_name: String,
  genre: {
    type: String,
    default: "no genre"
  },
  sound_cloud_link: String,
  description: {
    type: String,
    default: "no description"
  },
  play_count: {
    type: Number,
    default: 0
  },
  date_created: {
    type: Date,
    default: Date.now()
  }
});

//Exports function to create "SomeModel" model class
module.exports = mongoose.model('song', SongSchema);
