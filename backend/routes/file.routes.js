const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const { protect } = require('../middleware/auth.middleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', protect, upload.single('file'), fileController.upload);
router.get('/files', protect, fileController.list);
router.get('/files/:id', protect, fileController.download);

module.exports = router; 