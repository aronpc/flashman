
var fs = require('fs');
var prompt = require('prompt');
var mongoose = require('mongoose');
var user = require('../models/user');

const imageReleasesDir = require('../config/configs').imageReleasesDir;
const mqttBrokerURL = require('../config/configs').mqttBrokerURL;

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
            checkMQTTBrokerURL();
          });
        } else {
          matchedUser.password = result.password;
          matchedUser.save(function(err) {
            if(err) {
              console.log(err);
            }
            console.log('User successfully edited!');
            mongoose.connection.close();
            checkMQTTBrokerURL();
          });
        }
      });
  });
};

var createMQTTBrokerURL = function() {
  prompt.get([{
      name: 'mqttbrokerurl',
      message: 'New MQTT broker URL',
      validator: /^mqtt\:\/\/[a-zA-Z0-9\-\/\:\.]+$/,
      warning: 'Always include mqtt://',
      required: true
    }], function (err, result) {
      require('../config/configs').mqttBrokerURL = result.mqttbrokerurl;
    });
};

var confirmSuperUserCreation = function(hasSuperUser) {
  var proceed = true;

  if(hasSuperUser) {
    prompt.get([{
        name: 'editwanted',
        message: 'Do you want to change the superuser? (true/false)',
        type: 'boolean',
        warning: 'Type true or false',
        required: true
      }], function (err, result) {
        if(result.editwanted) {
          createSuperUser();
        } else {
          mongoose.connection.close();
          checkMQTTBrokerURL();
        }
    });
  } else {
    createSuperUser();
  }
};

var confirmMQTTBrokerURLCreation = function(hasBrokerURL) {
  var proceed = true;

  if(hasBrokerURL) {
    prompt.get([{
        name: 'editwanted',
        message: 'Do you want to change the MQTT broker URL? (true/false)',
        type: 'boolean',
        warning: 'Type true or false',
        required: true
      }], function (err, result) {
        if(result.editwanted) {
          createMQTTBrokerURL();
        }
    });
  } else {
    createMQTTBrokerURL();
  }
};

var checkMQTTBrokerURL = function() {
  console.log('Checking if MQTT broker URL exists...');
  var hasBrokerURL = false;
  if (mqttBrokerURL.startsWith("mqtt://")) {
    console.log('MQTT broker URL found!');
    hasBrokerURL = true;
  } 
  confirmMQTTBrokerURLCreation(hasBrokerURL);
}

console.log('Checking directories...')
if (!fs.existsSync(imageReleasesDir)) {
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
