const Job = require('../models/Job');
const fs = require('fs');
const pdf = require('pdf-parse'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');

// --- LOCAL FALLBACK ALGORITHM ---
const calculateLocalScore = (resumeText, jobDescription) => {
  console.log("⚠️ AI Busy. Using Local Keyword Matching...");
  const commonTechTerms = ["react", "node", "javascript", "python", "java", "sql", "mongodb", "aws", "docker", "html", "css", "api", "git", "communication", "teamwork", "problem solving", "leadership", "agile"];
  
  const jdLower = jobDescription.toLowerCase();
  const resumeLower = resumeText.toLowerCase();
  
  const targetSkills = commonTechTerms.filter(term => jdLower.includes(term));
  if (targetSkills.length === 0) return 70;

  let matchCount = 0;
  targetSkills.forEach(skill => {
    if (resumeLower.includes(skill)) matchCount++;
  });

  let score = Math.round((matchCount / targetSkills.length) * 100);
  return Math.min(score + 20, 95); 
};

// --- AI SCORING WRAPPER (Updated) ---
const calculateAIScore = async (resumePath, jobDescription) => {
  let resumeText = "";
  try {
    const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' });
    const pdfData = await pdf(response.data); // Parse the downloaded buffer
    resumeText = pdfData.text;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

    const prompt = `
      You are an ATS.
      JD: "${jobDescription.substring(0, 500)}"
      Resume: "${resumeText.substring(0, 500)}"
      Task: Rate match 0-100. Return ONLY integer.
    `;

    console.log("   🚀 Sending request to Gemini..."); 
    const result = await model.generateContent(prompt);
    const scoreText = result.response.text().trim();
    const score = parseInt(scoreText.replace(/\D/g, '')) || 0;

    console.log(`   ✅ AI SUCCESS: Gemini returned score: ${score}`);
    return { score: score, isFallback: false }; 

  } catch (error) {
    console.log(`   ❌ AI FAILED: ${error.message}`);
    
    if (resumeText) {
      console.log("   🔄 SWITCHING TO LOCAL FALLBACK...");
      const localScore = calculateLocalScore(resumeText, jobDescription);
      console.log(`   🔸 LOCAL RESULT: Keyword score: ${localScore}`);
      return { score: localScore, isFallback: true };
    }
    return { score: 0, isFallback: false };
  }
};
// --- CONTROLLER FUNCTIONS (Defined directly on exports) ---

exports.postJob = async (req, res) => {
  try {
    const { title, company, location, description, requirements, salaryRange, type, recruiterId } = req.body;
    const newJob = new Job({ recruiterId, title, company, location, description, requirements, salaryRange, type });
    await newJob.save();
    res.status(201).json({ message: "Job Posted Successfully", job: newJob });
  } catch (error) {
    res.status(500).json({ message: "Error posting job", error: error.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.params.recruiterId }).sort({ postedAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs" });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ postedAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs" });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('recruiterId', 'name company');
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Error fetching job details" });
  }
};

exports.applyForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { candidateId } = req.body;
    if (!req.file) return res.status(400).json({ message: "Resume file is required" });

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const alreadyApplied = job.applicants.find(app => app.candidateId.toString() === candidateId);
    if (alreadyApplied) return res.status(400).json({ message: "You have already applied for this job" });

    job.applicants.push({ candidateId, resumeUrl: req.file.path, matchScore: 0, appliedAt: new Date() });
    await job.save();
    res.json({ message: "Application submitted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error submitting application" });
  }
};

exports.getJobApplicants = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id).populate({ path: 'applicants.candidateId', select: 'name email' });
    if (!job) return res.status(404).json({ message: "Job not found" });

    let updated = false;
    console.log(`\n--- FETCHING APPLICANTS FOR: ${job.title} ---`);

    for (let app of job.applicants) {
      const candidateName = app.candidateId ? app.candidateId.name : "Unknown";
      
      // 1. CHECK: Do we need to calculate?
      const needsCalculation = !app.matchScore || app.matchScore === 0 || app.isFallbackScore === true;

      if (!needsCalculation) {
        // CASE A: VALID SCORE EXISTS
        console.log(`[CACHE HIT] ${candidateName} already has AI Score: ${app.matchScore}. Skipping.`);
      } 
      else {
        // CASE B: CALCULATION NEEDED
        const reason = app.isFallbackScore ? "Retrying Fallback Score" : "New Applicant";
        console.log(`[CALCULATING] ${candidateName} (${reason})...`);

        if (app.resumeUrl) {
          await new Promise(r => setTimeout(r, 200)); // Delay for rate limits
          
          const result = await calculateAIScore(app.resumeUrl, job.description);

          // Only save if something changed
          if (app.matchScore !== result.score || app.isFallbackScore !== result.isFallback) {
             console.log(`   💾 UPDATING DB: Score ${app.matchScore} -> ${result.score}`);
             app.matchScore = result.score;
             app.isFallbackScore = result.isFallback;
             updated = true;
          } else {
             console.log(`   🤷 NO CHANGE: Score remained ${result.score}`);
          }
        }
      }
    }

    if (updated) {
      await job.save();
      console.log("--- DATABASE UPDATED SUCCESSFULLY ---");
    } else {
      console.log("--- NO DATABASE CHANGES ---");
    }

    const sortedApplicants = job.applicants.sort((a, b) => b.matchScore - a.matchScore);
    res.json(sortedApplicants);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching applicants" });
  }
};

// 7. Get Applications for a specific Candidate
exports.getCandidateApplications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find jobs where this user exists in the applicants array
    const jobs = await Job.find({ 'applicants.candidateId': userId })
      .select('title company location applicants') // Only get necessary fields
      .sort({ 'applicants.appliedAt': -1 });

    // Filter to return only relevant data for this user
    const applications = jobs.map(job => {
      const applicant = job.applicants.find(app => app.candidateId.toString() === userId);
      return {
        jobId: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        status: applicant.status,
        appliedAt: applicant.appliedAt
      };
    });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching applications" });
  }
};

// 8. Update Applicant Status (Accept/Reject)
exports.updateApplicantStatus = async (req, res) => {
  try {
    const { jobId, applicantId } = req.params;
    const { status } = req.body; // 'Accepted' or 'Rejected'

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Find the specific applicant within the array
    const applicant = job.applicants.id(applicantId); // Mongoose subdoc method
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    applicant.status = status;
    await job.save();

    res.json({ message: `Applicant ${status} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status" });
  }
};