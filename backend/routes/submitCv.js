const express = require('express');
const multer = require('multer');
const { submitCv } = require('../controllers/submitCvController');
const { requirePost, formErrorHandler } = require('../utils/formHttp');
const { maxCvBytes } = require('../utils/cvFile');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    // Busboy marca truncado al alcanzar el límite; validateCv aplica el máximo inclusivo.
    limits: { fileSize: maxCvBytes + 1, files: 1, fields: 6, parts: 7, fieldSize: 16 * 1024, fieldNameSize: 64, headerPairs: 50 },
});

router.all('/submit-cv', requirePost('multipart/form-data', 5_150_000));
router.post('/submit-cv', upload.single('cv'), submitCv);
router.use('/submit-cv', formErrorHandler);

module.exports = router;
