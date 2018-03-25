const path = require('path');
const PersonModel = require( global.__base+ 'server/models/person.js');
const ResponseModel = require(global.__base+ 'server/models/response.js');
const SongModel = require(global.__base+ 'server/models/song.js');
module.exports = function(app){
  const testSong = new SongModel(
    {
      song_name: "New song duuude",
      artist_first_name: "dewd",
      artist_last_name: "manson",
      artist: "Elliot Young",
      genre: "Techno Funk",
      sound_cloud_url: "<embed>Test</embed>",
      description: "This is the third song in the database",
    }
  );
  testSong.save()
  .then(err => {
    if(err) {console.log(err);}
    console.log("Success!");
  })
};
