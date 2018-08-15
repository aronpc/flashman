
const mongoose = require('mongoose');

let roleSchema = new mongoose.Schema({
  name: {type: String, unique: true, required: true},
  rules: {
    type: [
      {role: String, resource: String, action: String, attributes: String},
    ],
    required: true,
  },
});

let Role = mongoose.model('Role', roleSchema);

module.exports = Role;
