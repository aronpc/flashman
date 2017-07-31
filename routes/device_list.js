
var express = require('express');
var router = express.Router();
var deviceListController = require('../controllers/device_list');

// GET home page
router.route('/').get(deviceListController.index);

// POST change device update status
router.route('/update/:id').post(deviceListController.changeUpdate);
// POST change all device status
router.route('/updateall').post(deviceListController.changeAllUpdates);

module.exports = router;
