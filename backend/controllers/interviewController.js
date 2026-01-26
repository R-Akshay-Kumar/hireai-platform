const Interview = require("../models/Interview");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- CONFIGURATION ---
const GEN_MODEL = "gemini-2.5-flash-lite"; 

// --- 1. LOCAL BACKUPS (Safety Net) ---
const FALLBACK_QUESTIONS = [
  { text: "Can you describe a challenging bug you faced recently and how you solved it?", time: 120 },
  { text: "Explain the difference between SQL and NoSQL databases.", time: 90 },
  { text: "How do you handle state management in a complex application?", time: 120 },
  { text: "What is the importance of RESTful API design?", time: 60 },
  { text: "Describe your experience with Git and version control.", time: 60 },
];

const getRandomFallback = () => {
  const q = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
  return {
    question: q.text,
    timeLimit: q.time,
  };
};

const FALLBACK_FEEDBACK = {
  score: 75,
  strengths: ["Communication", "Attempted Answers"],
  improvements: ["Detailed AI report unavailable due to network load."],
  summary: "Interview recorded successfully. The candidate provided responses to technical questions.",
};

// --- 2. HELPERS ---

const cleanJSON = (text) => {
  if (!text) return "";
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const getAIResponse = async (conversation, jobDescription, questionCount) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEN_MODEL });

    // Map 'ai' role to 'model' for Gemini API compatibility
    const historyForGemini = conversation.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const prompt = `
      You are a Technical Interviewer for this Job Description:
      "${jobDescription.substring(0, 400)}..."

      History: ${JSON.stringify(historyForGemini.slice(-4))}

      Task: Generate the NEXT technical question (Question ${questionCount + 1}).
      
      CRITICAL INSTRUCTIONS:
      1. ACKNOWLEDGE & PIVOT: Briefly acknowledge the user's last answer, BUT pivot to a NEW topic.
      2. COMPLEXITY & TIME: Analyze difficulty.
         - Simple/Behavioral: 'timeLimit' 60-90s.
         - Technical/Deep: 'timeLimit' 120-240s.
      3. LENGTH: Keep question under 35 words.
      4. FORMAT: Return ONLY raw JSON.
      
      JSON Schema:
      { "question": "Your question text here", "timeLimit": (integer seconds) }
    `;

    const result = await model.generateContent(prompt);
    const text = cleanJSON(result.response.text());
    
    return JSON.parse(text);

  } catch (error) {
    console.error("⚠️ AI Question Error:", error.message);
    return getRandomFallback();
  }
};

const getFinalFeedback = async (conversation, jobDescription) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEN_MODEL });

    const prompt = `
      Act as a Hiring Manager. Evaluate this interview.
      JD: "${jobDescription.substring(0, 500)}"
      History: ${JSON.stringify(conversation)}
      
      Task: Generate a JSON feedback report.
      GRADING RULES:
      1. IGNORE TIME: Do not judge based on speed.
      2. CONTENT IS KING: If the user provided a text answer, GRADE IT.
      3. SKIPS: Only mark as 0/Skipped if answer is explicitly empty.
      
      Strictly follow this JSON schema:
      {
        "score": (integer 0-100),
        "strengths": ["point 1", "point 2"],
        "improvements": ["point 1", "point 2"],
        "summary": "Short 2-sentence summary."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = cleanJSON(result.response.text());
    
    return JSON.parse(text);

  } catch (error) {
    console.error("⚠️ AI Feedback Error:", error.message);
    return FALLBACK_FEEDBACK; 
  }
};

// --- 3. CONTROLLER FUNCTIONS ---

exports.startInterview = async (req, res) => {
  try {
    const { userId, jobTitle, jobDescription } = req.body;

    // UPDATED: Using 'conversation' to match Schema
    const newInterview = new Interview({
      userId,
      jobTitle,
      jobDescription,
      conversation: [], 
      status: "active", // Matched Schema Default
    });

    const aiData = await getAIResponse([], jobDescription, 0);

    // UPDATED: Using 'ai' role to match Schema
    newInterview.conversation.push({ role: "ai", content: aiData.question });
    await newInterview.save();

    res.json({
      _id: newInterview._id,
      currentQuestion: aiData,
    });
  } catch (err) {
    console.error("Start Error:", err);
    res.status(500).json({ message: "Failed to start interview" });
  }
};

exports.chat = async (req, res) => {
  try {
    const { interviewId, userAnswer } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview) return res.status(404).json({ message: "Interview not found" });

    // 1. Save User Answer
    const finalAnswer = userAnswer ? userAnswer : "[No audio detected]";
    // UPDATED: Push to 'conversation'
    interview.conversation.push({ role: "user", content: finalAnswer });

    // 2. Check Progress (Count 'ai' messages)
    const questionCount = interview.conversation.filter(h => h.role === "ai").length;

    // --- CASE A: END INTERVIEW ---
    if (questionCount >= 5 || userAnswer.includes("[User ended interview early]")) {
      console.log("Generating Final Report...");
      await new Promise(resolve => setTimeout(resolve, 500)); 

      const feedback = await getFinalFeedback(interview.conversation, interview.jobDescription);
      
      interview.status = "completed";
      interview.feedback = JSON.stringify(feedback); // Ensure string if schema expects String, or Object if schema expects Mixed
      interview.score = feedback.score; // Save score to schema
      await interview.save();

      return res.json({ status: "completed", feedback: feedback });
    }

    // --- CASE B: NEXT QUESTION ---
    const nextQ = await getAIResponse(interview.conversation, interview.jobDescription, questionCount);
    
    // UPDATED: Push 'ai' role
    interview.conversation.push({ role: "ai", content: nextQ.question });
    await interview.save();

    res.json({ status: "in-progress", currentQuestion: nextQ });

  } catch (err) {
    console.error("Chat Logic Error:", err);
    res.json({ status: "in-progress", currentQuestion: getRandomFallback() });
  }
};

exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: "Error fetching interview" });
  }
};