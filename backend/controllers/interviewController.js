const Interview = require("../models/Interview");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- 1. LOCAL BACKUP QUESTIONS (Offline Mode) ---
// Used when AI Quota is exceeded so you can keep testing your UI.
const FALLBACK_QUESTIONS = [
  "Can you describe a challenging bug you faced recently and how you solved it?",
  "Explain the difference between SQL and NoSQL databases. When would you use each?",
  "How do you handle state management in a complex React application?",
  "What is the importance of RESTful API design? Give an example of a good endpoint.",
  "Describe your experience with Git and version control in a team setting.",
  "How do you optimize a website for performance and faster load times?",
  "Explain the concept of 'Closure' in JavaScript with a practical example.",
  "What are the security best practices you follow when building a backend API?",
  "Tell me about a time you had to learn a new technology quickly under pressure.",
  "How does the browser's Event Loop work in JavaScript?",
];

const getRandomFallback = () => {
  const randomIndex = Math.floor(Math.random() * FALLBACK_QUESTIONS.length);
  return {
    question: FALLBACK_QUESTIONS[randomIndex],
    timeLimit: 120, // Default 2 mins
  };
};

const getFallbackFeedback = () => ({
  score: 85,
  strengths: ["Resilience", "Technical Knowledge", "Communication"],
  improvements: ["Could provide more specific examples", "Work on pacing"],
  summary:
    "Great job completing the interview. (Note: This is an automated fallback report because the AI service is currently busy. Your answers were recorded successfully.)",
});

// --- 2. AI HELPERS ---

const getAIResponse = async (conversationHistory, jobDescription) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // ATTEMPT 1: Try the "Lite" model (Often has better availability)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
      You are an expert Technical Interviewer.
      Job Description: "${jobDescription.substring(0, 500)}"
      
      History:
      ${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}
      
      Task: Generate ONE technical question based on the history.
      STRICTLY return JSON: { "question": "...", "timeLimit": 60 }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("⚠️ AI Limit Hit. Switching to Offline Question.");
    return getRandomFallback(); // <--- THE FIX: Return local question instead of crashing
  }
};

const getFinalFeedback = async (conversationHistory, jobDescription) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
      Evaluate this interview.
      JD: "${jobDescription.substring(0, 500)}"
      History:
      ${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}
      
      Return JSON: { "score": 0-100, "strengths": [], "improvements": [], "summary": "..." }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("⚠️ AI Feedback Limit Hit. Using Fallback Report.");
    return getFallbackFeedback();
  }
};

// --- 3. API HANDLERS ---

exports.startInterview = async (req, res) => {
  try {
    const { userId, jobTitle, jobDescription } = req.body;

    const newInterview = new Interview({
      userId,
      jobTitle,
      jobDescription,
      conversation: [],
    });

    // Try AI, but if it fails, getAIResponse now returns a Backup Question
    const aiData = await getAIResponse([], jobDescription);

    newInterview.conversation.push({ role: "ai", content: aiData.question });
    await newInterview.save();

    res.json({ ...newInterview.toObject(), currentQuestion: aiData });
  } catch (error) {
    console.error("Start Error:", error);
    res.status(500).json({ message: "Failed to start interview" });
  }
};

exports.chat = async (req, res) => {
  try {
    const { interviewId, userAnswer } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview)
      return res.status(404).json({ message: "Interview not found" });

    // Save User Answer
    interview.conversation.push({ role: "user", content: userAnswer });

    // Check Round Count (Limit 5)
    const aiMessageCount = interview.conversation.filter(
      (m) => m.role === "ai",
    ).length;

    if (aiMessageCount >= 5) {
      const feedbackJson = await getFinalFeedback(
        interview.conversation,
        interview.jobDescription,
      );

      interview.status = "completed";
      interview.feedback = JSON.stringify(feedbackJson);
      interview.score = feedbackJson.score;
      await interview.save();

      return res.json({
        status: "completed",
        conversation: interview.conversation,
        feedback: feedbackJson,
      });
    }

    // Get Next Question (AI or Backup)
    const nextQuestion = await getAIResponse(
      interview.conversation,
      interview.jobDescription,
    );

    interview.conversation.push({ role: "ai", content: nextQuestion.question });
    await interview.save();

    res.json({
      status: "active",
      conversation: interview.conversation,
      currentQuestion: nextQuestion,
    });
  } catch (error) {
    console.error("Chat Error:", error);
    // Even if Chat crashes, try to force a generic "Next Question" so UI doesn't freeze
    res.json({
      status: "active",
      conversation: [],
      currentQuestion: getRandomFallback(),
    });
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
