
var deviceModel = require('../models/device');
var deviceListController = {};

// List all devices on a main page
deviceListController.index = function(req, res) {
  var indexContent = {apptitle: 'FlashMan'};
  deviceModel.find(function(err, devices) {
    if(err) {
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    indexContent.devices = devices;
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
    matchedDevice.save();
    return res.status(200).json({'success': true});
  });
};

deviceListController.changeAllUpdates = function(req, res) {
  deviceModel.find({'_id': {'$in': req.body.ids}},
  function(err, matchedDevices) {
    if(err) {
      var indexContent = {apptitle: 'FlashMan'};
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    for(var idx in matchedDevices) {
      matchedDevices[idx].do_update = req.body.do_update;
      matchedDevices[idx].save();
    }
    return res.status(200).json({'success': true});
  });
};

module.exports = deviceListController;
