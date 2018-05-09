var express = require('express');
var router = express.Router();
var authController = require('../controllers/auth');
var upgradeController = require('../controllers/update_flashman');

router.route('/').post(authController.ensureLogin(),
                       upgradeController.apiUpdate);

router.route('/force').post(authController.ensureLogin(),
                            upgradeController.apiForceUpdate);

module.exports = router;
