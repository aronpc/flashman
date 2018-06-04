
var express = require('express');
var router = express.Router();
var deviceInfoController = require('../controllers/device_info');

router.route('/syn').post(deviceInfoController.updateDevicesInfo);
router.route('/ack').post(deviceInfoController.confirmDeviceUpdate);
router.route('/mqtt/add').post(deviceInfoController.registerMqtt);
router.route('/app/add').post(deviceInfoController.registerApp);
router.route('/app/del').post(deviceInfoController.removeApp);
router.route('/app/set').post(deviceInfoController.appSet);

module.exports = router;
