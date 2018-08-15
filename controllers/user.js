
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
      is_superuser: false,
    });
    user.save(function(err) {
      if (err) {
        console.log('Error creating user: ' + err);
        return res.json({
          type: 'danger',
          message: 'Erro ao criar usuário. Verifique se o usuário já existe.',
        });
      }
      return res.json({
        type: 'success',
        message: 'Usuário criado com sucesso!',
      });
    });
  } else {
    return res.status(403).json({
      type: 'danger',
      message: 'Permissão negada',
    });
  }
};

userController.getUsers = function(req, res) {
  if (req.user.is_superuser) {
    User.find(function(err, users) {
      if (err) {
        return res.json({type: 'danger', message: err});
      }
      return res.json({type: 'success', users: users});
    });
  } else {
    return res.status(403).json(
      {type: 'danger', message: 'Permissão negada'});
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
      return res.json({name: user.name, lastLogin: user.lastLogin});
    }
  });
};

userController.editUser = function(req, res) {
  // Use the User model to find a specific user
  User.findById(req.params.id, function(err, user) {
    if (err) {
      console.log('Error finding user: ' + err);
      return res.status(500).json({
        type: 'danger',
        message: 'Erro ao encontrar usuário',
      });
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
        return res.status(500).json({
          type: 'danger',
          message: 'As senhas estão diferentes',
        });
      }
    }
    if (req.user.is_superuser && 'is_superuser' in req.body) {
      user.is_superuser = req.body.is_superuser;
    }

    if (req.user.is_superuser || req.user._id.toString() === user._id.toString()) {
      user.lastLogin = new Date();
      user.save(function(err) {
        if (err) {
          console.log('Error saving user entry: ' + err);
          return res.status(500).json({
            type: 'danger',
            message: 'Erro ao salvar alterações',
          });
        } else {
          return res.json({
            type: 'success',
            message: 'Editado com sucesso!',
          });
        }
      });
    } else {
      return res.status(403).json({
        type: 'danger',
        message: 'Permissão negada',
      });
    }
  });
};

userController.deleteUser = function(req, res) {
  // Use the User model to find a specific user and remove it
  if (req.user.is_superuser) {
    User.find({'_id': {$in: req.body.ids}}).remove(function(err) {
      if (err) {
        console.log('User delete error: ' + err);
        return res.json({
          type: 'danger',
          message: 'Erro interno ao deletar usuário(s). ' +
          'Entre em contato com o desenvolvedor',
        });
      }
      return res.json({
        type: 'success',
        message: 'Usuário(s) deletado(s) com sucesso!',
      });
    });
  } else {
    return res.status(403).json({
      type: 'danger',
      message: 'Permissão negada',
    });
  }
};

userController.getProfile = function(req, res) {
  let indexContent = {};
  let queryUserId = req.user._id;

  if ('id' in req.params) {
    queryUserId = req.params.id;
  }

  User.findById(queryUserId, function(err, user) {
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
      indexContent.user = user;

      return res.render('profile', indexContent);
    });
  });
};

userController.showAll = function(req, res) {
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

      return res.render('showusers', indexContent);
    });
  });
};

module.exports = userController;
