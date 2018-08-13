
const User = require('../models/user');
const Config = require('../models/config');
let userController = {};

userController.changePassword = function(req, res) {
  return res.render('changepassword',
                    {user: req.user,
                     username: req.user.name,
                     message: 'Sua senha expirou. Insira uma nova senha',
                     type: 'danger'});
};

userController.changeElementsPerPage = function(req, res) {
  // Use the User model to find a specific user
  User.findById(req.user._id, function(err, user) {
    if (err) {
      return res.json({
        type: 'danger',
        message: 'Erro ao encontrar usuário',
      });
    }

    user.maxElementsPerPage = req.body.elementsperpage;
    user.save(function(err) {
      if (err) {
        return res.json({
          type: 'danger',
          message: 'Erro gravar alteração',
        });
      }
      return res.json({
        type: 'success',
        message: 'Alteração feita com sucesso!',
      });
    });
  });
};

userController.postUser = function(req, res) {
  if (req.user.is_superuser) {
    let user = new User({
      name: req.body.name,
      password: req.body.password,
      is_superuser: req.body.is_superuser,
    });
    user.save(function(err) {
      if (err) {
        return res.json(err);
      }
      return res.json({message: 'User successfully created!'});
    });
  } else {
    return res.status(403).json(
      {message: 'You don\'t have permission to create users'});
  }
};

userController.getUsers = function(req, res) {
  if (req.user.is_superuser) {
    User.find(function(err, users) {
      if (err) {
        return res.json(err);
      }
      return res.json(users);
    });
  } else {
    return res.status(403).json(
      {message: 'You don\'t have permission to see users'});
  }
};

userController.getUser = function(req, res) {
  // Use the User model to find a specific user
  User.findById(req.params.user_id, function(err, user) {
    if (err) {
return res.json(err);
}
    if (req.user.is_superuser) {
      return res.json(user);
    } else if (req.user._id.toString() === user._id.toString()) {
      // If user isn't admin and wants to see himself, remove is_superuser
      // field from json response
      normal_user = {name: user.name, lastLogin: user.lastLogin};
      return res.json(normal_user);
    }
  });
};

userController.editUser = function(req, res) {
  // Use the User model to find a specific user
  User.findById(req.params.id, function(err, user) {
    if (err) {
      if (req.accepts('text/html') && !req.is('application/json')) {
        return res.render(req.body.returnurl,
                          {user: req.user,
                           username: req.user.name,
                           message: err,
                           type: 'danger'});
      } else {
        // REST API response
        return res.status(500).json(err);
      }
    }

    if ('name' in req.body) {
      user.name = req.body.name;
    }
    if ('password' in req.body && 'passwordack' in req.body) {
      if (req.body.password == req.body.passwordack) {
        // Test if password is not empty nor contains only whitespaces
        if (/\S/.test(req.body.password)) {
          user.password = req.body.password;
        }
      } else {
        if (req.accepts('text/html') && !req.is('application/json')) {
          return res.render(req.body.returnurl, {
            user: req.user,
            username: req.user.name,
            message: 'As senhas estão diferentes. Digite novamente',
            type: 'danger',
          });
        } else {
          // REST API response
          return res.status(500).json({message: 'Passwords don\'t match'});
        }
      }
    }
    if (req.user.is_superuser && 'is_superuser' in req.body) {
      user.is_superuser = req.body.is_superuser;
    }

    if (req.user.is_superuser || req.user._id.toString() === user._id.toString()) {
      user.lastLogin = new Date();
      user.save(function(err) {
        if (err) {
          if (req.accepts('text/html') && !req.is('application/json')) {
            return res.render(req.body.returnurl, {
              user: req.user,
              username: req.user.name,
              message: err,
              type: 'danger',
            });
          } else {
            // REST API response
            return res.status(500).json(err);
          }
        } else {
          if (req.accepts('text/html') && !req.is('application/json')) {
            return res.redirect(req.body.redirecturl);
          } else {
            // REST API response
            return res.status(200).json({message: 'Edited successfully!'});
          }
        }
      });
    } else {
      if (req.accepts('text/html') && !req.is('application/json')) {
        return res.render(req.body.returnurl, {
          user: req.user,
          username: req.user.name,
          message: 'Permissão negada',
          type: 'danger',
        });
      } else {
        // REST API response
        return res.status(403).json({
          message: 'You don\'t have permission to do it',
        });
      }
    }
  });
};

userController.deleteUser = function(req, res) {
  // Use the User model to find a specific user and remove it
  if (req.user.is_superuser) {
    User.findByIdAndRemove(req.params.user_id, function(err) {
      if (err) {
return res.json(err);
}
      return res.json({message: 'Deleted user successfully!'});
    });
  } else {
    return res.status(403).json({message: 'You don\'t have permission!'});
  }
};

userController.getProfile = function(req, res) {
  let indexContent = {};
  User.findOne({name: req.user.name}, function(err, user) {
    if (err || !user) {
      indexContent.superuser = false;
    } else {
      indexContent.superuser = user.is_superuser;
    }

    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (err || !matchedConfig) {
        indexContent.update = false;
      } else {
        indexContent.update = matchedConfig.hasUpdate;
      }
      indexContent.username = req.user.name;
      indexContent.user = req.user;

      return res.render('profile', indexContent);
    });
  });
};

module.exports = userController;
