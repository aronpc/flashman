
var express = require('express');
const bodyParser = require('body-parser');

var router = express.Router();
var deviceInfoController = require('../controllers/device_info');

router.route('/syn').post(deviceInfoController.updateDevicesInfo);
router.route('/ack').post(deviceInfoController.confirmDeviceUpdate);
router.route('/logs').post(deviceInfoController.receiveLog);
router.route('/ntp').post(deviceInfoController.syncDate);
router.route('/mqtt/add').post(deviceInfoController.registerMqtt);
router.route('/app/add').post(deviceInfoController.registerApp);
router.route('/app/del').post(deviceInfoController.removeApp);
router.route('/app/addpass').post(deviceInfoController.registerPassword);
router.route('/app/set').post(deviceInfoController.appSetWifi);
router.route('/app/set/wifi').post(deviceInfoController.appSetWifi);
router.route('/app/set/password').post(deviceInfoController.appSetPassword);
router.route('/app/set/blacklist').post(deviceInfoController.appSetBlacklist);
router.route('/app/set/whitelist').post(deviceInfoController.appSetWhitelist);
router.route('/app/set/editdevice').post(deviceInfoController.appSetDeviceInfo);

module.exports = router;
