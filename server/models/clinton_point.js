//Require Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
//Define a schema
const Schema = mongoose.Schema;

const Clinton_Point_Schema = new Schema({
  used: Boolean,
  date_created: {
    type: Date,
    default: Date.now()
  }
});

//Export function to create "SomeModel" model class
module.exports = mongoose.model('Clinton_Point', Clinton_Point_Schema);
