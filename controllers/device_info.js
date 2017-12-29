
var deviceModel = require('../models/device');
var mqtt = require('mqtt');
var deviceInfoController = {};

const deviceAllowUpdateRESTData = require('../config/configs').deviceAllowUpdateRESTData;
const mqttBrokerURL = require('../config/configs').mqttBrokerURL;

var returnObjOrEmptyStr = function(query) {
  if(typeof query !== 'undefined' && query) {
    return query;
  } else {
    return "";
  }
};

var createRegistry = function(req, res) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if(typeof req.body.id == 'undefined') {
    return res.status(400);
  }
  newDeviceModel = new deviceModel({'_id': req.body.id.trim().toUpperCase(),
                                    'model': returnObjOrEmptyStr(req.body.model).trim() +
                                             returnObjOrEmptyStr(req.body.model_ver).trim(),
                                    'version': returnObjOrEmptyStr(req.body.version).trim(),
                                    'release': returnObjOrEmptyStr(req.body.release_id).trim(),
                                    'pppoe_user': returnObjOrEmptyStr(req.body.pppoe_user).trim(),
                                    'pppoe_password': returnObjOrEmptyStr(req.body.pppoe_password).trim(),
                                    'wifi_ssid': returnObjOrEmptyStr(req.body.wifi_ssid).trim(),
                                    'wifi_password': returnObjOrEmptyStr(req.body.wifi_password).trim(),
                                    'wifi_channel': returnObjOrEmptyStr(req.body.wifi_channel).trim(),
                                    'wan_ip': returnObjOrEmptyStr(req.body.wan_ip).trim(),
                                    'ip': ip,
                                    'last_contact': Date.now(),
                                    'do_update': false,
                                    'do_update_parameters': false,
                                  });
  newDeviceModel.save(function (err) {
    if (err) {
      console.log('Error creating device: ' + err);
      return res.status(500);
    } else {
      return res.status(200).json({'do_update': false,
                                   'release_id:': req.body.release_id.trim()});
    }
  });
};

// Create new device entry or update an existing one
deviceInfoController.updateDevicesInfo = function(req, res) {
  deviceModel.findById(req.body.id.toUpperCase(), function(err, matchedDevice) {
    if(err) {
      console.log('Error finding device: ' + err);
      return res.status(500);
    } else {
      if(matchedDevice == null){
        createRegistry(req, res);
      } else {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Update old entries
        if(!matchedDevice.hasOwnProperty('do_update_parameters')){
          matchedDevice.do_update_parameters = false;
        }

        // Parameters *NOT* available to be modified by REST API
        matchedDevice.model = returnObjOrEmptyStr(req.body.model).trim() +
                              returnObjOrEmptyStr(req.body.model_ver).trim();
        matchedDevice.version = returnObjOrEmptyStr(req.body.version).trim();
        matchedDevice.release = returnObjOrEmptyStr(req.body.release_id).trim();
        matchedDevice.wan_ip = returnObjOrEmptyStr(req.body.wan_ip).trim();
        matchedDevice.ip = ip;
        matchedDevice.last_contact = Date.now();

        // Parameters available to be modified by REST API
        if((!matchedDevice.do_update_parameters) && deviceAllowUpdateRESTData){
          matchedDevice.pppoe_user = returnObjOrEmptyStr(req.body.pppoe_user).trim();
          matchedDevice.pppoe_password = returnObjOrEmptyStr(req.body.pppoe_password).trim();
          matchedDevice.wifi_ssid = returnObjOrEmptyStr(req.body.wifi_ssid).trim();
          matchedDevice.wifi_password = returnObjOrEmptyStr(req.body.wifi_password).trim();
          matchedDevice.wifi_channel = returnObjOrEmptyStr(req.body.wifi_channel).trim();
        }

        // We can disable since the device will receive the update
        matchedDevice.do_update_parameters = false;

        // Remove notification to device using MQTT
        var client  = mqtt.connect(mqttBrokerURL);
        client.on('connect', function () {
          client.publish(
            'flashman/update/' + matchedDevice._id, 
            '', {qos: 1, retain: true}); // topic, msg, options
          client.end();
        });

        matchedDevice.save();
        return res.status(200).json({'do_update': matchedDevice.do_update,
                                     'release_id': returnObjOrEmptyStr(matchedDevice.release),
                                     'pppoe_user': returnObjOrEmptyStr(matchedDevice.pppoe_user),
                                     'pppoe_password': returnObjOrEmptyStr(matchedDevice.pppoe_password),
                                     'wifi_ssid': returnObjOrEmptyStr(matchedDevice.wifi_ssid),
                                     'wifi_password': returnObjOrEmptyStr(matchedDevice.wifi_password),
                                     'wifi_channel': returnObjOrEmptyStr(matchedDevice.wifi_channel)});
      }
    }
  });
};

// Receive device firmware upgrade confirmation
deviceInfoController.confirmDeviceUpdate = function(req, res) {
  deviceModel.findById(req.body.id, function(err, matchedDevice) {
    if(err) {
      console.log('Error finding device: ' + err);
      return res.status(500);
    } else {
      if(matchedDevice == null){
        return res.status(500);
      } else {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        matchedDevice.ip = ip;
        matchedDevice.last_contact = Date.now();
        matchedDevice.do_update = false;
        matchedDevice.save();
        return res.status(200);
      }
    }
  });
};

module.exports = deviceInfoController;
