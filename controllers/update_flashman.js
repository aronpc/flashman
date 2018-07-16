const exec = require('child_process').exec;
let Config = require('../models/config');
let updateController = {};

let updateFlashman = function(automatic, res) {
};

updateController.update = function () {
  Config.findOne({is_default: true}, function(err, matchedConfig) {
    if (!err && matchedConfig) {
      updateFlashman(matchedConfig.autoUpdate, null);
    }
  });
};

updateController.checkUpdate = function() {
  updateFlashman(false, null);
};

updateController.apiUpdate = function(req, res) {
  Config.findOne({is_default: true}, function(err, matchedConfig) {
    if (!err && matchedConfig && matchedConfig.hasUpdate) {
      return res.status(200).json({hasUpdate: true, updated: false});
    }
    else {
      updateFlashman(false, res);
    }
  });
};

updateController.apiForceUpdate = function(req, res) {
  updateFlashman(true, res);
};

updateController.getAutoConfig = function(req, res) {
  Config.findOne({is_default: true}, function(err, matchedConfig) {
    if(!err && matchedConfig) {
      return res.status(200).json({auto: matchedConfig.autoUpdate});
    }
    else {
      return res.status(200).json({auto: null})
    }
  });
}

updateController.setAutoConfig = function(req, res) {
  Config.findOne({is_default: true}, function(err, matchedConfig) {
    if(!err && matchedConfig) {
      matchedConfig.autoUpdate = req.body.auto;
      matchedConfig.save();
      return res.status(200).json({auto: req.body.auto});
    }
    else {
      return res.status(200).json({auto: null})
    }
  });
}

module.exports = updateController;
