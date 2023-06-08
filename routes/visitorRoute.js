const express = require('express');
const router = express.Router();
const jwtHelper = require('../helpers/jwtHelper');
const main_controller = require('../controllers/visitorController');
const imageUpload = require('../config/multerConfig').imageUpload;

router.post('/login', main_controller.authenticateVisitor);
router.post('/participate/free', main_controller.participateFreely);
router.post('/participate/paied', main_controller.payWithCreditCard);
router.post('/test', jwtHelper.verifyJwtToken, (req, res) => { res.status(203).send() });
router.post('/refreshToken', main_controller.refreshToken);




module.exports = router;