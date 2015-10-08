// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('TestUser', new Schema({ 
    name: {type: String, unique:true, required:true}, 
    password: String, 
    admin: Boolean 
}));