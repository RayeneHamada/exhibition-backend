const express = require('express');
const router = express.Router();
const jwtHelper = require('../helpers/jwtHelper');
const main_controller = require('../controllers/exhibitionLogController');
router.post('/record',jwtHelper.verifyVisitorJwtToken,main_controller.new);
router.get('/webinar',jwtHelper.verifyModeratorJwtToken,main_controller.getWebinarStats);

module.exports = router;