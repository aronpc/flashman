
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

let userSchema = new mongoose.Schema({
    name: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      unique: true,
      required: true,
    },
    lastLogin: {type: Date},
    createdAt: {type: Date, default: new Date()},
    autoUpdate: {type: Boolean, default: true},
    maxElementsPerPage: {type: Number, default: 10},
    is_superuser: {type: Boolean, default: false},
    role: {type: String, required: false},
});

// Execute before each user.save() call
userSchema.pre('save', function(callback) {
  let user = this;
  // Break out if the password hasn't changed
  if (!user.isModified('password')) return callback();
  // Password changed so we need to hash it again
  bcrypt.genSalt(5, function(err, salt) {
    if (err) return callback(err);
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return callback(err);
      user.password = hash;
      callback();
    });
  });
});

// To add methods to this model, you can do something like this:
// userSchema.methods.speak = function() { something to do... }

// Function that verifies if hashed password inside model is equal
// to another
userSchema.methods.verifyPassword = function(password, callback) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
    });
};

var User = mongoose.model('User', userSchema);

module.exports = User;
