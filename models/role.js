
const mongoose = require('mongoose');

let roleSchema = new mongoose.Schema({
  name: {type: String, unique: true, required: true},
  grantWifiInfo: {type: Number, required: true, default: 0},
  grantPPPoEInfo: {type: Number, required: true, default: 0},
  grantPassShow: {type: Boolean, required: true, default: false},
  grantFirmwareUpgrade: {type: Boolean, required: true, default: false},
  grantWanType: {type: Boolean, required: true, default: false},
  grantDeviceId: {type: Boolean, required: true, default: false},
  grantDeviceActions: {type: Boolean, required: true, default: false},
  grantDeviceRemoval: {type: Boolean, required: true, default: false},
  grantDeviceAdd: {type: Boolean, required: true, default: false},
  grantFirmwareManage: {type: Boolean, required: true, default: false},
});

let Role = mongoose.model('Role', roleSchema);

module.exports = Role;
