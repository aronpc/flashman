const Validator = require('../public/javascripts/device_validator');
const DeviceModel = require('../models/device');
const User = require('../models/user');
const Config = require('../models/config');
const mqtt = require('mqtt');
let deviceListController = {};

const fs = require('fs');
const imageReleasesDir = process.env.FLM_IMG_RELEASE_DIR;
const mqttBrokerURL = process.env.FLM_MQTT_BROKER;

const getReleases = function() {
  let releases = [];
  fs.readdirSync(imageReleasesDir).forEach((filename) => {
    // File name pattern is VENDOR_MODEL_MODELVERSION_RELEASE.bin
    let fnameSubStrings = filename.split('_');
    let releaseSubStringRaw = fnameSubStrings[fnameSubStrings.length - 1];
    let releaseSubStringsRaw = releaseSubStringRaw.split('.');
    let releaseId = releaseSubStringsRaw[0];
    let releaseModel = fnameSubStrings[1];
    if (fnameSubStrings.length == 4) {
      releaseModel += fnameSubStrings[2];
    }
    let release = {id: releaseId, model: releaseModel};
    releases.push(release);
  });
  return releases;
};

const getStatus = function(devices) {
  let statusAll = {};
  let yesterday = new Date();
  // 24 hours back from now
  yesterday.setDate(yesterday.getDate() - 1);
  devices.forEach((device) => {
    let deviceColor = 'red-text';
    if (device.last_contact.getTime() > yesterday.getTime()) {
      deviceColor = 'green-text';
    }
    statusAll[device._id] = deviceColor;
  });
  return statusAll;
};

const getOnlineCount = function(query, status) {
  let andQuery = {};
  let yesterday = new Date();
  // 24 hours back from now
  yesterday.setDate(yesterday.getDate() - 1);
  andQuery.$and = [{last_contact: {$gt: yesterday.getTime()}}, query];
  DeviceModel.count(andQuery, function(err, count) {
    if (err) {
      status.onlinenum = 0;
    }
    status.onlinenum = count;
  });
};

const getTotalCount = function(query, status) {
  DeviceModel.count(query, function(err, count) {
    if (err) {
      status.totalnum = 0;
    }
    status.totalnum = count;
  });
};

const isJSONObject = function(val) {
  return val instanceof Object ? true : false;
};

const returnObjOrEmptyStr = function(query) {
  if (typeof query !== 'undefined' && query) {
    return query;
  } else {
    return '';
  }
};

// List all devices on a main page
deviceListController.index = function(req, res) {
  let indexContent = {};
  let reqPage = 1;

  if (req.query.page) {
    reqPage = req.query.page;
  }
  // Counters
  let status = {};
  getOnlineCount({}, status);
  getTotalCount({}, status);

  DeviceModel.paginate({}, {page: reqPage,
                            limit: 10,
                            sort: {_id: 1}}, function(err, devices) {
    if (err) {
      indexContent.type = 'danger';
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    let releases = getReleases();
    status.devices = getStatus(devices.docs);
    indexContent.username = req.user.name;
    indexContent.devices = devices.docs;
    indexContent.releases = releases;
    indexContent.status = status;
    indexContent.page = devices.page;
    indexContent.pages = devices.pages;

    User.findOne({name: req.user.name}, function(err, user) {
      if (err || !user) { indexContent.superuser = false; }
      else { indexContent.superuser = user.is_superuser; }

      Config.findOne({is_default: true}, function(err, matchedConfig) {
        if (err || !matchedConfig) { indexContent.update = false; }
        else { indexContent.update = matchedConfig.hasUpdate; }

        return res.render('index', indexContent);
      });
    });
  });
};

deviceListController.changeUpdate = function(req, res) {
  DeviceModel.findById(req.params.id, function(err, matchedDevice) {
    if (err) {
      let indexContent = {};
      indexContent.type = 'danger';
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    matchedDevice.do_update = req.body.do_update;
    matchedDevice.release = req.params.release.trim();
    matchedDevice.save(function(err) {
      if (err) {
        let indexContent = {};
        indexContent.type = 'danger';
        indexContent.message = err.message;
        return res.render('error', indexContent);
      }

      // Send notification to device using MQTT
      let client = mqtt.connect(mqttBrokerURL);
      client.on('connect', function() {
        client.publish(
          'flashman/update/' + matchedDevice._id,
          '1', {qos: 1, retain: true}); // topic, msg, options
        client.end();
      });

      return res.status(200).json({'success': true});
    });
  });
};

deviceListController.changeAllUpdates = function(req, res) {
  let form = JSON.parse(req.body.content);
  DeviceModel.find({'_id': {'$in': Object.keys(form.ids)}},
  function(err, matchedDevices) {
    if (err) {
      let indexContent = {};
      indexContent.type = 'danger';
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }

    // Send notification to device using MQTT
    let client = mqtt.connect(mqttBrokerURL);
    client.on('connect', function() {
      for (let idx = 0; idx < matchedDevices.length; idx++) {
        matchedDevices[idx].release = form.ids[matchedDevices[idx]._id].trim();
        matchedDevices[idx].do_update = form.do_update;
        matchedDevices[idx].save();

        client.publish(
          'flashman/update/' + matchedDevices[idx]._id,
          '1', {qos: 1, retain: true},
          function(err) {
            if (idx == (matchedDevices.length - 1)) {
              client.end();
            }
          }
        ); // topic, msg, options, callback
      }
    });

    return res.status(200).json({'success': true});
  });
};

deviceListController.searchDeviceReg = function(req, res) {
  let queryInput = new RegExp(req.query.content, 'i');
  let queryArray = [];
  let indexContent = {};
  let reqPage = 1;

  for (let property in DeviceModel.schema.paths) {
    if (DeviceModel.schema.paths.hasOwnProperty(property) &&
        DeviceModel.schema.paths[property].instance === 'String') {
      let field = {};
      field[property] = queryInput;
      queryArray.push(field);
    }
  }
  let query = {
    $or: queryArray,
  };
  if (req.query.page) {
    reqPage = req.query.page;
  }
  // Counters
  let status = {};
  getOnlineCount(query, status);
  getTotalCount(query, status);

  DeviceModel.paginate(query, {page: reqPage,
                            limit: 10,
                            sort: {_id: 1}}, function(err, matchedDevices) {
    if (err) {
      indexContent.type = 'danger';
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    let releases = getReleases();
    status.devices = getStatus(matchedDevices.docs);
    indexContent.username = req.user.name;
    indexContent.devices = matchedDevices.docs;
    indexContent.releases = releases;
    indexContent.status = status;
    indexContent.page = matchedDevices.page;
    indexContent.pages = matchedDevices.pages;
    indexContent.lastquery = req.query.content;

    User.findOne({name: req.user.name}, function(err, user) {
      if (err || !user) { indexContent.superuser = false; }
      else { indexContent.superuser = user.is_superuser; }

      Config.findOne({is_default: true}, function(err, matchedConfig) {
        if (err || !matchedConfig) { indexContent.update = false; }
        else { indexContent.update = matchedConfig.hasUpdate; }

        return res.render('index', indexContent);
      });
    });
  });
};

deviceListController.delDeviceReg = function(req, res) {
  DeviceModel.remove({_id: req.params.id}, function(err) {
    if (err) {
      return res.status(500).json({'message': 'device cannot be removed'});
    }
    return res.status(200).json({'success': true});
  });
};

//
// REST API only functions
//

deviceListController.getDeviceReg = function(req, res) {
  DeviceModel.findById(req.params.id, function(err, matchedDevice) {
    if (err) {
      return res.status(500).json({'message': 'internal server error'});
    }
    if (matchedDevice == null) {
      return res.status(404).json({'message': 'device not found'});
    }
    return res.status(200).json(matchedDevice);
  });
};

deviceListController.setDeviceReg = function(req, res) {
  DeviceModel.findById(req.params.id, function(err, matchedDevice) {
    if (err) {
      return res.status(200).json({
        message: 'internal server error',
        errors: [],
      });
    }
    if (matchedDevice == null) {
      return res.status(404).json({
        message: 'device not found',
        errors: [],
      });
    }

    if (isJSONObject(req.body.content)) {
      let content = req.body.content;
      let updateParameters = false;
      let validator = new Validator();

      let errors = [];
      let pppoe_user = returnObjOrEmptyStr(content.pppoe_user).trim();
      let pppoe_password = returnObjOrEmptyStr(content.pppoe_password).trim();
      let ssid = returnObjOrEmptyStr(content.wifi_ssid).trim();
      let password = returnObjOrEmptyStr(content.wifi_password).trim();
      let channel = returnObjOrEmptyStr(content.wifi_channel).trim();
      let pppoe = (pppoe_user !== '' && pppoe_password !== '');

      let genericValidate = function(field, func, key) {
        let valid_field = func(field);
        if (!valid_field.valid) {
          valid_field.err.forEach(function(error) {
            let obj = {};
            obj[key] = error;
            errors.push(obj);
          });
        }
      };

      // Validate fields
      if (pppoe) {
        genericValidate(pppoe_user, validator.validateUser, 'pppoe_user');
        genericValidate(pppoe_password, validator.validatePassword, 'pppoe_password');
      }
      genericValidate(ssid, validator.validateSSID, 'ssid');
      genericValidate(password, validator.validateWifiPassword, 'password');
      genericValidate(channel, validator.validateChannel, 'channel');

      if (errors.length < 1) {
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
        if (content.hasOwnProperty('external_reference')) {
          matchedDevice.external_reference = content.external_reference;
          updateParameters = true;
        }
        if (updateParameters) {
          matchedDevice.do_update_parameters = true;
        }

        matchedDevice.save();

        // Send notification to device using MQTT
        let client = mqtt.connect(mqttBrokerURL);
        client.on('connect', function() {
          client.publish(
            'flashman/update/' + matchedDevice._id,
            '1', {qos: 1, retain: true}); // topic, msg, options
          client.end();
        });

        return res.status(200).json(matchedDevice);
      } else {
        return res.status(200).json({
          message: 'Erro validando os campos, ver campo "errors"',
          errors: errors,
        });
      }
    } else {
      return res.status(200).json({
        message: 'error parsing json',
        errors: [],
      });
    }
  });
};

deviceListController.createDeviceReg = function(req, res) {
  if (isJSONObject(req.body.content)) {
    const content = req.body.content;
    const macAddr = content.mac_address.trim().toUpperCase();
    const extReference = content.external_reference;
    const validator = new Validator();

    let errors = [];
    let release = returnObjOrEmptyStr(content.release).trim();
    let pppoe_user = returnObjOrEmptyStr(content.pppoe_user).trim();
    let pppoe_password = returnObjOrEmptyStr(content.pppoe_password).trim();
    let ssid = returnObjOrEmptyStr(content.wifi_ssid).trim();
    let password = returnObjOrEmptyStr(content.wifi_password).trim();
    let channel = returnObjOrEmptyStr(content.wifi_channel).trim();
    let pppoe = (pppoe_user !== '' && pppoe_password !== '');

    let genericValidate = function(field, func, key) {
      let valid_field = func(field);
      if (!valid_field.valid) {
        valid_field.err.forEach(function(error) {
          let obj = {};
          obj[key] = error;
          errors.push(obj);
        });
      }
    };

    // Validate fields
    genericValidate(macAddr, validator.validateMac, 'mac');
    if (pppoe) {
      genericValidate(pppoe_user, validator.validateUser, 'pppoe_user');
      genericValidate(pppoe_password, validator.validatePassword, 'pppoe_password');
    }
    genericValidate(ssid, validator.validateSSID, 'ssid');
    genericValidate(password, validator.validateWifiPassword, 'password');
    genericValidate(channel, validator.validateChannel, 'channel');

    DeviceModel.findById(macAddr, function(err, matchedDevice) {
      if (err) {
        return res.status(500).json({
          message: 'Erro interno do servidor',
          errors: errors,
        });
      } else {
        if (matchedDevice) {
          errors.push({mac: 'Endereço MAC já cadastrado'});
        }
        if (errors.length < 1) {
          newDeviceModel = new DeviceModel({
            '_id': macAddr,
            'external_reference': extReference,
            'model': '',
            'release': release,
            'pppoe_user': pppoe_user,
            'pppoe_password': pppoe_password,
            'wifi_ssid': ssid,
            'wifi_password': password,
            'wifi_channel': channel,
            'last_contact': new Date('January 1, 1970 01:00:00'),
            'do_update': false,
            'do_update_parameters': false,
          });
          newDeviceModel.save(function(err) {
            if (err) {
              return res.status(200).json({
                message: 'Erro ao salvar registro',
                errors: errors,
              });
            } else {
              return res.status(200).json({'success': true});
            }
          });
        } else {
          return res.status(200).json({
            message: 'Erro validando os campos, ver campo \"errors\"',
            errors: errors,
          });
        }
      }
    });
  } else {
    return res.status(200).json({
      message: 'Erro no json recebido',
      errors: [],
    });
  }
};

module.exports = deviceListController;
