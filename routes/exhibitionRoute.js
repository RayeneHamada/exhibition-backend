const express = require('express');
const router = express.Router();
const jwtHelper = require('../helpers/jwtHelper');
const main_controller = require('../controllers/exhibitionController');
const imageUpload = require('../config/multerConfig').imageUpload;
const videoCloudUpload = require('../config/multerConfig').videoCloudUpload;
const fileUpload = require('../config/multerConfig').fileCloudUpload;

router.get('/income', jwtHelper.verifyModeratorJwtToken, main_controller.getTotalIncome);
router.get('/networking/count/:exhibition',  main_controller.getVisitorsForNetworkingCount);
router.get('/networking/:exhibition/:offset',  main_controller.getVisitorsForNetworking);
router.get('/visitorsSector', jwtHelper.verifyModeratorJwtToken, main_controller.getVisitorSector);
router.get('/visitorsAge', jwtHelper.verifyModeratorJwtToken, main_controller.getVisitorsAge);
router.get('/visitorsGender', jwtHelper.verifyModeratorJwtToken, main_controller.getVisitorsGender);
router.get('/all', jwtHelper.verifyAdminJwtToken, main_controller.getExhibitions);
router.get('/visitors/:offset', jwtHelper.verifyModeratorJwtToken, main_controller.getVisitors);
router.get('/visitorsSheet', jwtHelper.verifyModeratorJwtToken, main_controller.getExhibitionVisitorsSheet);
router.get('/stands/:exhibitionId', jwtHelper.verifyExhibitionAccessJwtToken, main_controller.getStands);
router.get('/webinar', jwtHelper.verifyModeratorJwtToken, main_controller.getWebinar);
router.get('/webinarForVisitor/:id', main_controller.getExhibitionForVisitor);
router.get('/allTest', main_controller.getAll);
router.get('/getExhibitionForVisitor/:id', main_controller.getExhibitionForVisitor);
router.get('/getVisitors/:id', main_controller.getVisitors);
router.get('/:id', main_controller.getExhibitionById);
router.get('/entrance/:id', main_controller.getEntrance);

router.post('/webinar', [videoCloudUpload.single('webinar'), jwtHelper.verifyModeratorJwtToken], main_controller.updateWebinar);
router.post('/webinar/videos/new', [fileUpload.fields([{ name: 'thumb' }, { name: 'webinar' }]), jwtHelper.verifyModeratorJwtToken], main_controller.addWebniarVideo);
router.post('/update', jwtHelper.verifyModeratorJwtToken, main_controller.updateExhbition);
router.post('/updateSponsorDiscCustom0', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom0);
router.post('/updateSponsorDiscCustom1', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom1);
router.post('/updateSponsorDiscCustom2', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom2);
router.post('/updateSponsorDiscCustom3', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorDiscCustom3);
router.post('/updateSponsorBannerCustom0', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner0);
router.post('/updateSponsorBannerCustom1', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner1);
router.post('/updateSponsorBannerCustom2', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner2);
router.post('/updateSponsorBannerCustom3', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorBanner3);
router.post('/updateSponsorCylindre0', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorCylindre0);
router.post('/updateSponsorCylindre1', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorCylindre1);
router.post('/updateSponsorCylindre2', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorCylindre2);
router.post('/updateSponsorCylindre3', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateSponsorCylindre3);
router.get('/all', main_controller.getExhibition);

router.post('/entrance/updateSponsorBannerCustom0', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateEntranceSponsorBanner0);
router.post('/entrance/updateSponsorBannerCustom1', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateEntranceSponsorBanner1);
router.post('/entrance/updateEntranceCubeScreen0', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateEntranceCubeScreen00);
router.post('/entrance/updateEntranceCubeScreen1', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateEntranceCubeScreen01);
router.post('/entrance/updateEntranceCubeScreen2', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateEntranceCubeScreen02);
router.post('/entrance/updateEntranceCubeScreen3', [imageUpload.single('image'), jwtHelper.verifyModeratorJwtToken], main_controller.updateEntranceCubeScreen03);




module.exports = router;