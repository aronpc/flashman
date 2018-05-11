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
    console.log("up to date");
    if (res) {
      res.status(200).json({hasUpdate: false, updated: false});
    }
  });

  updater.on('check.out-dated', function(v_old, v) {
    // Old version installed, need to download update
    console.log("out dated");
    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (!err && matchedConfig) {
        matchedConfig.hasUpdate = true;
        matchedConfig.save();
        if (automatic) {
          updater.fire('download-update');
        }
        else if (res) {
          res.status(200).json({hasUpdate: true, updated: false});
        }
      }
    });
  });

  updater.on('update.downloaded', function() {
    // Download ready, need to extract
    console.log("downloaded");
    updater.fire('extract');
  });

  updater.on('update.not-installed', function() {
    // Download was ready already, need to extract
    console.log("already downloaded");
    updater.fire('extract');
  });

  updater.on('update.extracted', function() {
    // Extracting complete, reload pm2
    console.log("extracted");
    exec("npm install --production", function (err, stdout, stderr) {
      exec("pm2 reload environment.config.json", (err, stdout, stderr) => {});
      if (res) {
        res.status(200).json({hasUpdate: false, updated: true});
      }
    });
  });

  updater.on('end', function() {
    // Everything ok
    console.log("end");
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
