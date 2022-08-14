const express = require('express');
const router = express.Router();
const jwtHelper = require('../config/jwtHelper');
const main_controller = require('../controllers/standLogController');
const imageUpload = require('../config/multerConfig').imageUpload;
router.post('/record',jwtHelper.verifyVisitorJwtToken,main_controller.new);
router.get('/visits',jwtHelper.verifyExponentJwtToken,main_controller.getStandsVisitsNb);
router.get('/exhibitionVisits',jwtHelper.verifyExponentJwtToken,main_controller.getExhibitionVisitsNb);

module.exports = router;