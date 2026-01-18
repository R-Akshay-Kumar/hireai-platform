const mongoose = require('mongoose');

const interviewSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Links to the Candidate
  },
  jobTitle: {
    type: String,
    required: true, // e.g., "React Developer" or "General Mock Interview"
  },
  jobDescription: {
    type: String,
    required: true, // We paste the JD here so AI knows what to ask
  },
  conversation: [
    {
      role: { type: String, enum: ['ai', 'user'] }, // Who said it?
      content: { type: String, required: true },     // What did they say?
      timestamp: { type: Date, default: Date.now }
    }
  ],
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  feedback: {
    type: String, // The final review from AI
  },
  score: {
    type: Number, // Optional score (0-100)
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Interview', interviewSchema);