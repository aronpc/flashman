/**
 * Copyright (C) 2013-2017,
 * TGR - Tecnologia em Gestão de Redes S.A.
 */

var express = require('express');
var router = express.Router();
var userController = require('../controllers/user');
var authController = require('../controllers/auth');

// Requests for creating and getting users
router.route('/')
    .get(function(req, res) {
        return res.render('login');
    })
    .post(authController.uiAuthenticate);

module.exports = router;
