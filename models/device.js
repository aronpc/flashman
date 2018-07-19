
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
let Schema = mongoose.Schema;

let deviceSchema = new Schema({
  _id: String,
  external_reference: {kind: String, data: String},
  model: String,
  version: String,
  release: String,
  connection_type: {type: String, enum: ['pppoe', 'dhcp']},
  pppoe_user: String,
  pppoe_password: String,
  wifi_ssid: String,
  wifi_password: String,
  wifi_channel: String,
  wan_ip: String,
  ip: String,
  ntp_status: String,
  last_contact: Date,
  last_hardreset: Date,
  do_update: Boolean,
  do_update_parameters: Boolean,
  mqtt_secret: String,
  firstboot_log: Buffer,
  firstboot_date: Date,
  lastboot_log: Buffer,
  lastboot_date: Date,
  apps: [{id: String, secret: String}],
});

deviceSchema.plugin(mongoosePaginate);

let Device = mongoose.model('Device', deviceSchema );

module.exports = Device;
