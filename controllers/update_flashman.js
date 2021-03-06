const localPackageJson = require('../package.json');
const exec = require('child_process').exec;
const fs = require('fs');
const request = require('request');
const unzip = require('unzip');
const rimraf = require('rimraf');
const ncp = require('ncp').ncp;
let Config = require('../models/config');
let updateController = {};

const versionCompare = function(foo, bar) {
  // Returns like C strcmp: 0 if equal, -1 if foo < bar, 1 if foo > bar
  let fooVer = foo.split('.').map((val) => {
   return parseInt(val);
  });
  let barVer = bar.split('.').map((val) => {
   return parseInt(val);
  });
  for (let i = 0; i < fooVer.length; i++) {
    if (fooVer[i] < barVer[i]) return -1;
    if (fooVer[i] > barVer[i]) return 1;
  }
  return 0;
};

const getRemoteVersion = function() {
  return new Promise((resolve, reject)=>{
    let jsonHost = localPackageJson.updater.jsonHost;
    let gitUser = localPackageJson.updater.githubUser;
    let gitRepo = localPackageJson.updater.githubRepo;
    let gitBranch = localPackageJson.updater.githubBranch;
    let url = 'https://' + jsonHost + '/' + gitUser + '/' + gitRepo + '/' +
              gitBranch + '/package.json';
    request.get(url, (error, resp, body)=>{
      if (error || resp.statusCode !== 200) {
        reject();
      } else {
        resolve(JSON.parse(body).version);
      }
    });
  });
};

const getLocalVersion = function() {
  return localPackageJson.version;
};

const downloadUpdate = function(version) {
  return new Promise((resolve, reject)=>{
    if (!fs.existsSync('updates')) {
      fs.mkdirSync('updates');
    }
    if (fs.existsSync('updates/' + version + '.zip')) {
      return resolve();
    }
    let contentHost = localPackageJson.updater.contentHost;
    let gitUser = localPackageJson.updater.githubUser;
    let gitRepo = localPackageJson.updater.githubRepo;
    let gitBranch = localPackageJson.updater.githubBranch;
    let url = 'https://' + contentHost + '/' + gitUser + '/' + gitRepo +
              '/zip/' + gitBranch;
    let req = request(url);
    req.on('response', (resp)=>{
      if (resp.statusCode === 200) {
        let file = fs.createWriteStream('updates/' + version + '.zip');
        req.pipe(file).on('finish', resolve);
      }
    });
    req.on('error', reject);
  });
};

const moveUpdate = function() {
  return new Promise((resolve, reject)=>{
    let gitRepo = localPackageJson.updater.githubRepo;
    let gitBranch = localPackageJson.updater.githubBranch.replace(/\//g, '-');
    let source = 'updates/' + gitRepo + '-' + gitBranch + '/';
    ncp(source, '.', (err)=>{
      (err) ? reject() : resolve();
    });
  });
};

const extractUpdate = function(version) {
  return new Promise((resolve, reject)=>{
    let filename = 'updates/' + version + '.zip';
    fs.createReadStream(filename)
    .pipe(unzip.Extract({path: 'updates/'}))
    .on('close', ()=>{
      moveUpdate().then(resolve, reject);
    });
  });
};

const updateDependencies = function() {
  return new Promise((resolve, reject)=>{
    exec('npm install --production', (err, stdout, stderr)=>{
      (err) ? reject() : resolve();
    });
  });
};

const rebootFlashman = function(version) {
  fs.chmodSync('bin/www', '755');
  fs.chmodSync('docker/wait-for-it.sh', '755');
  fs.chmodSync('scripts/cert-deploy-hook.sh', '755');
  let gitRepo = localPackageJson.updater.githubRepo;
  let gitBranch = localPackageJson.updater.githubBranch.replace(/\//g, '-');
  fs.unlinkSync('updates/' + version + '.zip');
  rimraf.sync('updates/' + gitRepo + '-' + gitBranch + '/');
  exec('pm2 reload environment.config.json', (err, stdout, stderr) => {});
};

const errorCallback = function(res) {
  if (res) {
    Config.findOne({is_default: true}, function(err, config) {
      if (!err && config) {
        res.status(200).json({hasUpdate: config.hasUpdate, updated: false});
      } else {
        res.status(500).json({});
      }
    });
  }
};

const updateFlashman = function(automatic, res) {
  getRemoteVersion().then((remoteVersion)=>{
    let localVersion = getLocalVersion();
    let needsUpdate = versionCompare(remoteVersion, localVersion) > 0;
    if (needsUpdate) {
      Config.findOne({is_default: true}, function(err, matchedConfig) {
        if (err || !matchedConfig) return errorCallback(res);
        matchedConfig.hasUpdate = true;
        matchedConfig.save();
        if (automatic) {
          downloadUpdate(remoteVersion)
          .then(()=>{
            return extractUpdate(remoteVersion);
          }, (rejectedValue)=>{
            return Promise.reject(rejectedValue);
          })
          .then(()=>{
            return updateDependencies();
          }, (rejectedValue)=>{
            return Promise.reject(rejectedValue);
          })
          .then(()=>{
            matchedConfig.hasUpdate = false;
            matchedConfig.save((err)=>{
              if (res) {
                res.status(200).json({hasUpdate: false, updated: true});
              }
              rebootFlashman(remoteVersion);
            });
          }, (rejectedValue)=>{
            errorCallback(res);
          });
        } else if (res) {
          res.status(200).json({hasUpdate: true, updated: false});
        }
      });
    } else if (res) {
      res.status(200).json({hasUpdate: false, updated: false});
    }
  }, ()=>errorCallback(res));
};

updateController.update = function() {
  if (process.env.FLM_DISABLE_AUTO_UPDATE !== 'true') {
    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (!err && matchedConfig) {
        updateFlashman(matchedConfig.autoUpdate, null);
      }
    });
  }
};

updateController.checkUpdate = function() {
  if (process.env.FLM_DISABLE_AUTO_UPDATE === 'true') {
    // Always return as updated if auto update is disabled
    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (!err && matchedConfig) {
        matchedConfig.hasUpdate = false;
        matchedConfig.save();
      }
    });
  } else {
    updateFlashman(false, null);
  }
};

updateController.apiUpdate = function(req, res) {
  if (process.env.FLM_DISABLE_AUTO_UPDATE === 'true') {
    // Always return as updated if auto update is disabled
    res.status(200).json({hasUpdate: false, updated: true});
  } else {
    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (!err && matchedConfig && matchedConfig.hasUpdate) {
        return res.status(200).json({hasUpdate: true, updated: false});
      } else {
        updateFlashman(false, res);
      }
    });
  }
};

updateController.apiForceUpdate = function(req, res) {
  if (process.env.FLM_DISABLE_AUTO_UPDATE === 'true') {
    // Always return as updated if auto update is disabled
    res.status(200).json({hasUpdate: false, updated: true});
  } else {
    updateFlashman(true, res);
  }
};

updateController.getAutoConfig = function(req, res) {
  Config.findOne({is_default: true}, function(err, matchedConfig) {
    if (!err && matchedConfig) {
      return res.status(200).json({
        auto: matchedConfig.autoUpdate,
        minlengthpasspppoe: matchedConfig.pppoePassLength,
      });
    } else {
      return res.status(200).json({
        auto: null,
        minlengthpasspppoe: 8,
      });
    }
  });
};

updateController.setAutoConfig = function(req, res) {
  console.log(req.body);
  Config.findOne({is_default: true}, function(err, matchedConfig) {
    if (!err && matchedConfig) {
      matchedConfig.autoUpdate = req.body.autoupdate == 'on' ? true : false;
      matchedConfig.pppoePassLength = parseInt(req.body['minlength-pass-pppoe']);
      matchedConfig.save(function(err) {
        if (err) {
          console.log(err);
          return res.status(500).json({
            type: 'danger',
            message: 'Erro ao editar configuração',
          });
        }
        return res.json({
          type: 'success',
          message: 'Salvo com sucesso!',
        });
      });
    } else {
      console.log(err);
      return res.status(500).json({
        type: 'danger',
        message: 'Erro ao encontrar configuração base',
      });
    }
  });
};

module.exports = updateController;
