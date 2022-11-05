const express = require('express');
const router = express.Router();
const main_controller = require('../controllers/stripeController');

router.post('/webhook', main_controller.webhook);



module.exports = router;