const AutoUpdater = require('auto-updater');
const exec = require('child_process').exec;
let Config = require('../models/config');
let updateController = {};

let updateFlashman = function(automatic, res) {
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
    // if (res) {
    //   res.status(200).json({hasUpdate: false, updated: false});
    // }
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
        // else if (res) {
        //   res.status(200).json({hasUpdate: true, updated: false});
        // }
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
    exec("pm2 stop flashman", (err, stdout, stderr) => {});
    exec("npm intall --production", (err, stdout, stderr) => {});
    exec("pm2 start flashman", (err, stdout, stderr) => {});
  });

  updater.on('end', function() {
    // Everything ok
    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (!err && matchedConfig) {
        matchedConfig.hasUpdate = false;
        matchedConfig.save();
      }
    });
    // if (res) {
    //   res.status(200).json({hasUpdate: false, updated: true});
    // }
  });

  updater.on('error', function(name, e) {
    // Some error occured
    console.log(name, e);
    if (res) {
      Config.findOne({is_default: true}, function(err, matchedConfig) {
        if (!err && matchedConfig) {
          res.status(200).json({hasUpdate: matchedConfig.hasUpdate, updated: false});
        }
        else {
          res.status(500).json({});
        }
      });
    }
  });

  // Start checking
  updater.fire('check');
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

module.exports = updateController;
