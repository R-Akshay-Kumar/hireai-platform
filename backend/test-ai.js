require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  console.log("1. Checking Environment...");
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: API Key is missing. Check your .env file.");
    return;
  }
  console.log("✅ API Key found:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");

  try {
    console.log("2. Connecting to Gemini...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    console.log("3. Sending Test Prompt...");
    const result = await model.generateContent("Hello! Are you working?");
    const response = await result.response;
    const text = response.text();

    console.log("✅ SUCCESS! AI Responded:");
    console.log(text);
  } catch (error) {
    console.error("❌ AI FAILURE:", error.message);
  }
}

testGemini();