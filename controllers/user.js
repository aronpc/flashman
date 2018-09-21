
const User = require('../models/user');
const Role = require('../models/role');
const Config = require('../models/config');
let userController = {};

userController.changePassword = function(req, res) {
  Role.findOne({name: req.user.role}, function(err, role) {
    return res.render('changepassword',
                      {user: req.user,
                       username: req.user.name,
                       message: 'Sua senha expirou. Insira uma nova senha',
                       type: 'danger',
                       superuser: req.user.is_superuser,
                       role: role});
  });
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
  let user = new User({
    name: req.body.name,
    password: req.body.password,
    role: req.body.role,
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
};

userController.postRole = function(req, res) {
  let role = new Role({
    name: req.body.name,
    grantWifiInfo: parseInt(req.body['grant-wifi-info']),
    grantPPPoEInfo: parseInt(req.body['grant-pppoe-info']),
    grantPassShow: req.body['grant-pass-show'],
    grantFirmwareUpgrade: req.body['grant-firmware-upgrade'],
    grantWanType: req.body['grant-wan-type'],
    grantDeviceId: req.body['grant-device-id'],
    grantDeviceActions: req.body['grant-device-actions'],
    grantDeviceRemoval: req.body['grant-device-removal'],
    grantDeviceAdd: req.body['grant-device-add'],
    grantFirmwareManage: req.body['grant-firmware-manage'],
    grantAPIAccess: req.body['grant-api-access'],
  });
  role.save(function(err) {
    if (err) {
      console.log('Error creating role: ' + err);
      return res.json({
        type: 'danger',
        message: 'Erro ao criar classe. Verifique se já existe.',
      });
    }
    return res.json({
      type: 'success',
      message: 'Classe de permissões criada com sucesso!',
    });
  });
};

userController.getUsers = function(req, res) {
  User.find(function(err, users) {
    if (err) {
      return res.json({type: 'danger', message: err});
    }
    return res.json({type: 'success', users: users});
  });
};

userController.getRoles = function(req, res) {
  Role.find(function(err, roles) {
    if (err) {
      return res.json({type: 'danger', message: err});
    }
    return res.json({type: 'success', roles: roles});
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
    if (req.user.is_superuser) {
      if ('is_superuser' in req.body) {
        user.is_superuser = req.body.is_superuser;
      }
      if ('role' in req.body) {
        user.role = req.body.role;
      }
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

userController.editRole = function(req, res) {
  Role.findById(req.params.id, function(err, role) {
    if (err || !role) {
      console.log('Error editing role: ' + err);
      return res.json({
        type: 'danger',
        message: 'Erro ao encontrar classe.',
      });
    }
    role.grantWifiInfo = parseInt(req.body['grant-wifi-info']);
    role.grantPPPoEInfo = parseInt(req.body['grant-pppoe-info']);
    role.grantPassShow = req.body['grant-pass-show'];
    role.grantFirmwareUpgrade = req.body['grant-firmware-upgrade'];
    role.grantWanType = req.body['grant-wan-type'];
    role.grantDeviceId = req.body['grant-device-id'];
    role.grantDeviceActions = req.body['grant-device-actions'];
    role.grantDeviceRemoval = req.body['grant-device-removal'];
    role.grantDeviceAdd = req.body['grant-device-add'];
    role.grantFirmwareManage = req.body['grant-firmware-manage'];
    role.grantAPIAccess = req.body['grant-api-access'];

    role.save(function(err) {
      if (err) {
        console.log('Error saving role: ' + err);
        return res.json({
          type: 'danger',
          message: 'Erro ao editar classe.',
        });
      }
      return res.json({
        type: 'success',
        message: 'Classe de permissões editada com sucesso!',
      });
    });
  });
};

userController.deleteUser = function(req, res) {
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
};

userController.deleteRole = function(req, res) {
  User.count({'role': {$in: req.body.names}}, function(err, count) {
    if (count == 0) {
      Role.find({'_id': {$in: req.body.ids}}).remove(function(err) {
        if (err) {
          console.log('Role delete error: ' + err);
          return res.json({
            type: 'danger',
            message: 'Erro interno ao deletar classe(s). ' +
            'Entre em contato com o desenvolvedor',
          });
        }
        return res.json({
          type: 'success',
          message: 'Classe(s) deletada(s) com sucesso!',
        });
      });
    } else {
      return res.json({
        type: 'danger',
        message: 'Erro ao deletar classe(s). ' +
        'Uma ou mais classes ainda estão em uso por seus usuários.',
      });
    }
  });
};

userController.getProfile = function(req, res) {
  let indexContent = {};
  let queryUserId = req.user._id;

  if ('id' in req.params) {
    queryUserId = req.params.id;
  }

  User.findById(queryUserId, function(err, user) {
    Config.findOne({is_default: true}, function(err, matchedConfig) {
      if (err || !matchedConfig) {
        indexContent.update = false;
      } else {
        indexContent.update = matchedConfig.hasUpdate;
      }
      Role.findOne({name: req.user.role}, function(err, role) {
        indexContent.superuser = req.user.is_superuser;
        indexContent.username = req.user.name;
        indexContent.user = user;
        indexContent.role = role;

        // List roles only using superuser and not on profile
        if (req.user.is_superuser && queryUserId != req.user._id) {
          Role.find(function(err, roles) {
            indexContent.roles = roles;
            return res.render('profile', indexContent);
          });
        } else {
          return res.render('profile', indexContent);
        }
      });
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

      Role.find(function(err, roles) {
        indexContent.roles = roles;
        return res.render('showusers', indexContent);
      });
    });
  });
};

userController.showRoles = function(req, res) {
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

      return res.render('showroles', indexContent);
    });
  });
};

module.exports = userController;
