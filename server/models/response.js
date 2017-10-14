//Require Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
//Define a schema
const Schema = mongoose.Schema;

const ResponseSchema = new Schema(
  {
    type: String,
    text: String,
    date_created: {type: Date, default: Date.now()}
  }
);

  //Export function to create "SomeModel" model class
  module.exports = mongoose.model('responses', ResponseSchema );
