
var fs = require('fs');
var prompt = require('prompt');
var mongoose = require('mongoose');
var user = require('../models/user');

const imageReleasesDir = require('../config/configs').imageReleasesDir;

mongoose.connect('mongodb://localhost:27017/flashman', {useMongoClient: true});

var createSuperUser = function() {
  prompt.get([{
      name: 'username',
      validator: /^[a-zA-Z\-]+$/,
      warning: 'Only letters and dashes are valid',
      required: true
    }, {
      name: 'password',
      hidden: true,
      conform: function (value) {
        return true;
      }
    }], function (err, result) {

      user.findOne({name: result.username}, function(err, matchedUser) {
        if(err || !matchedUser || 0 === matchedUser.length) {
          var newSuperUser = new user({
              name: result.username,
              password: result.password,
              is_superuser: true
          });
          newSuperUser.save(function(err) {
            if(err) {
              console.log(err);
            }
            console.log('User successfully created!');
            mongoose.connection.close();
          });
        } else {
          matchedUser.password = result.password;
          matchedUser.save(function(err) {
            if(err) {
              console.log(err);
            }
            console.log('User successfully edited!');
            mongoose.connection.close();
          });
        }
      });
  });
};

var confirmSuperUserCreation = function(hasSuperUser) {
  var proceed = true;

  if(hasSuperUser) {
    prompt.get([{
        name: 'editwanted',
        type: 'boolean',
        warning: 'Type true or false',
        required: true
      }], function (err, result) {
        if(result.editwanted) {
          createSuperUser();
        } else {
          mongoose.connection.close();
        }
    });
  } else {
    createSuperUser();
  }
};

console.log('Checking directories...')
if (!fs.existsSync(imageReleasesDir)){
    fs.mkdirSync(imageReleasesDir);
}
console.log('Checking if a superuser exists...');
prompt.start();
user.find({is_superuser: true}, function(err, matchedUsers) {
  var hasSuperUser = false;
  if(err || !matchedUsers || 0 === matchedUsers.length) {
    console.log('No superuser found! Creating one...');
  } else {
    console.log('Superusers found!');
    hasSuperUser = true;
  }
  confirmSuperUserCreation(hasSuperUser);
});
