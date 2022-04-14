const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const { pdfUpload } = require('../config/multerConfig');
const main_controller = require('../controllers/standController');
const imageUpload = require('../config/multerConfig').imageUpload;


router.post('/updateLogo',[imageUpload.single('image'),jwtHelper.verifyExponentJwtToken], main_controller.updateLogo);
router.post('/updatePDF',[pdfUpload.single('pdf'),jwtHelper.verifyExponentJwtToken], main_controller.updatePDF);
router.post('/updateFurnitureColor',jwtHelper.verifyExponentJwtToken, main_controller.updateFurnitureColor);
router.post('/updateBackgroundColor',jwtHelper.verifyExponentJwtToken, main_controller.updateBackgroundColor);
router.post('/updateTvMedia',jwtHelper.verifyExponentJwtToken, main_controller.updateTvMedia);
router.post('/updateMeetLink', jwtHelper.verifyExponentJwtToken, main_controller.updateMeetLink);
router.post('/updateCustom0',[imageUpload.single('image'),jwtHelper.verifyExponentJwtToken], main_controller.updateCustom0);
router.post('/updateCustom1',[imageUpload.single('image'),jwtHelper.verifyExponentJwtToken], main_controller.updateCustom1);
router.post('/updateCustom2',[imageUpload.single('image'),jwtHelper.verifyExponentJwtToken], main_controller.updateCustom2);
router.post('/updateCustom3',[imageUpload.single('image'),jwtHelper.verifyExponentJwtToken], main_controller.updateCustom3);

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