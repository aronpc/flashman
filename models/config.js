const mongoose = require('mongoose');

let configSchema = new mongoose.Schema({
  is_default: {type: Boolean, required: true, default: false},
  autoUpdate: {type: Boolean, default: true},
  hasUpdate: {type: Boolean, default: false},
  pppoePassLength: {type: Number, default: 8},
});

let config = mongoose.model('config', configSchema);

module.exports = config;
