
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deviceSchema = new Schema({
    id : String,
    model : String,
    version : String,
    ip : String,
    last_contact : Date,
    do_update : Boolean
});

var Device = mongoose.model('Device', deviceSchema );
