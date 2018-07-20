var User = require('../models/user');
var Config = require('../models/config');
var Firmware = require('../models/firmware');

const fs = require('fs');
const imageReleasesDir = process.env.FLM_IMG_RELEASE_DIR;

var firmwareController = {};

var isValidFilename = function(filename) {
  return /^([A-Z\-0-9]+)_([A-Z\-0-9]+)_([A-Z0-9]+)_([0-9]{4}\-[a-z]{3})\.(bin)$/.test(filename);
};

var parseFilename = function(filename) {
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
      firmwares.forEach((firmware) => {
        fs.unlink('./public/firmwares/' + firmware.filename, function(err) {
          if (err) {
            return res.json({
              type: 'danger',
              message: 'Arquivo não encontrado',
            });
          }
          firmware.remove(function(err) {
            if (err) {
              return res.json({
                type: 'danger',
                message: 'Registro não encontrado',
              });
            }
            return res.json({
              type: 'success',
              message: 'Firmware(s) deletado(s) com sucesso!',
            });
          });
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

  firmwarefile.mv('./public/firmwares/' + firmwarefile.name,
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

module.exports = firmwareController;
