require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listAvailableModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ API Key missing in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    console.log("🔍 Scanning for available models...");
    // This asks Google: "What models can I use?"
    const modelResponse = await genAI.getGenerativeModel({ model: "gemini-pro" }); // We need a dummy instance to access the manager, or we use the clean way below:
    
    // Using the lower-level fetch to get the list because the SDK obscures it sometimes
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
        console.error("❌ API Error:", data.error.message);
        return;
    }

    console.log("\n✅ AVAILABLE MODELS FOR YOU:");
    const viableModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    
    viableModels.forEach(m => {
        console.log(`   👉 ${m.name.replace('models/', '')}`);
    });

    console.log("\n(Use one of the names above in your resumeController.js)");

  } catch (error) {
    console.error("❌ Network Error:", error.message);
  }
}

listAvailableModels();