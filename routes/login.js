
const express = require('express');
const authController = require('../controllers/auth');

let router = express.Router();

// Requests for creating and getting users
router.route('/')
    .get(function(req, res) {
        return res.render('login');
    })
    .post(authController.uiAuthenticate);

module.exports = router;
