const express = require('express');
const router = express.Router();
const jwtHelper = require('../helpers/jwtHelper');
const main_controller = require('../controllers/userController');
const imageUpload = require('../config/multerConfig').imageUpload;

router.post('/signup', main_controller.signup);
router.post('/login', main_controller.authenticate);
router.post('/visitor/login', main_controller.authenticateVisitor);
router.post('/createModerator', jwtHelper.verifyAdminJwtToken, main_controller.createModerator);
router.post('/createExponent', jwtHelper.verifyModeratorJwtToken, main_controller.createExponent);
router.post('/participate',  main_controller.participate);
router.post('/participate/free',  main_controller.participateFreely);
router.post('/participate/paied',  main_controller.payWithCreditCard);
//router.post('/googleauth', main_controller.test);

/*router.get('/userprofile',jwtHelper.verifyJwtToken,main_controller.userProfile);
router.get('/usersList',jwtHelper.verifyAdminJwtToken,main_controller.usersList);
router.get('/reset/:email',main_controller.sendPasswordResetEmail);
router.post('/reset',jwtHelper.verifyPasswordResetJwtToken,main_controller.receiveNewPassword);
router.delete('/delete/:id',jwtHelper.verifyAdminJwtToken,main_controller.user_delete);
router.put('/updateProfile',jwtHelper.verifyJwtToken,main_controller.updateFullName);
router.put('/updatePassword',jwtHelper.verifyJwtToken,main_controller.updatePassword);
router.get('/profile/:id',jwtHelper.verifyAdminJwtToken,main_controller.admin_user_profile);*/





module.exports = router;