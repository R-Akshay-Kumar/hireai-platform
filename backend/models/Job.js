const mongoose = require('mongoose');

const jobSchema = mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true }, // Skills needed
  salaryRange: { type: String },
  type: { type: String, default: 'Full-time' }, // Full-time, Internship, etc.
  postedAt: { type: Date, default: Date.now },
  applicants: [{
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resumeUrl: String,
    matchScore: Number, // We will calculate this automatically later!
    isFallbackScore: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['Pending', 'Accepted', 'Rejected'], 
        default: 'Pending' 
    },
    appliedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Job', jobSchema);