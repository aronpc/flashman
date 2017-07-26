
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

deviceController.findDevices = function(req, res) {
    deviceModel.findOne({'id': req.query.id}, function(err, matchedDevice) {
        if(err) {
            console.log('No device found. Creating registry...');
            createdStatus = createRegistry(req);
            if(createdStatus) {
                res.status(200).json({'do_update': false});
            } else {
                res.status(500);
            }
        } else {
            console.log(matchedDevice);
            deviceModel.update({'model': req.query.model,
                                'version': req.query.version,
                                'ip': req.ip,
                                'last_contact': Date.now()
                               });
            res.status(200).json({'do_update': matchedDevice.do_update});
        }
    });
};

module.exports = deviceController;
