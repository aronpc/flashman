
var deviceModel = require('../models/device');
var deviceInfoController = {};

var returnObjOrEmptyStr = function(query) {
  if(typeof query !== 'undefined' && query) {
    return query;
  } else {
    return "";
  }
};

var createRegistry = function(req) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if(typeof req.body.id == 'undefined') {
    return false;
  }
  newDeviceModel = new deviceModel({'_id': req.body.id.trim().toUpperCase(),
                                    'model': returnObjOrEmptyStr(req.body.model).trim(),
                                    'version': returnObjOrEmptyStr(req.body.version).trim(),
                                    'release': returnObjOrEmptyStr(req.body.release_id).trim(),
                                    'pppoe_user': returnObjOrEmptyStr(req.body.pppoe_user).trim(),
                                    'pppoe_password': returnObjOrEmptyStr(req.body.pppoe_password).trim(),
                                    'wifi_ssid': returnObjOrEmptyStr(req.body.wifi_ssid).trim(),
                                    'wifi_password': returnObjOrEmptyStr(req.body.wifi_password).trim(),
                                    'wan_ip': returnObjOrEmptyStr(req.body.wan_ip).trim(),
                                    'ip': ip,
                                    'last_contact': Date.now(),
                                    'do_update': false,
                                  });
  newDeviceModel.save(function (err) {
    if (err) {
      console.log('Error creating device: ' + err);
      return false;
    } else {
      return true;
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
        createdStatus = createRegistry(req);
        if(createdStatus) {
          return res.status(200).json({'do_update': false,
                                       'release_id:': req.body.release_id.trim()});
        } else {
          return res.status(500);
        }
      } else {
        var storedRelease = JSON.parse(JSON.stringify(matchedDevice.release));
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        matchedDevice.model = returnObjOrEmptyStr(req.body.model).trim();
        matchedDevice.version = returnObjOrEmptyStr(req.body.version).trim();
        matchedDevice.release = returnObjOrEmptyStr(req.body.release_id).trim();
        matchedDevice.pppoe_user = returnObjOrEmptyStr(req.body.pppoe_user).trim();
        matchedDevice.pppoe_password = returnObjOrEmptyStr(req.body.pppoe_password).trim();
        matchedDevice.wifi_ssid = returnObjOrEmptyStr(req.body.wifi_ssid).trim();
        matchedDevice.wifi_password = returnObjOrEmptyStr(req.body.wifi_password).trim();
        matchedDevice.wan_ip = returnObjOrEmptyStr(req.body.wan_ip).trim();
        matchedDevice.ip = ip;
        matchedDevice.last_contact = Date.now();
        matchedDevice.save();
        return res.status(200).json({'do_update': matchedDevice.do_update,
                                     'release_id': storedRelease});
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
