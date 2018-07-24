
const express = require('express');
const firmwareController = require('../controllers/firmware');
const authController = require('../controllers/auth');

let router = express.Router();

router.route('/').get(authController.ensureLogin(),
                      firmwareController.firmwares);

router.route('/del').post(authController.ensureLogin(),
                          firmwareController.delFirmware);

router.route('/upload').post(authController.ensureLogin(),
                             firmwareController.uploadFirmware);

module.exports = router;
