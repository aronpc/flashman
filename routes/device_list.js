
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

module.exports = router;
