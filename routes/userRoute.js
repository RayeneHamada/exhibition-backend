const express = require('express');
const router = express.Router();
const jwtHelper = require('../helpers/jwtHelper');
const main_controller = require('../controllers/userController');

router.post('/signup', main_controller.signup);
router.post('/login', main_controller.authenticate);
router.post('/refreshToken', main_controller.refreshToken);
router.post('/visitor/login', main_controller.authenticateVisitor);
router.post('/createModerator', jwtHelper.verifyAdminJwtToken, main_controller.createModerator);
router.post('/createExponent', jwtHelper.verifyModeratorJwtToken, main_controller.createExponent);
router.post('/participate',  main_controller.participate);
router.post('/participate/free',  main_controller.participateFreely);
router.post('/participate/paied',  main_controller.payWithCreditCard);
router.post('/requestPasswordReset',  main_controller.requestPasswordReset);
router.post('/resetPassword',jwtHelper.verifyPasswordResetJwtToken,main_controller.resetPassword);

module.exports = router;