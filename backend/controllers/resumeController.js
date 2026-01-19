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
    
    // Log the SDK version being used by Render
    console.log("🛠️ SDK Version:", require('@google/generative-ai/package.json').version);

    // Use a specific model version to avoid "alias" issues
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("🤖 Attempting AI Call...");
    
    const result = await model.generateContent(prompt);
    // ... rest of your code
    
  } catch (error) {
    console.error("❌ THE ACTUAL ERROR:");
    console.error("- Status:", error.status || "Unknown");
    console.error("- Message:", error.message);
    
    // This logs the actual URL that failed
    if (error.stack) {
      const urlMatch = error.stack.match(/https:\/\/generativelanguage\.googleapis\.com\/[^\s]+/);
      if (urlMatch) console.log("- Failed URL:", urlMatch[0]);
    }

    // Temporary: return the error to the screen so you don't have to check logs
    res.status(500).json({ error: error.message, debug: "Check Render Logs" });
  }
};

module.exports = { analyzeResume };