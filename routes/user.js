
const express = require('express');
const userController = require('../controllers/user');
const authController = require('../controllers/auth');

let router = express.Router();

// GET change password page
router.route('/changepassword').get(authController.ensureLogin(),
                                    userController.changePassword);

// POST change number of elements per page on table
router.route('/elementsperpage').post(authController.ensureLogin(),
                                      userController.changeElementsPerPage);

router.route('/profile').get(authController.ensureLogin(),
                             userController.getProfile);

// POST or PUT user edit. Browser and API handler
router.route('/edit/:id').post(authController.ensureLogin(),
                               userController.editUser)
                         .put(authController.ensureAPIAccess,
                              userController.editUser);

module.exports = router;
