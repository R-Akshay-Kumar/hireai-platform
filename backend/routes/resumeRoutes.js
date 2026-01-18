const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import Cloudinary Storage (replacing 'dest: uploads/')
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

const { analyzeResume } = require('../controllers/resumeController');

// Define the POST route
// Now 'upload.single' sends the file directly to Cloudinary
router.post('/analyze', upload.single('resume'), analyzeResume);

module.exports = router;