
const express = require('express');
const authController = require('../controllers/auth');
const upgradeController = require('../controllers/update_flashman');

let router = express.Router();

router.route('/').post(authController.ensureLogin(),
                       authController.ensurePermission('superuser'),
                       upgradeController.apiUpdate);

router.route('/force').post(authController.ensureLogin(),
                            authController.ensurePermission('superuser'),
                            upgradeController.apiForceUpdate);

router.route('/config').get(authController.ensureLogin(),
                            authController.ensurePermission('superuser'),
                            upgradeController.getAutoConfig)
                       .post(authController.ensureLogin(),
                             authController.ensurePermission('superuser'),
                             upgradeController.setAutoConfig);

module.exports = router;
