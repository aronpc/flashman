
var express = require('express');
var router = express.Router();

router.use('/devicelist', require('./device_list'));

router.get('/', function(req, res) {
    res.redirect('/devicelist');
});

module.exports = router;
