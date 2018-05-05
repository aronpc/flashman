
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
let Schema = mongoose.Schema;

let deviceSchema = new Schema({
  _id: String,
  external_reference: {kind: String, data: String},
  model: String,
  version: String,
  release: String,
  pppoe_user: String,
  pppoe_password: String,
  wifi_ssid: String,
  wifi_password: String,
  wifi_channel: String,
  wan_ip: String,
  ip: String,
  last_contact: Date,
  do_update: Boolean,
  do_update_parameters: Boolean,
  apps: [{id: String, secret: String}],
});

deviceSchema.plugin(mongoosePaginate);

let Device = mongoose.model('Device', deviceSchema );

module.exports = Device;
