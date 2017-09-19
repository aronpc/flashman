
var express = require('express');
var router = express.Router();

router.use('/login', require('./login'));
router.use('/devicelist', require('./device_list'));

router.get('/', function(req, res) {
    res.redirect('/devicelist');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});

module.exports = router;
