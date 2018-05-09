var express = require('express');
var router = express.Router();
var authController = require('../controllers/auth');
var upgradeController = require('../controllers/update_flashman');

router.route('/').post(authController.ensureLogin(),
                       upgradeController.apiUpdate);

router.route('/force').post(authController.ensureLogin(),
                            upgradeController.apiForceUpdate);

router.route('/config').get(authController.ensureLogin(),
                            upgradeController.getAutoConfig)
                       .post(authController.ensureLogin(),
                             upgradeController.setAutoConfig);

module.exports = router;
