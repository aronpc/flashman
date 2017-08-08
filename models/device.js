
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deviceSchema = new Schema({
  _id : String,
  model : String,
  version : String,
  release : String,
  pppoe_user : String,
  pppoe_password : String,
  wan_ip : String,
  ip : String,
  last_contact : Date,
  do_update : Boolean
});

var Device = mongoose.model('Device', deviceSchema );

module.exports = Device;
