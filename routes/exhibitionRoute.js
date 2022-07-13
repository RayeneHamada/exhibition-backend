const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const main_controller = require('../controllers/exhibitionController');
const imageUpload = require('../config/multerConfig').imageUpload;
router.get('/allTest',main_controller.getAll);
router.get('/getExhibitionForVisitor/:id',main_controller.getExhibitionForVisitor);
router.get('/getVisitors/:id',main_controller.getVisitors);

router.get('/:id',main_controller.getExhibitionById);

router.post('/update',jwtHelper.verifyModeratorJwtToken, main_controller.updateExhbition);
router.post('/updateSponsorDiscCustom0',[imageUpload.single('image'),jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom0);
router.post('/updateSponsorDiscCustom1',[imageUpload.single('image'),jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom1);
router.post('/updateSponsorDiscCustom3',[imageUpload.single('image'),jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom2);
router.post('/updateSponsorDiscCustom2',[imageUpload.single('image'),jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom3);
router.post('/updateSponsorBannerCustom0',[imageUpload.single('image'),jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner0);
router.post('/updateSponsorBannerCustom1',[imageUpload.single('image'),jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner1);
router.post('/updateSponsorBannerCustom2',[imageUpload.single('image'),jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner2);
router.post('/updateSponsorBannerCustom3',[imageUpload.single('image'),jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner3);
router.post('/updateSponsorCylindre',[imageUpload.single('image'),jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorCylindre);

router.get('/all',main_controller.getExhibition);

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