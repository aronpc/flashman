
var express = require('express');
var router = express.Router();
var deviceInfoController = require('../controllers/device_info');

router.route('/syn').post(deviceInfoController.updateDevicesInfo);
router.route('/ack').post(deviceInfoController.confirmDeviceUpdate);

module.exports = router;
