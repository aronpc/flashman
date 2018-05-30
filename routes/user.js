
var express = require('express');
var router = express.Router();
var userController = require('../controllers/user');
var authController = require('../controllers/auth');

// GET change password page
router.route('/changepassword').get(authController.ensureLogin(),
                                    userController.changePassword);

// POST change number of elements per page on table
router.route('/elementsperpage').post(authController.ensureLogin(),
                                      userController.changeElementsPerPage);

// POST or PUT user edit. Browser and API handler
router.route('/edit/:id').post(authController.ensureLogin(),
                               userController.editUser)
						 .put(authController.ensureAPIAccess,
                              userController.editUser);

module.exports = router;
