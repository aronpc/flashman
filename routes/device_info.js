
var express = require('express');
var router = express.Router();
var deviceInfoController = require('../controllers/device_info');

router.route('/').post(deviceInfoController.updateDevicesInfo);

module.exports = router;
