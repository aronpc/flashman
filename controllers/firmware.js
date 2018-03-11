
var Firmware = require('../models/firmware');

const fs = require('fs');
const imageReleasesDir = process.env.FLM_IMG_RELEASE_DIR;

var firmwareController = {};

var isValidFilename = function(filename) {
  return /^([A-Z\-0-9]+)_([A-Z\-0-9]+)_([A-Z0-9]+)_([0-9]{4}\-[a-z]{3})\.(bin)$/.test(filename);
}

var parseFilename = function(filename) {  
  // File name pattern is VENDOR_MODEL_MODELVERSION_RELEASE.bin
  var fnameSubStrings = filename.split('_');
  var releaseSubStringRaw = fnameSubStrings[fnameSubStrings.length - 1];
  var releaseSubStringsRaw = releaseSubStringRaw.split('.');
  var firmwareRelease = releaseSubStringsRaw[0];
  
  var firmwareFields = {release: firmwareRelease,
                        vendor: fnameSubStrings[0],
                        model: fnameSubStrings[1],
                        version: fnameSubStrings[2]};
  return firmwareFields;
};

firmwareController.firmwares = function(req, res) {
  var reqPage = 1;
  var indexContent = {};
  indexContent.username = req.user.name;

  if(req.query.page) {
    reqPage = req.query.page;
  }

  Firmware.paginate({}, {page: reqPage,
                         limit: 10,
                         sort: {_id: 1}}, function(err, firmwares) {
    if(err) {
      indexContent.message = err.message;
      return res.render('error', indexContent);
    }
    indexContent.firmwares = firmwares.docs;
    indexContent.page = firmwares.page;
    indexContent.pages = firmwares.pages;

    return res.render('firmware', indexContent);
  });
};

firmwareController.delFirmware = function(req, res) {
  if (req.user.is_superuser) {
    
    Firmware.find({'_id': {$in: req.body.ids}}, function(err, firmwares) {
      firmwares.forEach(firmware => {
        fs.unlink('./public/firmwares/' + firmware.filename, function(err) {
          if (err) {
            return res.json({
              type: 'danger',
              message: 'Arquivo não encontrado'
            });
          }
          firmware.remove(function(err) {
            if (err) {
              return res.json({
                type: 'danger',
                message: 'Registro não encontrado'
              });
            }
            return res.json({
              type: 'success',
              message: 'Deleted firmware model(s) successfully!'
            });     
          });
        });
      });
    });
  }
  else {
    return res.status(403).json({ message: "Permissão negada"});
  }
};

firmwareController.uploadFirmware = function(req, res) {
  if (!req.files) {
    return res.json({type:'danger', message: 'Nenhum arquivo foi selecionado'});
  }
   
  let firmwarefile = req.files.firmwarefile;
   
  if (!isValidFilename(firmwarefile.name)) {
    return res.json({type:'danger', message: 'Formato inválido de arquivo. ' +
      'Nomes de arquivo válidos: *FABRICANTE*_*MODELO*_*VERSÃO*_*RELEASE*.bin'});
  }

  firmwarefile.mv('./public/firmwares/' + firmwarefile.name,
    function(err) {
      if (err) {
        return res.json({type:'danger', message: 'Erro ao mover arquivo'});
      }

      var fnameFields = parseFilename(firmwarefile.name);

      var firmware = new Firmware({
        vendor: fnameFields.vendor,
        model: fnameFields.model,
        version: fnameFields.version,
        release: fnameFields.release,
        filename: firmwarefile.name 
      });
      firmware.save(function(err) {
        if (err) {
          var msg = ""
          for (field in err.errors) {
            msg += err.errors[field].message + " ";
          }
          return res.json({type: 'danger', message: msg});
        }

        return res.json({type: 'success',
                         message: 'Upload de firmware feito com sucesso!'});
      });
    }
  );
};

module.exports = firmwareController;
