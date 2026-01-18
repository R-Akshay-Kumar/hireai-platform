const mongoose = require('mongoose');

const ResumeAnalysisSchema = new mongoose.Schema({
  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', // Optional: if analyzing against a specific job
  },
  matchScore: { type: Number }, // 0 to 100
  missingKeywords: [String],
  summary: String,
  improvements: String
}, { timestamps: true });

module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);