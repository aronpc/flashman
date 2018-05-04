const AutoUpdater = require('auto-updater');
var updateController = {};

updateController.updateFlashman = function () {
  var updater = new AutoUpdater({
    pathToJson: '',
    autoupdate: false,
    checkgit: false,
    jsonhost: 'raw.githubusercontent.com',
    contenthost: 'codeload.github.com',
    progressDebounce: 0,
    devmode: false
  });

  updater.on('git-clone', function() {
    console.log("You have a clone of the repository. Use 'git pull' to be up-to-date");
  });
  updater.on('check.up-to-date', function(v) {
    console.log("You have the latest version: " + v);
  });
  updater.on('check.out-dated', function(v_old, v) {
    console.log("Your version is outdated. " + v_old + " of " + v);
    updater.fire('download-update');
  });
  updater.on('update.downloaded', function() {
    console.log("Update downloaded and ready for install");
    updater.fire('extract');
  });
  updater.on('update.not-installed', function() {
    console.log("The Update was already in your folder! It's read for install");
    updater.fire('extract');
  });
  updater.on('update.extracted', function() {
    console.log("Update extracted successfully!");
    console.log("RESTART THE APP!");
  });
  updater.on('end', function() {
    console.log("The app is ready to function");
  });
  updater.on('error', function(name, e) {
    console.log(name, e);
  });

  // Start checking
  updater.fire('check');
};

module.exports = updateController;
