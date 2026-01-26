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

const getAIResponse = async (history, jobDescription, questionCount) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEN_MODEL });

    // PROMPT: Variable Time & Bridge-Pivot Strategy
    const prompt = `
      You are a Technical Interviewer for this Job Description:
      "${jobDescription.substring(0, 400)}..."

      History of this interview:
      ${JSON.stringify(history.slice(-4))}

      Task: Generate the NEXT technical question (Question ${questionCount + 1}).
      
      CRITICAL INSTRUCTIONS:
      1. ACKNOWLEDGE & PIVOT: Briefly acknowledge the user's last answer to be natural, BUT immediately pivot to a NEW topic from the JD.
      2. COMPLEXITY & TIME: Analyze the difficulty of your question.
         - Simple/Behavioral: Set 'timeLimit' to 60 or 90 seconds.
         - Technical/Deep: Set 'timeLimit' to 120, 180, or 240 seconds.
      3. LENGTH: Keep the question text under 35 words.
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

const getFinalFeedback = async (history, jobDescription) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEN_MODEL });

    // PROMPT: Smart Grading (Ignores Time Taken)
    const prompt = `
      Act as a Hiring Manager. Evaluate this interview.
      
      Job Description: "${jobDescription.substring(0, 500)}"
      Interview History: ${JSON.stringify(history)}
      
      Task: Generate a JSON feedback report.
      
      GRADING RULES:
      1. IGNORE TIME: Do not judge based on how fast or slow they answered. 
      2. CONTENT IS KING: If the user provided a text answer in the history (even a short one), GRADE IT based on technical accuracy and relevance.
      3. SKIPS: Only mark as 0/Skipped if the user content explicitly says "[User skipped...]" or is completely empty.
      
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

    const newInterview = new Interview({
      userId,
      jobTitle,
      jobDescription,
      history: [],
      status: "in-progress",
    });

    // Generate Q1
    const aiData = await getAIResponse([], jobDescription, 0);

    newInterview.history.push({ role: "model", content: aiData.question });
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

exports.handleChat = async (req, res) => {
  try {
    const { interviewId, userAnswer } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview) return res.status(404).json({ message: "Interview not found" });

    // 1. Save User Answer
    // Logic check: Ensure we don't save empty strings if possible, or handle them gracefully
    const finalAnswer = userAnswer ? userAnswer : "[No audio detected]";
    interview.history.push({ role: "user", content: finalAnswer });

    // 2. Check Progress
    const questionCount = interview.history.filter(h => h.role === "model").length;

    // --- CASE A: END INTERVIEW (5 Questions) ---
    if (questionCount >= 5 || userAnswer.includes("[User ended interview early]")) {
      console.log("Generating Final Report...");
      
      // Add a small delay to ensure DB write consistency before reading for AI
      await new Promise(resolve => setTimeout(resolve, 500));

      const feedback = await getFinalFeedback(interview.history, interview.jobDescription);
      
      interview.status = "completed";
      interview.feedback = feedback;
      await interview.save();

      return res.json({
        status: "completed",
        feedback: feedback
      });
    }

    // --- CASE B: NEXT QUESTION ---
    const nextQ = await getAIResponse(interview.history, interview.jobDescription, questionCount);
    
    interview.history.push({ role: "model", content: nextQ.question });
    await interview.save();

    res.json({
      status: "in-progress",
      currentQuestion: nextQ
    });

  } catch (err) {
    console.error("Chat Logic Error:", err);
    res.json({
      status: "in-progress",
      currentQuestion: getRandomFallback()
    });
  }
};