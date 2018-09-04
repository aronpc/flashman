
// Load required packages
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const LocalStrategy = require('passport-local');
const User = require('../models/user');
const Role = require('../models/role');

passport.use(new BasicStrategy(
  function(name, password, callback) {
    User.findOne({name: name}, function(err, user) {
      if (err) {
        return callback(err);
      }
      // No user found with that name
      if (!user) {
        return callback(null, false);
      }
      // Make sure the password is correct
      user.verifyPassword(password, function(err, isMatch) {
        if (err) {
          return callback(err);
        }
        // Password did not match
        if (!isMatch) {
          return callback(null, false);
        }
        // Success
        return callback(null, user);
      });
    });
  }
));

passport.use(new LocalStrategy(
  {usernameField: 'name', passwordField: 'password'},
  function(name, password, callback) {
    User.findOne({name: name}, function(err, user) {
      if (err) {
        return callback({message: 'Erro'}, null);
      }
      // No user found with that name
      if (!user) {
        return callback({message: 'Usuário desconhecido'}, null);
      }
      // Make sure the password is correct
      user.verifyPassword(password, function(err, isMatch) {
        if (err) {
          return callback({message: 'Erro'}, null);
        }
        // Password did not match
        if (!isMatch) {
          return callback({message: 'Senha inválida'}, null);
        }
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
  User.findOne({_id: id}, function(err, user) {
    done(err, user);
  });
});

exports.uiAuthenticate = function(req, res, next) {
  passport.authenticate('local', {session: true}, function(err, user) {
    if (err) {
      return res.render('login', {message: err.message, type: 'danger'});
    }
    if (!user) {
      return res.render('login', {
        message: 'Usuário não encontrado',
        type: 'danger',
      });
    }

    req.logIn(user, function() {
      if (err) {
        return res.render('login', {message: err.message, type: 'danger'});
      }
      // First login
      if (user.lastLogin == null) {
        return res.redirect('/user/changepassword');
      }

      user.lastLogin = new Date();
      user.save();

      res.redirect('/devicelist');
    });
  })(req, res, next);
};

exports.ensureLogin = require('connect-ensure-login').ensureLoggedIn;

exports.ensureAPIAccess = passport.authenticate('basic', {
  session: false,
});

exports.ensurePermission = function(permission) {
  return function(req, res, next) {
    if (req.user && req.user.is_superuser) {
      next();
    } else if (req.user && req.user.role && permission != 'superuser') {
      Role.findOne({name: req.user.role}, function(err, role) {
        if (err) {
          console.log(err);
          if (req.accepts('text/html') && !req.is('application/json')) {
            res.status(403).render('login', {
              message: 'Permissão negada',
              type: 'danger',
            });
          } else {
            res.status(403).json({
              message: 'Permissão negada',
              type: 'danger',
            });
          }
        }
        if (role[permission] == true || role[permission] >= 1) {
          next();
        } else {
          if (req.accepts('text/html') && !req.is('application/json')) {
            res.status(403).render('login', {
              message: 'Permissão negada',
              type: 'danger',
            });
          } else {
            res.status(403).json({
              message: 'Permissão negada',
              type: 'danger',
            });
          }
        }
      });
    } else {
      if (req.accepts('text/html') && !req.is('application/json')) {
        res.status(403).render('login', {
          message: 'Permissão negada',
          type: 'danger',
        });
      } else {
        res.status(403).json({
          message: 'Permissão negada',
          type: 'danger',
        });
      }
    }
  };
};
