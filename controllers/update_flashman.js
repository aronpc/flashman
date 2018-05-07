const AutoUpdater = require('auto-updater');
let Config = require('../models/config');
let updateController = {};

let updateFlashman = function(automatic) {
  let updater = new AutoUpdater({
    pathToJson: '',
    autoupdate: false,
    checkgit: false,
    jsonhost: 'raw.githubusercontent.com',
    contenthost: 'codeload.github.com',
    progressDebounce: 0,
    devmode: false
  });

  updater.on('check.up-to-date', function(v) {
    // Latest version installed, nothing to do
  });

  updater.on('check.out-dated', function(v_old, v) {
    // Old version installed, need to download update
    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (!err && matchedConfig) {
        matchedConfig.hasUpdate = true;
        matchedConfig.save();
        if (automatic) {
          updater.fire('download-update');
        }
      }
    });
  });

  updater.on('update.downloaded', function() {
    // Download ready, need to extract
    updater.fire('extract');
  });

  updater.on('update.not-installed', function() {
    // Download was ready already, need to extract
    updater.fire('extract');
  });

  updater.on('update.extracted', function() {
    // Extracting complete, reload pm2
  });

  updater.on('end', function() {
    // Everything ok
    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (!err && matchedConfig) {
        matchedConfig.hasUpdate = false;
        matchedConfig.save();
      }
    });
  });

  updater.on('error', function(name, e) {
    // Some error occured
    console.log(name, e);
  });

  // Start checking
  updater.fire('check');
}

updateController.update = function () {
  Config.findOne({is_default: true}, function(err, matchedConfig) {
    if (!err && matchedConfig) {
      updateFlashman(matchedConfig.autoUpdate);
    }
  });
};

updateController.checkUpdate = function() {
  updateFlashman(false);
}

updateController.forcedUpdate = function() {
  updateFlashman(true);
}

module.exports = updateController;
