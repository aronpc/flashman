
var express = require('express');
var router = express.Router();
var firmwareController = require('../controllers/firmware');
var authController = require('../controllers/auth');

router.route('/').get(authController.ensureLogin(),
                      firmwareController.firmwares);

router.route('/del').post(authController.ensureLogin(),
                          firmwareController.delFirmware)

router.route('/upload').post(authController.ensureLogin(),
                             firmwareController.uploadFirmware)

module.exports = router;