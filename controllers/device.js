
var deviceModel = require('../models/device');
var deviceController = {};

var createRegistry = function(req) {
  newDeviceModel = new deviceModel({'id': req.query.id,
                                    'model': req.query.model,
                                    'version': req.query.version,
                                    'ip': req.ip,
                                    'last_contact': Date.now(),
                                    'do_update': false,
                                  });
  newDeviceModel.save(function (err) {
    if (err) {
      return false;
    } else {
      return true;
    }
  });
};

// Create new device entry or update an existing one
deviceController.updateDevicesInfo = function(req, res) {
  deviceModel.findById(req.query.id, function(err, matchedDevice) {
    if(err) {
      console.log('Error finding device' + err);
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
        deviceModel.update({'model': req.query.model,
                            'version': req.query.version,
                            'ip': req.ip,
                            'last_contact': Date.now()
                           });
        return res.status(200).json({'do_update': matchedDevice.do_update});
      }
    }
  });
};

module.exports = deviceController;
