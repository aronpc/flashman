const Validator = require('../public/javascripts/device_validator');
const DeviceModel = require('../models/device');
const User = require('../models/user');
const Config = require('../models/config');
const Role = require('../models/role');
const mqtt = require('../mqtts');
const extern_mqtt = require('mqtt');
let deviceListController = {};

const fs = require('fs');
const imageReleasesDir = process.env.FLM_IMG_RELEASE_DIR;

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
  let lastHour = new Date();
  lastHour.setHours(lastHour.getHours() - 1);

  devices.forEach((device) => {
    let deviceColor = 'grey-text';
    // MQTTS status
    if (mqtt.clients[device._id.toUpperCase()]) {
      deviceColor = 'green-text';
    } else {
      // No MQTT connected. Check last keepalive
      if (device.last_contact.getTime() > lastHour.getTime()) {
        deviceColor = 'red-text';
      }
    }
    statusAll[device._id] = deviceColor;
  });
  return statusAll;
};

const getOnlineCount = function(query, status) {
  let andQuery = {};
  let lastHour = new Date();
  lastHour.setHours(lastHour.getHours() - 1);

  andQuery.$and = [{last_contact: {$gt: lastHour.getTime()}}, query];
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
  let elementsPerPage = 10;

  if (req.query.page) {
    reqPage = req.query.page;
  }
  if (req.user.maxElementsPerPage) {
    elementsPerPage = req.user.maxElementsPerPage;
  }
  // Counters
  let status = {};
  getOnlineCount({}, status);
  getTotalCount({}, status);

  DeviceModel.paginate({}, {page: reqPage,
                            limit: elementsPerPage,
                            sort: {_id: 1}}, function(err, devices) {
    if (err) {
      indexContent.type = 'danger';
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    let releases = getReleases();
    status.devices = getStatus(devices.docs);
    indexContent.username = req.user.name;
    indexContent.elementsperpage = req.user.maxElementsPerPage;
    indexContent.devices = devices.docs;
    indexContent.releases = releases;
    indexContent.status = status;
    indexContent.page = devices.page;
    indexContent.pages = devices.pages;

    User.findOne({name: req.user.name}, function(err, user) {
      if (err || !user) {
        indexContent.superuser = false;
      } else {
        indexContent.superuser = user.is_superuser;
      }

      Config.findOne({is_default: true}, function(err, matchedConfig) {
        if (err || !matchedConfig) {
          indexContent.update = false;
        } else {
          indexContent.update = matchedConfig.hasUpdate;
        }

        // Filter data using user permissions
        if (req.user.is_superuser) {
          return res.render('index', indexContent);
        } else {
          Role.findOne({name: req.user.role}, function(err, role) {
            if (err) {
              console.log(err);
            }
            indexContent.role = role;
            return res.render('index', indexContent);
          });
        }
      });
    });
  });
};

deviceListController.changeUpdate = function(req, res) {
  DeviceModel.findById(req.params.id, function(err, matchedDevice) {
    if (err || !matchedDevice) {
      let indexContent = {};
      indexContent.type = 'danger';
      indexContent.message = err.message;
      return res.status(500).json({success: false,
                                   message: 'Erro ao encontrar dispositivo'});
    }
    matchedDevice.do_update = req.body.do_update;
    matchedDevice.release = req.params.release.trim();
    matchedDevice.save(function(err) {
      if (err) {
        let indexContent = {};
        indexContent.type = 'danger';
        indexContent.message = err.message;
        return res.status(500).json({success: false,
                                     message: 'Erro ao registrar atualização'});
      }

      if (process.env.FLM_MQTT_BROKER) {
        // Send notification to device using external MQTT server
        let client = extern_mqtt.connect(process.env.FLM_MQTT_BROKER);
        client.on('connect', function() {
          client.publish(
            'flashman/update/' + matchedDevice._id,
            '1', {qos: 1, retain: true}); // topic, msg, options
          client.end();
        });
      } else {
        mqtt.anlix_message_router_update(matchedDevice._id);
      }

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

    if (process.env.FLM_MQTT_BROKER) {
      // Send notification to device using external MQTT server
      let client = extern_mqtt.connect(process.env.FLM_MQTT_BROKER);
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
    } else {
      for (let idx = 0; idx < matchedDevices.length; idx++) {
        matchedDevices[idx].release = form.ids[matchedDevices[idx]._id].trim();
        matchedDevices[idx].do_update = form.do_update;
        matchedDevices[idx].save();
        mqtt.anlix_message_router_update(matchedDevices[idx]._id);
      }
    }

    return res.status(200).json({'success': true});
  });
};

deviceListController.searchDeviceReg = function(req, res) {
  let finalQuery = {};
  let finalQueryArray = [];
  let indexContent = {};
  let reqPage = 1;
  let elementsPerPage = 10;
  let queryContents = req.query.content.split(',');

  for (let idx=0; idx < queryContents.length; idx++) {
    let queryInput = new RegExp(queryContents[idx], 'i');
    let queryArray = [];

    if (queryContents[idx].toLowerCase() == 'online') {
      let field = {};
      let lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1);
      field['last_contact'] = {$gte: lastHour};
      queryArray.push(field);
    } else if (queryContents[idx].toLowerCase() == 'offline') {
      let field = {};
      let lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1);
      field['last_contact'] = {$lt: lastHour};
      queryArray.push(field);
    } else if ((queryContents[idx].toLowerCase() == 'upgrade on') ||
               (queryContents[idx].toLowerCase() == 'update on')) {
      let field = {};
      field['do_update'] = {$eq: true};
      queryArray.push(field);
    } else if ((queryContents[idx].toLowerCase() == 'upgrade off') ||
               (queryContents[idx].toLowerCase() == 'update off')) {
      let field = {};
      field['do_update'] = {$eq: false};
      queryArray.push(field);
    } else {
      for (let property in DeviceModel.schema.paths) {
        if (DeviceModel.schema.paths.hasOwnProperty(property) &&
            DeviceModel.schema.paths[property].instance === 'String') {
          let field = {};
          field[property] = queryInput;
          queryArray.push(field);
        }
      }
    }
    let query = {
      $or: queryArray,
    };
    finalQueryArray.push(query);
  }

  finalQuery = {
    $and: finalQueryArray,
  };

  if (req.query.page) {
    reqPage = req.query.page;
  }
  if (req.user.maxElementsPerPage) {
    elementsPerPage = req.user.maxElementsPerPage;
  }
  // Counters
  let status = {};
  getOnlineCount(finalQuery, status);
  getTotalCount(finalQuery, status);

  DeviceModel.paginate(finalQuery, {page: reqPage,
                            limit: elementsPerPage,
                            sort: {_id: 1}}, function(err, matchedDevices) {
    if (err) {
      indexContent.type = 'danger';
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    let releases = getReleases();
    status.devices = getStatus(matchedDevices.docs);
    indexContent.username = req.user.name;
    indexContent.elementsperpage = req.user.maxElementsPerPage;
    indexContent.devices = matchedDevices.docs;
    indexContent.releases = releases;
    indexContent.status = status;
    indexContent.page = matchedDevices.page;
    indexContent.pages = matchedDevices.pages;
    indexContent.lastquery = req.query.content;

    User.findOne({name: req.user.name}, function(err, user) {
      if (err || !user) {
        indexContent.superuser = false;
      } else {
        indexContent.superuser = user.is_superuser;
      }

      Config.findOne({is_default: true}, function(err, matchedConfig) {
        if (err || !matchedConfig) {
          indexContent.update = false;
        } else {
          indexContent.update = matchedConfig.hasUpdate;
        }

        // Filter data using user permissions
        if (req.user.is_superuser) {
          return res.render('index', indexContent);
        } else {
          Role.findOne({name: req.user.role}, function(err, role) {
            if (err) {
              console.log(err);
            }
            indexContent.role = role;
            return res.render('index', indexContent);
          });
        }
      });
    });
  });
};

deviceListController.delDeviceReg = function(req, res) {
  DeviceModel.remove({_id: req.params.id.toUpperCase()}, function(err) {
    if (err) {
      return res.status(500).json({success: false,
                                   message: 'Entrada não pode ser removida'});
    }
    return res.status(200).json({success: true});
  });
};

//
// REST API only functions
//

deviceListController.sendMqttMsg = function(req, res) {
  msgtype = req.params.msg.toLowerCase();
  if (msgtype == 'boot') {
    mqtt.anlix_message_router_reboot(req.params.id.toUpperCase());
    return res.status(200).json({success: true});
  } else if (msgtype == 'rstapp') {
    mqtt.anlix_message_router_resetapp(req.params.id.toUpperCase());
    return res.status(200).json({success: true}); ;
  } else if (msgtype == 'rstmqtt') {
    DeviceModel.findById(req.params.id.toUpperCase(),
    function(err, matchedDevice) {
      if (err) {
        return res.status(500).json({success: false,
                                     message: 'Erro interno do servidor'});
      }
      if (matchedDevice == null) {
        return res.status(404).json({success: false,
                                     message: 'Roteador não encontrado'});
      }

      // if we have a secret, remove it to allow a new one
      if (matchedDevice.mqtt_secret) {
        matchedDevice.mqtt_secret = null;
        matchedDevice.save();
      }

      mqtt.anlix_message_router_resetmqtt(req.params.id.toUpperCase());
      return res.status(200).json({success: true});
    });
  } else if (msgtype == 'log') {
    mqtt.anlix_message_router_log(req.params.id.toUpperCase());
    return res.status(200).json({success: true});
  } else {
    // Message not implemented
    console.log('REST API MQTT Message not recognized ('+ msgtype +')');
    return res.status(404).json({success: false,
                                 message: 'Esse comando não existe'});
  }
};

deviceListController.getFirstBootLog = function(req, res) {
  DeviceModel.findById(req.params.id.toUpperCase(),
  function(err, matchedDevice) {
    if (err) {
      return res.status(500).json({success: false,
                                   message: 'Erro interno do servidor'});
    }
    if (matchedDevice == null) {
      return res.status(404).json({success: false,
                                   message: 'Roteador não encontrado'});
    }

    if (matchedDevice.firstboot_log) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'text/plain');
      res.end(matchedDevice.firstboot_log, 'binary');
      return res.status(200);
    } else {
      return res.status(200).json({success: true,
                                   message: 'Não existe log deste roteador'});
    }
  });
};

deviceListController.getLastBootLog = function(req, res) {
  DeviceModel.findById(req.params.id.toUpperCase(),
  function(err, matchedDevice) {
    if (err) {
      return res.status(500).json({success: false,
                                   message: 'Erro interno do servidor'});
    }
    if (matchedDevice == null) {
      return res.status(404).json({success: false,
                                   message: 'Roteador não encontrado'});
    }

    if (matchedDevice.lastboot_log) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'text/plain');
      res.end(matchedDevice.lastboot_log, 'binary');
      return res.status(200);
    } else {
      return res.status(200).json({success: true,
                                   message: 'Não existe log deste roteador'});
    }
  });
};

deviceListController.getDeviceReg = function(req, res) {
  DeviceModel.findById(req.params.id.toUpperCase(),
  function(err, matchedDevice) {
    if (err) {
      return res.status(500).json({success: false,
                                   message: 'Erro interno do servidor'});
    }
    if (matchedDevice == null) {
      return res.status(404).json({success: false,
                                   message: 'Roteador não encontrado'});
    }

    // hide secret from api
    if (matchedDevice.mqtt_secret) {
      matchedDevice.mqtt_secret = null;
    }

    // hide logs - too large for json
    if (matchedDevice.firstboot_log) {
      matchedDevice['firstboot_log'] = null;
    }
    if (matchedDevice.lastboot_log) {
      matchedDevice['lastboot_log'] = null;
    }

    matchedDevice['online_status'] = (req.params.id in mqtt.clients);

    return res.status(200).json(matchedDevice);
  });
};

deviceListController.setDeviceReg = function(req, res) {
  DeviceModel.findById(req.params.id.toUpperCase(),
  function(err, matchedDevice) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        errors: [],
      });
    }
    if (matchedDevice == null) {
      return res.status(404).json({
        success: false,
        message: 'Roteador não encontrado',
        errors: [],
      });
    }

    if (isJSONObject(req.body.content)) {
      let content = req.body.content;
      let updateParameters = false;
      let validator = new Validator();

      let errors = [];
      let connectionType = returnObjOrEmptyStr(content.connection_type).trim();
      let pppoeUser = returnObjOrEmptyStr(content.pppoe_user).trim();
      let pppoePassword = returnObjOrEmptyStr(content.pppoe_password).trim();
      let ssid = returnObjOrEmptyStr(content.wifi_ssid).trim();
      let password = returnObjOrEmptyStr(content.wifi_password).trim();
      let channel = returnObjOrEmptyStr(content.wifi_channel).trim();

      let genericValidate = function(field, func, key) {
        let validField = func(field);
        if (!validField.valid) {
          validField.err.forEach(function(error) {
            let obj = {};
            obj[key] = error;
            errors.push(obj);
          });
        }
      };

      // Validate fields
      if (connectionType != 'pppoe' && connectionType != 'dhcp' &&
          connectionType != '') {
        return res.status(500).json({
          success: false,
          message: 'Tipo de conexão deve ser "pppoe" ou "dhcp"',
        });
      }
      if (pppoeUser !== '' && pppoePassword !== '') {
        connectionType = 'pppoe';
        genericValidate(pppoeUser, validator.validateUser, 'pppoe_user');
        genericValidate(pppoePassword, validator.validatePassword,
                        'pppoe_password');
      }
      if (content.hasOwnProperty('wifi_ssid')) {
        genericValidate(ssid, validator.validateSSID, 'ssid');
      }
      if (content.hasOwnProperty('wifi_password')) {
        genericValidate(password, validator.validateWifiPassword, 'password');
      }
      if (content.hasOwnProperty('wifi_channel')) {
        genericValidate(channel, validator.validateChannel, 'channel');
      }

      if (errors.length < 1) {
        Role.findOne({name: returnObjOrEmptyStr(req.user.role)},
        function(err, role) {
          if (err) {
            console.log(err);
          }
          let superuserGrant = false;
          if (!role && req.user.is_superuser) {
            superuserGrant = true;
          }
          if (connectionType != '' && (superuserGrant || role.grantWanType)) {
            if (connectionType === 'pppoe') {
              if (pppoeUser !== '' && pppoePassword !== '') {
                matchedDevice.connection_type = connectionType;
                updateParameters = true;
              }
            } else {
              matchedDevice.connection_type = connectionType;
              updateParameters = true;
            }
          }
          if (content.hasOwnProperty('pppoe_user') &&
              (superuserGrant || role.grantPPPoEInfo > 1) &&
              pppoeUser !== '') {
            matchedDevice.pppoe_user = pppoeUser;
            updateParameters = true;
          }
          if (content.hasOwnProperty('pppoe_password') &&
              (superuserGrant || role.grantPPPoEInfo > 1) &&
              pppoePassword !== '') {
            matchedDevice.pppoe_password = pppoePassword;
            updateParameters = true;
          }
          if (content.hasOwnProperty('wifi_ssid') &&
              (superuserGrant || role.grantWifiInfo > 1) &&
              ssid !== '') {
            matchedDevice.wifi_ssid = ssid;
            updateParameters = true;
          }
          if (content.hasOwnProperty('wifi_password') &&
              (superuserGrant || role.grantWifiInfo > 1) &&
              password !== '') {
            matchedDevice.wifi_password = password;
            updateParameters = true;
          }
          if (content.hasOwnProperty('wifi_channel') &&
              (superuserGrant || role.grantWifiInfo > 1) &&
              channel !== '') {
            matchedDevice.wifi_channel = channel;
            updateParameters = true;
          }
          if (content.hasOwnProperty('external_reference') &&
              (superuserGrant || role.grantDeviceId)) {
            matchedDevice.external_reference = content.external_reference;
          }
          if (updateParameters) {
            matchedDevice.do_update_parameters = true;
          }
          matchedDevice.save(function(err) {
            if (err) {
              console.log(err);
            }
            if (process.env.FLM_MQTT_BROKER) {
              // Send notification to device using external MQTT server
              let client = extern_mqtt.connect(process.env.FLM_MQTT_BROKER);
              client.on('connect', function() {
                client.publish(
                  'flashman/update/' + matchedDevice._id,
                  '1', {qos: 1, retain: true}); // topic, msg, options
                client.end();
              });
            } else {
              mqtt.anlix_message_router_update(matchedDevice._id);
            }

            matchedDevice.success = true;
            return res.status(200).json(matchedDevice);
          });
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Erro validando os campos, ver campo "errors"',
          errors: errors,
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erro ao tratar JSON',
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
    let connectionType = returnObjOrEmptyStr(content.connection_type).trim();
    let pppoeUser = returnObjOrEmptyStr(content.pppoe_user).trim();
    let pppoePassword = returnObjOrEmptyStr(content.pppoe_password).trim();
    let ssid = returnObjOrEmptyStr(content.wifi_ssid).trim();
    let password = returnObjOrEmptyStr(content.wifi_password).trim();
    let channel = returnObjOrEmptyStr(content.wifi_channel).trim();
    let pppoe = (pppoeUser !== '' && pppoePassword !== '');

    let genericValidate = function(field, func, key) {
      let validField = func(field);
      if (!validField.valid) {
        validField.err.forEach(function(error) {
          let obj = {};
          obj[key] = error;
          errors.push(obj);
        });
      }
    };

    // Validate fields
    genericValidate(macAddr, validator.validateMac, 'mac');
    if (connectionType != 'pppoe' && connectionType != 'dhcp' &&
        connectionType != '') {
      return res.status(500).json({
        success: false,
        message: 'Tipo de conexão deve ser "pppoe" ou "dhcp"',
      });
    }
    if (pppoe) {
      connectionType = 'pppoe';
      genericValidate(pppoeUser, validator.validateUser, 'pppoe_user');
      genericValidate(pppoePassword, validator.validatePassword,
                      'pppoe_password');
    } else {
      connectionType = 'dhcp';
    }
    genericValidate(ssid, validator.validateSSID, 'ssid');
    genericValidate(password, validator.validateWifiPassword, 'password');
    genericValidate(channel, validator.validateChannel, 'channel');

    DeviceModel.findById(macAddr, function(err, matchedDevice) {
      if (err) {
        return res.status(500).json({
          success: false,
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
            'pppoe_user': pppoeUser,
            'pppoe_password': pppoePassword,
            'wifi_ssid': ssid,
            'wifi_password': password,
            'wifi_channel': channel,
            'last_contact': new Date('January 1, 1970 01:00:00'),
            'do_update': false,
            'do_update_parameters': false,
          });
          if (connectionType != '') {
            newDeviceModel.connection_type = connectionType;
          }
          newDeviceModel.save(function(err) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Erro ao salvar registro',
                errors: errors,
              });
            } else {
              return res.status(200).json({'success': true});
            }
          });
        } else {
          return res.status(500).json({
            success: false,
            message: 'Erro validando os campos, ver campo \"errors\"',
            errors: errors,
          });
        }
      }
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Erro ao tratar JSON',
      errors: [],
    });
  }
};

module.exports = deviceListController;
