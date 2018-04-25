
const DeviceModel = require('../models/device');
const mqtt = require('mqtt');
let deviceInfoController = {};

const mqttBrokerURL = process.env.FLM_MQTT_BROKER;
const mqttBrokerCA  = process.env.FLM_MQTT_CA;
const deviceAllowUpdateRESTData = JSON.parse(
  process.env.FLM_ALLOW_DEV_UPDATE_REST_DATA
);

const returnObjOrEmptyStr = function(query) {
  if (typeof query !== 'undefined' && query) {
    return query;
  } else {
    return '';
  }
};

const createRegistry = function(req, res) {
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (typeof req.body.id == 'undefined') {
    return res.status(400);
  }
  newDeviceModel = new DeviceModel({
    '_id': req.body.id.trim().toUpperCase(),
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
  newDeviceModel.save(function(err) {
    if (err) {
      console.log('Error creating device: ' + err);
      return res.status(500);
    } else {
      return res.status(200).json({'do_update': false,
                                   'release_id:': req.body.release_id.trim()});
    }
  });
};

const isJSONObject = function(val) {
  return val instanceof Object ? true : false;
};

// Create new device entry or update an existing one
deviceInfoController.updateDevicesInfo = function(req, res) {
  DeviceModel.findById(req.body.id.toUpperCase(), function(err, matchedDevice) {
    if (err) {
      console.log('Error finding device: ' + err);
      return res.status(500);
    } else {
      if (matchedDevice == null) {
        createRegistry(req, res);
      } else {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Update old entries
        if (!matchedDevice.get('do_update_parameters')) {
          matchedDevice.do_update_parameters = false;
        }

        // Parameters *NOT* available to be modified by REST API
        matchedDevice.model = returnObjOrEmptyStr(req.body.model).trim() +
                              returnObjOrEmptyStr(req.body.model_ver).trim();
        matchedDevice.version = returnObjOrEmptyStr(req.body.version).trim();
        matchedDevice.wan_ip = returnObjOrEmptyStr(req.body.wan_ip).trim();
        matchedDevice.ip = ip;
        matchedDevice.last_contact = Date.now();

        // Parameters available to be modified by REST API
        if ((!matchedDevice.do_update_parameters) && deviceAllowUpdateRESTData) {
          matchedDevice.release = returnObjOrEmptyStr(req.body.release_id).trim();
          matchedDevice.pppoe_user = returnObjOrEmptyStr(req.body.pppoe_user).trim();
          matchedDevice.pppoe_password = returnObjOrEmptyStr(req.body.pppoe_password).trim();
          matchedDevice.wifi_ssid = returnObjOrEmptyStr(req.body.wifi_ssid).trim();
          matchedDevice.wifi_password = returnObjOrEmptyStr(req.body.wifi_password).trim();
          matchedDevice.wifi_channel = returnObjOrEmptyStr(req.body.wifi_channel).trim();
        }

        // We can disable since the device will receive the update
        matchedDevice.do_update_parameters = false;

        // Remove notification to device using MQTT
        let client = mqtt.connect(mqttBrokerURL, {ca : mqttBrokerCA});
        client.on('connect', function() {
          client.publish(
            'flashman/update/' + matchedDevice._id,
            '', {qos: 1, retain: true}); // topic, msg, options
          client.end();
        });

        matchedDevice.save();
        return res.status(200).json({
          'do_update': matchedDevice.do_update,
          'release_id': returnObjOrEmptyStr(matchedDevice.release),
          'pppoe_user': returnObjOrEmptyStr(matchedDevice.pppoe_user),
          'pppoe_password': returnObjOrEmptyStr(matchedDevice.pppoe_password),
          'wifi_ssid': returnObjOrEmptyStr(matchedDevice.wifi_ssid),
          'wifi_password': returnObjOrEmptyStr(matchedDevice.wifi_password),
          'wifi_channel': returnObjOrEmptyStr(matchedDevice.wifi_channel),
        });
      }
    }
  });
};

// Receive device firmware upgrade confirmation
deviceInfoController.confirmDeviceUpdate = function(req, res) {
  DeviceModel.findById(req.body.id, function(err, matchedDevice) {
    if (err) {
      console.log('Error finding device: ' + err);
      return res.status(500);
    } else {
      if (matchedDevice == null) {
        return res.status(500);
      } else {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        matchedDevice.ip = ip;
        matchedDevice.last_contact = Date.now();
        matchedDevice.do_update = false;
        matchedDevice.save();
        return res.status(200);
      }
    }
  });
};

deviceInfoController.registerApp = function(req, res) {
  if (req.body.secret == req.app.locals.secret) {
    DeviceModel.findById(req.body.id, function(err, matchedDevice) {
      if (err) {
        return res.status(400).json({is_registered: 0});
      }
      if (!matchedDevice) {
        return res.status(404).json({is_registered: 0});
      }
      let appObj = matchedDevice.apps.filter(function(app) {
        return app.id === req.body.app_id;
      });
      if (appObj.length == 0) {
        matchedDevice.apps.push({id: req.body.app_id,
                                 secret: req.body.app_secret,
                                 FCM: ""});
      } else {
        let objIdx = matchedDevice.apps.indexOf(appObj[0]);
        matchedDevice.apps.splice(objIdx, 1);
        appObj[0].secret = req.body.app_secret;
        matchedDevice.apps.push(appObj[0]);
      }
      matchedDevice.save();
      return res.status(200).json({is_registered: 1});
    });
  } else {
    return res.status(401).json({is_registered: 0});
  }
};

deviceInfoController.removeApp = function(req, res) {
  if (req.body.secret == req.app.locals.secret) {
    DeviceModel.findById(req.body.id, function(err, matchedDevice) {
      if (err) {
        return res.status(400).json({is_unregistered: 0});
      }
      if (!matchedDevice) {
        return res.status(404).json({is_unregistered: 0});
      }
      let appsFiltered = matchedDevice.apps.filter(function(app) {
        return app.id !== req.body.app_id;
      });
      matchedDevice.apps = appsFiltered;
      matchedDevice.save();
      return res.status(200).json({is_unregistered: 1});
    });
  } else {
    return res.status(401).json({is_unregistered: 0});
  }
};

deviceInfoController.appSet = function(req, res) {
  DeviceModel.findById(req.body.id, function(err, matchedDevice) {
    if (err) {
      return res.status(400).json({is_set: 0});
    }
    if (!matchedDevice) {
      return res.status(404).json({is_set: 0});
    }
    let appObj = matchedDevice.apps.filter(function(app) {
      return app.id === req.body.app_id;
    });
    if (appObj.length == 0) {
      return res.status(404).json({is_set: 0});
    }
    if (appObj[0].secret != req.body.app_secret) {
      return res.status(404).json({is_set: 0});
    }

    if (isJSONObject(req.body.content)) {
      let content = req.body.content;
      let updateParameters = false;

      if (content.hasOwnProperty('FCMid')) {
        let objIdx = matchedDevice.apps.indexOf(appObj[0]);
        matchedDevice.apps.splice(objIdx, 1);
        appObj[0].FCM = content.FCMid;
        matchedDevice.apps.push(appObj[0]);
      }

      if (content.hasOwnProperty('pppoe_user')) {
        matchedDevice.pppoe_user = content.pppoe_user;
        updateParameters = true;
      }
      if (content.hasOwnProperty('pppoe_password')) {
        matchedDevice.pppoe_password = content.pppoe_password;
        updateParameters = true;
      }
      if (content.hasOwnProperty('wifi_ssid')) {
        matchedDevice.wifi_ssid = content.wifi_ssid;
        updateParameters = true;
      }
      if (content.hasOwnProperty('wifi_password')) {
        matchedDevice.wifi_password = content.wifi_password;
        updateParameters = true;
      }
      if (content.hasOwnProperty('wifi_channel')) {
        matchedDevice.wifi_channel = content.wifi_channel;
        updateParameters = true;
      }
      if (updateParameters) {
        matchedDevice.do_update_parameters = true;
      }

      matchedDevice.save();

      if (updateParameters) {
        // Send notification to device using MQTT
        let client = mqtt.connect(mqttBrokerURL, {ca : mqttBrokerCA});
        client.on('connect', function() {
          client.publish(
            'flashman/update/' + matchedDevice._id,
            '1', {qos: 1, retain: true}); // topic, msg, options
          client.end();
        });
      }

      return res.status(200).json({is_set: 1});
    } else {
      return res.status(500).json({is_set: 0});
    }
  });
};

module.exports = deviceInfoController;
