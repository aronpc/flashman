
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var firmwareSchema = new Schema({
  vendor : {type: String, required: true},
  model : {type: String, required: true},
  version : {type: String, required: true},
  release : {type: String, required: true},
  filename : {type: String, required: true}
});

firmwareSchema.plugin(mongoosePaginate);

var Firmware = mongoose.model('Firmware', firmwareSchema );

module.exports = Firmware;
