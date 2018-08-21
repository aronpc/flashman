
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

router.route('/profile/:id').get(authController.ensureLogin(),
                                 userController.getProfile);

router.route('/showall').get(authController.ensureLogin(),
                             userController.showAll);

router.route('/roles').get(authController.ensureLogin(),
                           userController.showRoles);

//
// REST API
//
router.route('/edit/:id').post(authController.ensureLogin(),
                               userController.editUser)
                         .put(authController.ensureAPIAccess,
                              userController.editUser);

router.route('/get/all').get(authController.ensureLogin(),
                              userController.getUsers)
                        .get(authController.ensureAPIAccess,
                             userController.getUsers);

router.route('/new').post(authController.ensureLogin(),
                          userController.postUser)
                    .put(authController.ensureAPIAccess,
                         userController.postUser);

router.route('/del').post(authController.ensureLogin(),
                          userController.deleteUser)
                    .put(authController.ensureAPIAccess,
                         userController.deleteUser);

router.route('/role/get/all').get(authController.ensureLogin(),
                                  userController.getRoles)
                             .get(authController.ensureAPIAccess,
                                  userController.getRoles);

router.route('/role/new').post(authController.ensureLogin(),
                               userController.postRole)
                         .put(authController.ensureAPIAccess,
                              userController.postRole);

router.route('/role/edit/:id').post(authController.ensureLogin(),
                                    userController.editRole)
                              .put(authController.ensureAPIAccess,
                                   userController.editRole);

router.route('/role/del').post(authController.ensureLogin(),
                               userController.deleteRole)
                         .put(authController.ensureAPIAccess,
                              userController.deleteRole);

module.exports = router;
