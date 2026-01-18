const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');

// --- FALLBACK LOGIC (When AI is busy) ---
const analyzeLocally = (resumeText, jobDescription) => {
  console.log("⚠️ AI Busy. Switching to Local Analysis...");
  
  const commonSkills = ["javascript", "react", "node", "python", "java", "sql", "aws", "docker", "communication", "leadership"];
  const jdLower = jobDescription.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  // Find skills in JD
  const requiredSkills = commonSkills.filter(skill => jdLower.includes(skill));
  
  // Check against Resume
  const missing = requiredSkills.filter(skill => !resumeLower.includes(skill));
  const foundCount = requiredSkills.length - missing.length;
  
  // Calculate Score
  let score = requiredSkills.length > 0 ? Math.round((foundCount / requiredSkills.length) * 100) : 70;
  score = Math.min(score + 15, 95); // Boost slightly

  return {
    score: score,
    missingSkills: missing.length > 0 ? missing : ["None detected (Local Mode)"],
    suggestions: ["Ensure all keywords from the JD are in your resume.", "Add measurable metrics to your projects."]
  };
};

// --- MAIN CONTROLLER ---
const analyzeResume = async (req, res) => {
  let resumeText = ""; // Define outside try block
  
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ message: "API Key missing" });
    if (!req.file) return res.status(400).json({ message: 'No resume file uploaded' });
    if (!req.body.jobDescription) return res.status(400).json({ message: 'No Job Description provided' });

    console.log("📄 Processing Cloudinary File:", req.file.path);

    // 1. Download & Parse PDF
    const response = await axios.get(req.file.path, { responseType: 'arraybuffer' });
    const pdfData = await pdfParse(response.data);
    resumeText = pdfData.text;

    console.log("✅ PDF Parsed. Length:", resumeText.length);

    // 2. Call AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
    
    const prompt = `
      Act as an expert Technical Recruiter.
      Compare this Resume and Job Description (JD).
      Resume: "${resumeText.substring(0, 4000)}"
      JD: "${req.body.jobDescription.substring(0, 2000)}"
      STRICTLY return ONLY a JSON object. Format:
      { "score": 85, "missingSkills": ["a", "b"], "suggestions": ["x", "y"] }
    `;

    console.log("🤖 Asking Gemini...");
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.json(JSON.parse(text));

  } catch (error) {
    console.error(`❌ AI ERROR: ${error.message}`);
    
    // 3. Fallback: If AI fails, use Local Logic
    if (resumeText) {
      const fallbackResult = analyzeLocally(resumeText, req.body.jobDescription);
      return res.json(fallbackResult);
    }

    res.status(500).json({ message: 'Analysis failed', error: error.message });
  }
};

module.exports = { analyzeResume };