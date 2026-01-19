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
    // 1. Force the use of the STABLE v1 API version
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Pass the apiVersion explicitly here to fix the 404
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" } 
    );

    console.log("🛠️ SDK Version:", require('@google/generative-ai/package.json').version);
    
    // 2. Ensure prompt is defined (to fix your previous error)
    const prompt = `
      Act as an ATS system. 
      Resume: ${req.body.resumeText || "No resume text"}
      Job Description: ${req.body.jobDescription || "No JD"}
      Return JSON: { "score": 80, "missingSkills": [], "suggestions": [] }
    `;

    console.log("🤖 Attempting AI Call with v1 API...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON and send
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");
    
    res.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("❌ THE ACTUAL ERROR:");
    console.error("- Message:", error.message);
    
    // Return error to frontend
    res.status(500).json({ error: error.message });
  }
};

module.exports = { analyzeResume };