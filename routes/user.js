
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
                             authController.ensurePermission('grantAPIAccess'),
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
                             authController.ensurePermission('grantAPIAccess'),
                             userController.getUsers)
                        .get(authController.ensureAPIAccess,
                             authController.ensurePermission('grantAPIAccess'),
                             userController.getUsers);

router.route('/new').post(authController.ensureLogin(),
                          authController.ensurePermission('grantAPIAccess'),
                          userController.postUser)
                    .put(authController.ensureAPIAccess,
                         authController.ensurePermission('grantAPIAccess'),
                         userController.postUser);

router.route('/del').post(authController.ensureLogin(),
                          authController.ensurePermission('grantAPIAccess'),
                          userController.deleteUser)
                    .put(authController.ensureAPIAccess,
                         authController.ensurePermission('grantAPIAccess'),
                         userController.deleteUser);

router.route('/role/get/all').get(authController.ensureLogin(),
                                  userController.getRoles)
                             .get(authController.ensureAPIAccess,
                                  userController.getRoles);

router.route('/role/new').post(authController.ensureLogin(),
                               authController.ensurePermission('grantAPIAccess'),
                               userController.postRole)
                         .put(authController.ensureAPIAccess,
                              authController.ensurePermission('grantAPIAccess'),
                              userController.postRole);

router.route('/role/edit/:id').post(
  authController.ensureLogin(),
  authController.ensurePermission('grantAPIAccess'),
  userController.editRole)
                              .put(
  authController.ensureAPIAccess,
  authController.ensurePermission('grantAPIAccess'),
  userController.editRole);

router.route('/role/del').post(authController.ensureLogin(),
                               authController.ensurePermission('grantAPIAccess'),
                               userController.deleteRole)
                         .put(authController.ensureAPIAccess,
                              authController.ensurePermission('grantAPIAccess'),
                              userController.deleteRole);

module.exports = router;
