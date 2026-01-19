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
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // This confirms your SDK is working!
    console.log("🛠️ SDK Version:", require('@google/generative-ai/package.json').version);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // --- ADD THIS SECTION: Define the prompt ---
    const prompt = `
      Analyze this resume against the following job description.
      Job Description: ${req.body.jobDescription}
      Return a JSON object with score, missingSkills, and suggestions.
    `;
    // --------------------------------------------

    console.log("🤖 Attempting AI Call...");
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Standard cleaning and sending response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const cleanJson = text.substring(jsonStart, jsonEnd + 1);
    
    res.json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("❌ THE ACTUAL ERROR:");
    console.error("- Message:", error.message);
    
    res.status(500).json({ error: error.message });
  }
};

module.exports = { analyzeResume };