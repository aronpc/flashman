
var prompt = require('prompt');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/flashman', {useMongoClient: true});
var user = require('../models/user');

var createSuperUser = function() {
  prompt.get([{
      description: 'Insert superuser user name: ',
      name: 'username',
      validator: /^[a-zA-Z\-]+$/,
      warning: 'Only letters and dashes are valid',
      required: true
    }, {
      description: 'Insert superuser password: ',
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
          });
        } else {
          matchedUser.password = result.password;
          matchedUser.save();
          console.log('User successfully edited!');
        }
      });
  });
};

var confirmSuperUserCreation = function(hasSuperUser) {
  var proceed = true;

  if(hasSuperUser) {
    prompt.get([{
        description: 'Want to create a new one or edit an existing one? ',
        name: 'editwanted',
        type: 'boolean',
        warning: 'Type true or false',
        required: true
      }], function (err, result) {
        if(result.editwanted) {
          createSuperUser();
        }
    });
  } else {
    createSuperUser();
  }
};

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
