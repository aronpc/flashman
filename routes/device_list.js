
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

// POST search device
router.route('/search').get(authController.ensureLogin(),
                             deviceListController.searchDeviceReg);

// REST API or POST delete device
router.route('/delete/:id').post(authController.ensureLogin(),
                                 deviceListController.delDeviceReg)
                           .delete(authController.ensureAPIAccess,
                                   deviceListController.delDeviceReg);

// REST API - GET device registry
router.route('/update/:id').get(authController.ensureAPIAccess,
                                deviceListController.getDeviceReg);
// REST API - POST or PUT change device registry
router.route('/update/:id').post(authController.ensureLogin(),
                                 deviceListController.setDeviceReg)
                           .post(authController.ensureAPIAccess,
                                 deviceListController.setDeviceReg)
                           .put(authController.ensureAPIAccess,
                                deviceListController.setDeviceReg);

// REST API - PUT create device registry
router.route('/create').post(authController.ensureLogin(),
                            deviceListController.createDeviceReg)
                       .put(authController.ensureAPIAccess,
                            deviceListController.createDeviceReg);

// REST API - GET first boot logs
router.route('/firstlog/:id').get(authController.ensureAPIAccess,
                                deviceListController.getFirstBootLog);
// REST API - GET last boot logs
router.route('/lastlog/:id').get(authController.ensureAPIAccess,
                                deviceListController.getLastBootLog);


module.exports = router;
