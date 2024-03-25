
const express = require('express');

const authController = require('../controllers/authContoller');

const router = express.Router();



router.get('/', authController.getMainPage);




module.exports = router;
