
const mongoose = require('mongoose');

let roleSchema = new mongoose.Schema({
  name: {type: String, unique: true, required: true},
  rules: {
    type: [
      {role: String, resource: String, action: String, attributes: String},
    ],
    required: true,
  },
  grantWifiInfo: {type: Number, required: true, default: 0},
  grantPPPoEInfo: {type: Number, required: true, default: 0},
  grantFirmwareUpgrade: {type: Number, required: true, default: 0},
  grantWanType: {type: Number, required: true, default: 0},
  grantDeviceId: {type: Number, required: true, default: 0},
  grantDeviceActions: {type: Number, required: true, default: 0},
  grantDeviceRemoval: {type: Number, required: true, default: 0},
  grantDeviceAdd: {type: Number, required: true, default: 0},
  grantFirmwareManage: {type: Number, required: true, default: 0},
});

let Role = mongoose.model('Role', roleSchema);

module.exports = Role;
