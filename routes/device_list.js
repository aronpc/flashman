
var express = require('express');
var router = express.Router();
var deviceListController = require('../controllers/device_list');
var authController = require('../controllers/auth');

// GET home page
router.route('/').get(authController.ensureLogin(),
                      deviceListController.index);
// POST change device update status
router.route('/update/:id/:release').post(authController.ensureLogin(),
                                          deviceListController.changeUpdate);
// POST change all device status
router.route('/updateall').post(authController.ensureLogin(),
                                deviceListController.changeAllUpdates);
// REST API - GET device registry
router.route('/update/:id').get(authController.ensureAPIAccess,
                                deviceListController.getDeviceReg);
// REST API - POST change device registry
router.route('/update/:id').post(authController.ensureAPIAccess,
                                 deviceListController.setDeviceReg);

module.exports = router;
