
// Load required packages
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var LocalStrategy = require('passport-local');
var User = require('../models/user');

passport.use(new BasicStrategy(
    function(name, password, callback) {
        User.findOne({ name: name }, function (err, user) {
            if (err) { return callback(err); }
            // No user found with that name
            if (!user) { return callback(null, false); }
            // Make sure the password is correct
            user.verifyPassword(password, function(err, isMatch) {
                if (err) { return callback(err); }
                // Password did not match
                if (!isMatch) { return callback(null, false); }
                // Success
                return callback(null, user);
            });
        });
    }
));

passport.use(new LocalStrategy(
    {usernameField:"name", passwordField:"password"},
    function(name, password, callback) {
        User.findOne({ name: name }, function (err, user) {
            if (err) { return callback({message: "Erro"}, null); }
            // No user found with that name
            if (!user) { return callback({message: "Usuário desconhecido"}, null); }
            // Make sure the password is correct
            user.verifyPassword(password, function(err, isMatch) {
                if (err) {
                    return callback({message: "Erro"}, null); }
                // Password did not match
                if (!isMatch) {
                    return callback({message: "Senha inválida"}, null); }
                // Success
                return callback(null, user);
            });
        });
    }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({_id: id}, function (err, user) {
    done(err, user);
  });
});

exports.ensureLogin = require('connect-ensure-login').ensureLoggedIn;

exports.apiAuthenticate = passport.authenticate('basic', {
        session : false
    });

exports.uiAuthenticate = function(req, res, next) {
    passport.authenticate('local', {session : true}, function(err, user) {
        if (err) {
            return res.render('login', {message: err.message, type: "danger"});
        }
        req.logIn(user, function() {
            if (err) return next('error');
            res.redirect('/devicelist');
        });
    })(req, res, next);
}
