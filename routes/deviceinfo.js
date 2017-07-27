
var express = require('express');
var router = express.Router();
var deviceController = require('../controllers/device');

router.route('/').post(deviceController.updateDevicesInfo);

module.exports = router;
