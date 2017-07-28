
var deviceModel = require('../models/device');
var deviceListController = {};

// List all devices on a main page
deviceListController.index = function(req, res) {
  var indexContent = {apptitle: 'FlashMan'};
  console.log("Aqui");
  // deviceModel.find(function(err, devices) {
  //   if(err) {
  //     indexContent.message = err.message;
  //     console.log("Aqisasdas");
  //     return res.render('error', indexContent);
  //   }
  //   console.log("ADADDA");
  //   indexContent.devices = devices;
  //   return res.render('index', indexContent);
  // });
  return res.render('index', indexContent);
};

module.exports = deviceListController;
