const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

// --- 1. ROBUST LOCAL ANALYSIS (Always works as a backup) ---
const analyzeLocally = (resumeText, jobDescription) => {
  console.log("⚠️ AI Failed. Running Local Analysis...");
  const jdLower = (jobDescription || "").toLowerCase();
  const resumeLower = (resumeText || "").toLowerCase();

  const commonSkills = [
    "javascript",
    "react",
    "node",
    "python",
    "sql",
    "aws",
    "java",
  ];
  const missing = commonSkills.filter(
    (skill) => jdLower.includes(skill) && !resumeLower.includes(skill),
  );

  return {
    score: 75, // Default passing score for local mode
    missingSkills:
      missing.length > 0 ? missing : ["Keywords not found in text"],
    suggestions: [
      "Try adding more technical keywords from the job description.",
      "Ensure your contact information is clear.",
    ],
    isLocal: true, // Flag to know it's local
  };
};

// --- 2. MAIN CONTROLLER ---
const analyzeResume = async (req, res) => {
  let resumeText = "";
  let jobDescription = req.body.jobDescription || "Software Developer";

  try {
    console.log(
      "🛠️ SDK Version:",
      require("@google/generative-ai/package.json").version,
    );

    // A. Extract Text from PDF
    if (req.file) {
      const response = await axios.get(req.file.path, {
        responseType: "arraybuffer",
      });
      const pdfData = await pdfParse(response.data);
      resumeText = pdfData.text;
      console.log("✅ PDF Parsed successfully.");
    }

    // B. Attempt AI Analysis
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error("API_KEY_MISSING");

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      // USE 'gemini-pro' - It is the most globally stable model for v1
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      const prompt = `Analyze resume for this JD: ${jobDescription}. Resume: ${resumeText.substring(0, 4000)}. Return JSON ONLY: {"score": 85, "missingSkills": [], "suggestions": []}`;

      console.log("🤖 Attempting AI Call...");
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Clean and Parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("INVALID_AI_JSON");

      console.log("✅ AI Analysis Successful");
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (aiError) {
      console.error("❌ AI ERROR:", aiError.message);
      // AI FAILED? Run local analysis immediately
      const localResult = analyzeLocally(resumeText, jobDescription);
      return res.json(localResult);
    }
  } catch (generalError) {
    console.error("❌ GENERAL CRASH:", generalError.message);
    // Even if PDF parsing fails, return something so the UI doesn't break
    res.status(200).json({
      score: 0,
      missingSkills: ["Error processing file"],
      suggestions: ["Please upload a valid PDF resume."],
    });
  }
};

module.exports = { analyzeResume };
