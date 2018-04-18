//Require Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
//Define a schema
const Schema = mongoose.Schema;

const Clinton_ItemSchema = new Schema({item_name: String, item_description: String, picture_url: String});

//Export function to create "SomeModel" model class
module.exports = mongoose.model('Clinton_Item', Clinton_ItemSchema);
