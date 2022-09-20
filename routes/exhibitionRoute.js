const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const main_controller = require('../controllers/exhibitionController');
const imageUpload = require('../config/multerConfig').imageUpload;
const videoCloudUpload = require('../config/multerConfig').videoCloudUpload;

router.get('/stands',jwtHelper.verifyModeratorJwtToken, main_controller.getStands);
router.get('/webinar', jwtHelper.verifyModeratorJwtToken, main_controller.getWebinar);
router.get('/webinarForVisitor/:id', main_controller.getExhibitionForVisitor );
router.get('/allTest', main_controller.getAll);
router.get('/getExhibitionForVisitor/:id', main_controller.getExhibitionForVisitor);
router.get('/getVisitors/:id', main_controller.getVisitors);
router.get('/:id', main_controller.getExhibitionById);

router.post('/webinar', [videoCloudUpload.single('webinar'), jwtHelper.verifyModeratorJwtToken], main_controller.updateWebinar);
router.post('/update', jwtHelper.verifyModeratorJwtToken, main_controller.updateExhbition);
router.post('/updateSponsorDiscCustom0', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom0);
router.post('/updateSponsorDiscCustom1', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom1);
router.post('/updateSponsorDiscCustom3', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom2);
router.post('/updateSponsorDiscCustom2', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom3);
router.post('/updateSponsorBannerCustom0', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner0);
router.post('/updateSponsorBannerCustom1', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner1);
router.post('/updateSponsorBannerCustom2', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner2);
router.post('/updateSponsorBannerCustom3', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner3);
router.post('/updateSponsorCylindre', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorCylindre);
router.get('/all', main_controller.getExhibition);




module.exports = router;