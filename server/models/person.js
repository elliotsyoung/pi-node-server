//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var PersonSchema = new Schema({
    name         : String,
    date_created           : {type: Date, default: Date.now()}
});

//Export function to create "SomeModel" model class
module.exports = mongoose.model('Person', PersonSchema );
