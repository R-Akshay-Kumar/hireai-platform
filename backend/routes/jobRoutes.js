const express = require('express');
const router = express.Router();
const multer = require('multer');

// --- 1. Cloudinary Setup (Keep this, delete the old diskStorage) ---
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// --- 2. Import Controllers ---
const { 
  postJob, 
  getMyJobs, 
  getAllJobs, 
  getJobById, 
  applyForJob, 
  getJobApplicants,
  getCandidateApplications,
  updateApplicantStatus
} = require('../controllers/jobController');

// --- ROUTES ---

// A. Specific Routes (Must come BEFORE /:id)
router.post('/post', postJob);
router.get('/recruiter/:recruiterId', getMyJobs);
router.get('/all', getAllJobs);

// B. Candidate Applications (MUST come before /:id generic route)
router.get('/candidate/:userId/applications', getCandidateApplications);

// C. Job Operations
router.post('/apply/:id', upload.single('resume'), applyForJob); // Uses Cloudinary upload
router.get('/:id/applicants', getJobApplicants);
router.put('/:jobId/applicant/:applicantId/status', updateApplicantStatus);

// D. Generic Route (Must be LAST)
// This catches anything like /12345. If you put specific routes below this, 
// Express thinks "candidate" is an ID.
router.get('/:id', getJobById);

module.exports = router;