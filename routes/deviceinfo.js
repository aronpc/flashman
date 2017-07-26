
var express = require('express');
var router = express.Router();
var deviceController = require('../controllers/device');

router.route('/deviceinfo').post(deviceController.updateDevicesInfo);

module.exports = router;
