//Require Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
//Define a schema
const Schema = mongoose.Schema;

const SongSchema = new Schema(
  {
    artist: String,
    genre: String,
    sound_cloud_url: String,
    description: String,
    play_count: {type: Number, default: 0},
    date_created: {type: Date, default: Date.now()}
  }
);

//Export function to create "SomeModel" model class
module.exports = mongoose.model('song', SongSchema );
