
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var deviceSchema = new Schema({
  _id : String,
  model : String,
  version : String,
  release : String,
  pppoe_user : String,
  pppoe_password : String,
  wifi_ssid : String,
  wifi_password : String,
  wifi_channel : String,
  wan_ip : String,
  ip : String,
  last_contact : Date,
  is_online : Boolean,
  do_update : Boolean,
  do_update_parameters : Boolean,
  apps : [{id: String, secret: String, FCM: String}]
});

deviceSchema.plugin(mongoosePaginate);

var Device = mongoose.model('Device', deviceSchema );

module.exports = Device;
