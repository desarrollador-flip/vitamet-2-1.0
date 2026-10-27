const express = require('express');
const { submitCon } = require('../controllers/submitConController');
const { requirePost, formErrorHandler } = require('../utils/formHttp');

const router = express.Router();
router.all('/submit-con', requirePost('application/json', 16 * 1024));
router.post('/submit-con', express.json({ limit: '16kb', inflate: false }), submitCon);
router.use('/submit-con', formErrorHandler);

module.exports = router;
