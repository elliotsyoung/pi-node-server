//Require Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
//Define a schema
const Schema = mongoose.Schema;

const Clinton_Inventory_ItemSchema = new Schema({item_name: String});

//Export function to create "SomeModel" model class
module.exports = mongoose.model('Clinton_Inventory_Item', Clinton_Inventory_ItemSchema);
