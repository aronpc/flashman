
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
  return res.render('index', indexContent);
};

module.exports = deviceListController;
