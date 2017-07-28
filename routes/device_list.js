
var express = require('express');
var router = express.Router();
var deviceListController = require('../controllers/device_list');

/* GET home page. */
router.route('/').get(deviceListController.index);

module.exports = router;
