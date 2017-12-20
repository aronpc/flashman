
var deviceModel = require('../models/device');
var mqtt = require('mqtt');
var deviceListController = {};

const fs = require('fs');
const imageReleasesDir = require('../config/configs').imageReleasesDir;
const mqttBrokerURL = require('../config/configs').mqttBrokerURL;

var getReleases = function() {
  var releases = [];
  fs.readdirSync(imageReleasesDir).forEach(filename => {
    // File name pattern is VENDOR_MODEL_RELEASE.bin
    var fnameSubStrings = filename.split('_');
    var releaseSubStringRaw = fnameSubStrings[fnameSubStrings.length - 1];
    var releaseSubStringsRaw = releaseSubStringRaw.split('.');
    var releaseId = releaseSubStringsRaw[0];
    var releaseModel = fnameSubStrings[1];
    var release = {id: releaseId, model: releaseModel};
    releases.push(release);
  });
  return releases;
};

var getStatus = function(devices) {
  var statusAll = {};
  var yesterday = new Date();
  // 24 hours back from now
  yesterday.setDate(yesterday.getDate() - 1);
  devices.forEach(device => {
    var deviceColor = "offline-sign";
    if(device.last_contact.getTime() > yesterday.getTime()) {
      deviceColor = "online-sign";
    }
    statusAll[device._id] = deviceColor;
  });
  return statusAll;
};

var getOnlineCount = function(query, status) {
  var andQuery = {};
  var yesterday = new Date();
  // 24 hours back from now
  yesterday.setDate(yesterday.getDate() - 1);
  andQuery.$and = [{ last_contact: {$gt: yesterday.getTime()}}, query];
  deviceModel.count(andQuery, function(err, count) {
    if(err) {
      status.onlinenum = 0;
    }
    status.onlinenum = count;
  });
};

var getTotalCount = function(query, status) {
  deviceModel.count(query, function(err, count) {
    if(err) {
      status.totalnum = 0;
    }
    status.totalnum = count;
  });
};

var isJSONObject = function(val) {
  return val instanceof Object ? true : false;
}

// List all devices on a main page
deviceListController.index = function(req, res) {
  var indexContent = {apptitle: 'FlashMan'};
  var reqPage = 1;

  if(req.query.page) {
    reqPage = req.query.page;
  }
  // Counters
  var status = {};
  getOnlineCount({}, status);
  getTotalCount({}, status);

  deviceModel.paginate({}, {page: reqPage,
                            limit: 10,
                            sort: {_id: 1}}, function(err, devices) {
    if(err) {
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    var releases = getReleases();
    status.devices = getStatus(devices.docs);
    indexContent.username = req.user.name;
    indexContent.devices = devices.docs;
    indexContent.releases = releases;
    indexContent.status = status;
    indexContent.page = devices.page;
    indexContent.pages = devices.pages;

    return res.render('index', indexContent);
  });
};

deviceListController.changeUpdate = function(req, res) {
  deviceModel.findById(req.params.id, function(err, matchedDevice) {
    if(err) {
      var indexContent = {apptitle: 'FlashMan'};
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    var oldstatus = matchedDevice.do_update;
    if(oldstatus == true) {
      matchedDevice.do_update = false;
    } else {
      matchedDevice.do_update = true;
    }
    matchedDevice.release = req.params.release;
    matchedDevice.save();

    // Send notification to device using MQTT
    var client  = mqtt.connect(mqttBrokerURL);
    client.on('connect', function () {
      client.publish(
        'flashman/update/' + matchedDevice._id, 
        '1', {qos: 1, retain: true}); // topic, msg, options
      client.end();
    });

    return res.status(200).json({'success': true});
  });
};

deviceListController.changeAllUpdates = function(req, res) {
  var form = JSON.parse(req.body.content);
  deviceModel.find({'_id': {'$in': Object.keys(form.ids)}},
  function(err, matchedDevices) {
    if(err) {
      var indexContent = {apptitle: 'FlashMan'};
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }

    // Send notification to device using MQTT
    var client  = mqtt.connect(mqttBrokerURL);
    client.on('connect', function() {
      for(var idx in matchedDevices) {
        
        matchedDevices[idx].release = form.ids[matchedDevices[idx]._id];
        matchedDevices[idx].do_update = form.do_update;
        matchedDevices[idx].save();

        client.publish(
          'flashman/update/' + matchedDevices[idx]._id, 
          '1', {qos: 1, retain: true},
          function(err) {
            if(idx == (matchedDevices.length - 1)) {
              client.end();
            }
          }
        ); // topic, msg, options, callback
      }
    });

    return res.status(200).json({'success': true});
  });
};

deviceListController.delDeviceReg =  function(req, res) {
  deviceModel.remove({_id: req.params.id}, function(err) {
    if(err) {
      return res.status(500).json({'message': 'device cannot be removed'});
    }
    return res.status(200).json({'success': true});
  });
};

deviceListController.searchDeviceReg =  function(req, res) {
  var queryInput = new RegExp(req.query.content, 'i');
  var queryArray = [];
  var indexContent = {apptitle: 'FlashMan'};
  var reqPage = 1;

  for (var property in deviceModel.schema.paths) {
    if (deviceModel.schema.paths.hasOwnProperty(property) &&
        deviceModel.schema.paths[property].instance === "String") {
      var field = {};
      field[property] = queryInput;
      queryArray.push(field);
    }
  }
  var query = {
    $or: queryArray
  };
  if(req.query.page) {
    reqPage = req.query.page;
  }
  // Counters
  var status = {};
  getOnlineCount(query, status);
  getTotalCount(query, status);

  deviceModel.paginate(query, {page: reqPage,
                            limit: 10,
                            sort: {_id: 1}}, function(err, matchedDevices) {
    if(err) {
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    var releases = getReleases();
    status.devices = getStatus(matchedDevices.docs);
    indexContent.username = req.user.name;
    indexContent.devices = matchedDevices.docs;
    indexContent.releases = releases;
    indexContent.status = status;
    indexContent.page = matchedDevices.page;
    indexContent.pages = matchedDevices.pages;
    indexContent.lastquery = req.query.content;

    return res.render('index', indexContent);
  });
};

//
// REST API functions
//

deviceListController.getDeviceReg =  function(req, res) {
  deviceModel.findById(req.params.id, function(err, matchedDevice) {
    if(err){
      return res.status(500).json({'message': 'internal server error'});
    }
    if(matchedDevice == null){
      return res.status(404).json({'message': 'device not found'});
    }
    return res.status(200).json(matchedDevice);
  });
};

deviceListController.setDeviceReg =  function(req, res) {
  deviceModel.findById(req.params.id, function(err, matchedDevice) {
    if(err){
      return res.status(500).json({'message': 'internal server error'});
    }
    if(matchedDevice == null){
      return res.status(404).json({'message': 'device not found'});
    }

    if(isJSONObject(req.body.content)){
      var content = req.body.content;
      var updateParameters = false;

      if(content.hasOwnProperty('pppoe_user')){
        matchedDevice.pppoe_user = content.pppoe_user;
        updateParameters = true;
      }
      if(content.hasOwnProperty('pppoe_password')){
        matchedDevice.pppoe_password = content.pppoe_password;
        updateParameters = true;
      }
      if(content.hasOwnProperty('wifi_ssid')){
        matchedDevice.wifi_ssid = content.wifi_ssid;
        updateParameters = true;
      }
      if(content.hasOwnProperty('wifi_password')){
        matchedDevice.wifi_password = content.wifi_password;
        updateParameters = true;
      }
      if(content.hasOwnProperty('wifi_channel')){
        matchedDevice.wifi_channel = content.wifi_channel;
        updateParameters = true;
      }
      if(updateParameters){
        matchedDevice.do_update_parameters = true;
      }

      matchedDevice.save();

      // Send notification to device using MQTT
      var client  = mqtt.connect(mqttBrokerURL);
      client.on('connect', function () {
        client.publish(
          'flashman/update/' + matchedDevice._id, 
          '1', {qos: 1, retain: true}); // topic, msg, options
        client.end();
      });

      return res.status(200).json(matchedDevice);
    } else {
      return res.status(500).json({'message': 'error parsing json'});
    }
  });
};

module.exports = deviceListController;
