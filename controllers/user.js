
var User = require('../models/user');

// Create endpoint /api/users for POST
exports.postUsers = function(req, res) {
    if (req.user.is_superuser) {
        var user = new User({
            name: req.body.name,
            password: req.body.password,
            is_superuser: req.body.is_superuser
        });
        user.save(function(err) {
            if (err)
                return res.json(err);
            return res.json({ message: 'User successfully created!' });
        });
    }
    else {
        return res.status(403).json(
            { message: "You don't have permission to create users" });
    }
};

// Create endpoint /api/users for GET
exports.getUsers = function(req, res) {
    if (req.user.is_superuser) {
        User.find(function(err, users) {
            if (err) {
                return res.json(err);
            }
            return res.json(users);
        });
    }
    else {
        return res.status(403).json(
            { message: "You don't have permission to see users" });
    }
};

// Create endpoint /api/users/:user_id for GET
exports.getUser = function(req, res) {
    // Use the User model to find a specific user
    User.findById(req.params.user_id, function(err, user) {
        if (err)
            return res.json(err);
        if (req.user.is_superuser) {
            return res.json(user);
        }
        else if (req.user._id.toString() === user._id.toString()) {
            // If user isn't admin and wants to see himself, remove is_superuser
            // field from json response
            normal_user = {name : user.name, lastLogin: user.lastLogin};
            return res.json(normal_user);
        }
    });
};

// Create endpoint /api/users/:user_id for PUT
exports.editUser = function(req, res) {
    // Use the User model to find a specific user
    User.findById(req.params.user_id, function(err, user) {
        if (err)
            return res.json(err);

        user.name = req.body.name;
        user.password = req.body.password;

        if (req.user.is_superuser && 'is_superuser' in req.body) {
            user.is_superuser = req.body.is_superuser;
        }
        if (req.user.is_superuser || req.user._id.toString() === user._id.toString()) {
            user.save(function(err) {
                if (err) {
                    return res.json(err);}
                else {
                    return res.json({message: "Edited successfully!"});
                }
            });
        }
        else {
            return res.status(403).json({message: "You don't have permission to do it"});
        }
    });
};

// Create endpoint /api/users/:user_id for DELETE
exports.deleteUser = function(req, res) {
  // Use the User model to find a specific user and remove it
  if (req.user.is_superuser) {
    User.findByIdAndRemove(req.params.user_id, function(err) {
        if (err)
            return res.json(err);
        return res.json({ message: 'Deleted user successfully!' });
    });
  }
  else {
      return res.status(403).json({ message: "You don't have permission!"});
  }
};
