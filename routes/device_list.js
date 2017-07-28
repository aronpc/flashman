
var express = require('express');
var router = express.Router();
var deviceListController = require('../controllers/device_list');

// GET home page
router.route('/').get(deviceListController.index);

// POST change device update status
router.route('/update/:id').post(deviceListController.changeUpdate);

module.exports = router;
