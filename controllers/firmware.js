let User = require('../models/user');
let Config = require('../models/config');
let Firmware = require('../models/firmware');

const fs = require('fs');
const unzip = require('unzip');
const request = require('request');
const imageReleasesDir = process.env.FLM_IMG_RELEASE_DIR;

let firmwareController = {};

let isValidFilename = function(filename) {
  return /^([A-Z\-0-9]+)_([A-Z\-0-9]+)_([A-Z0-9]+)_([0-9]{4}\-[a-z]{3})\.(bin)$/.test(filename);
};

let parseFilename = function(filename) {
  // File name pattern is VENDOR_MODEL_MODELVERSION_RELEASE.bin
  let fnameSubStrings = filename.split('_');
  let releaseSubStringRaw = fnameSubStrings[fnameSubStrings.length - 1];
  let releaseSubStringsRaw = releaseSubStringRaw.split('.');
  let firmwareRelease = releaseSubStringsRaw[0];

  let firmwareFields = {release: firmwareRelease,
                        vendor: fnameSubStrings[0],
                        model: fnameSubStrings[1],
                        version: fnameSubStrings[2]};
  return firmwareFields;
};

let removeFirmware = function(firmware) {
  return new Promise((resolve, reject)=> {
    fs.unlink(imageReleasesDir + firmware.filename, function(err) {
      if (err) {
        return reject('Arquivo não encontrado');
      }
      firmware.remove(function(err) {
        if (err) {
          return reject('Registro não encontrado');
        }
        return resolve();
      });
    });
  });
};

firmwareController.firmwares = function(req, res) {
  let reqPage = 1;
  let indexContent = {};
  indexContent.username = req.user.name;
  User.findOne({name: req.user.name}, function(err, user) {
    if (err || !user) {
      indexContent.superuser = false;
    } else {
      indexContent.superuser = user.is_superuser;
    }

    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (err || !matchedConfig) {
        indexContent.update = false;
      } else {
        indexContent.update = matchedConfig.hasUpdate;
      }

      if (req.query.page) {
        reqPage = req.query.page;
      }

      Firmware.paginate({}, {page: reqPage,
                             limit: 10,
                             sort: {_id: 1}}, function(err, firmwares) {
        if (err) {
          indexContent.type = 'danger';
          indexContent.message = err.message;
          return res.render('error', indexContent);
        }
        indexContent.firmwares = firmwares.docs;
        indexContent.page = firmwares.page;
        indexContent.pages = firmwares.pages;

        return res.render('firmware', indexContent);
      });
    });
  });
};

firmwareController.delFirmware = function(req, res) {
  if (req.user.is_superuser) {
    Firmware.find({'_id': {$in: req.body.ids}}, function(err, firmwares) {
      if (err || firmwares.length == 0) {
        return res.json({
          type: 'danger',
          message: 'Registro não encontrado ou selecionado',
        });
      }
      let promises = [];
      firmwares.forEach((firmware) => {
        promises.push(removeFirmware(firmware));
      });
      Promise.all(promises).then(
        function() {
          return res.json({
            type: 'success',
            message: 'Firmware(s) deletado(s) com sucesso!',
          });
        }, function(errMessage) {
          return res.json({
            type: 'danger',
            message: errMessage,
          });
      });
    });
  } else {
    return res.status(403).json({message: 'Permissão negada'});
  }
};

firmwareController.uploadFirmware = function(req, res) {
  if (!req.files) {
    return res.json({type: 'danger', message: 'Nenhum arquivo foi selecionado'});
  }

  let firmwarefile = req.files.firmwarefile;

  if (!isValidFilename(firmwarefile.name)) {
    return res.json({type: 'danger', message: 'Formato inválido de arquivo. ' +
      'Nomes de arquivo válidos: *FABRICANTE*_*MODELO*_*VERSÃO*_*RELEASE*.bin'});
  }

  firmwarefile.mv(imageReleasesDir + firmwarefile.name,
    function(err) {
      if (err) {
        return res.json({type: 'danger', message: 'Erro ao mover arquivo'});
      }

      let fnameFields = parseFilename(firmwarefile.name);

      Firmware.findOne({
        vendor: fnameFields.vendor,
        model: fnameFields.model,
        version: fnameFields.version,
        release: fnameFields.release,
        filename: firmwarefile.name,
      }, function(err, firmware) {
        if (err) {
          return res.json({
            type: 'danger',
            message: 'Erro buscar na base de dados',
          });
        }
        if (!firmware) {
          firmware = new Firmware({
            vendor: fnameFields.vendor,
            model: fnameFields.model,
            version: fnameFields.version,
            release: fnameFields.release,
            filename: firmwarefile.name,
          });
        } else {
          firmware.vendor = fnameFields.vendor;
          firmware.model = fnameFields.model;
          firmware.version = fnameFields.version;
          firmware.release = fnameFields.release;
          firmware.filename = firmwarefile.name;
        }

        firmware.save(function(err) {
          if (err) {
            let msg = '';
            for (let field = 0; field < err.errors.length; field++) {
              msg += err.errors[field].message + ' ';
            }
            return res.json({type: 'danger', message: msg});
          }

          return res.json({type: 'success',
                           message: 'Upload de firmware feito com sucesso!'});
        });
      });
    }
  );
};

firmwareController.syncRemoteFirmwareFiles = function(req, res) {
  request({
      url: 'https://controle.anlix.io/api/user',
      method: 'GET',
      auth: {
        user: req.body.name,
        pass: req.body.password,
      },
    },
    function(error, response, body) {
      if (error) {
        return res.json({type: 'danger', message: 'Erro na requisição'});
      }
      if (response.statusCode === 200) {
        let company = JSON.parse(body)['o'];
        request({
            url: 'https://artifactory.anlix.io/' +
                 'artifactory/api/storage/upgrades/' + company,
            method: 'GET',
            auth: {
              user: req.body.name,
              pass: req.body.password,
            },
          },
          function(error, response, body) {
            if (error) {
              return res.json({type: 'danger', message: 'Erro na requisição'});
            }
            if (response.statusCode === 200) {
              let firmwareNames = [];
              let firmwareList = JSON.parse(body)['children'];
              firmwareList.forEach((firmwareEntry) => {
                let fileName = firmwareEntry.uri;
                let fileNameParts = fileName.split('_');
                let firmwareInfoObj = {
                  company: company,
                  vendor: fileNameParts[0].split('/')[1],
                  model: fileNameParts[1],
                  version: fileNameParts[2],
                  release: fileNameParts[3].split('.')[0],
                  uri: fileName,
                };
                firmwareNames.push(firmwareInfoObj);
              });
              let encodedAuth = new Buffer(
                req.body.name + ':' + req.body.password).toString('base64');

              return res.json({type: 'success',
                firmwarelist: firmwareNames,
                encoded: encodedAuth,
              });
            } else {
              return res.json({
                type: 'danger',
                message: 'Erro na autenticação',
              });
            }
          }
        );
      } else {
        return res.json({type: 'danger', message: 'Erro na autenticação'});
      }
    }
  );
};

firmwareController.addRemoteFirmwareFile = function(req, res) {
  let responseStream = request
    .get('https://artifactory.anlix.io/artifactory/upgrades/' +
      req.body.company + req.body.firmwarefile, {
        headers: {
          'Authorization': 'Basic ' + req.body.encoded,
        },
      })
    .on('error', function(err) {
      return res.json({type: 'danger', message: 'Erro na requisição'});
    })
    .on('response', function(response) {
      let unzipDest = new unzip.Extract({path: 'public/firmwares'});
      if (response.statusCode === 200) {
        responseStream.pipe(unzipDest);
        unzipDest.on('close', function() {
          let firmwarefname = req.body.firmwarefile
            .replace('/', '')
            .replace('.zip', '.bin');
          let fnameFields = parseFilename(firmwarefname);

          Firmware.findOne({
            vendor: fnameFields.vendor,
            model: fnameFields.model,
            version: fnameFields.version,
            release: fnameFields.release,
            filename: firmwarefname,
          }, function(err, firmware) {
            if (err) {
              return res.json({
                type: 'danger',
                message: 'Erro buscar na base de dados',
              });
            }
            if (!firmware) {
              firmware = new Firmware({
                vendor: fnameFields.vendor,
                model: fnameFields.model,
                version: fnameFields.version,
                release: fnameFields.release,
                filename: firmwarefname,
              });
            } else {
              firmware.vendor = fnameFields.vendor;
              firmware.model = fnameFields.model;
              firmware.version = fnameFields.version;
              firmware.release = fnameFields.release;
              firmware.filename = firmwarefname;
            }

            firmware.save(function(err) {
              if (err) {
                let msg = '';
                for (let field = 0; field < err.errors.length; field++) {
                  msg += err.errors[field].message + ' ';
                }
                return res.json({type: 'danger', message: msg});
              }

              return res.json({
                type: 'success',
                message: 'Firmware adicionado com sucesso!',
              });
            });
          });
        });
      } else {
        return res.json({
          type: 'danger',
          message: 'Erro na autenticação',
        });
      }
    });
};

module.exports = firmwareController;
