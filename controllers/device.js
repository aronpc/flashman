
var deviceModel = require('../models/device');
var deviceController = {};

var createRegistry = function(req) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  newDeviceModel = new deviceModel({'_id': req.body.id,
                                    'model': req.body.model,
                                    'version': req.body.version,
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
deviceController.updateDevicesInfo = function(req, res) {
  deviceModel.findById(req.body.id, function(err, matchedDevice) {
    if(err) {
      console.log('Error finding device: ' + err);
      return res.status(500);
    } else {
      if(matchedDevice == null){
        createdStatus = createRegistry(req);
        if(createdStatus) {
          return res.status(200).json({'do_update': false});
        } else {
          return res.status(500);
        }
      } else {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        matchedDevice.model = req.body.model;
        matchedDevice.version = req.body.version;
        matchedDevice.ip = ip;
        matchedDevice.last_contact = Date.now();
        matchedDevice.save();
        return res.status(200).json({'do_update': matchedDevice.do_update});
      }
    }
  });
};

module.exports = deviceController;
