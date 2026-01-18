import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaForward,
  FaMicrophone,
} from "react-icons/fa";
import { useLocation } from "react-router-dom";

const MockInterview = () => {
  // --- STATE ---
  const [step, setStep] = useState("setup");
  const [loading, setLoading] = useState(false);

  // Data
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [interviewId, setInterviewId] = useState(null);

  // Interview Logic
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const location = useLocation();

  // Proctored Logic
  const [violations, setViolations] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Results
  const [feedback, setFeedback] = useState(null);

  // Modal State
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "",
    onConfirm: null,
  });

  // Hidden Audio Processing
  const speechBuffer = useRef("");
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // --- UTILITIES ---

  const stopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setAiSpeaking(false);
  };

  const getFontSize = (text) => {
    if (!text) return "text-2xl";
    const len = text.length;
    if (len < 50) return "text-4xl md:text-5xl";
    if (len < 150) return "text-3xl md:text-4xl";
    if (len < 300) return "text-2xl md:text-3xl";
    return "text-xl";
  };

  const formatText = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, index) => {
      const isList =
        line.trim().startsWith("-") ||
        line.trim().startsWith("*") ||
        /^\d+\./.test(line);
      return (
        <p key={index} className={`mb-3 ${isList ? "pl-6 text-left" : ""}`}>
          {line}
        </p>
      );
    });
  };

  const forceFeedbackState = () => {
    stopAudio();
    setStep("feedback");
    document.exitFullscreen().catch(() => {});
    // If backend failed, show local feedback
    if (!feedback) {
      setFeedback({
        score: 0,
        strengths: ["Attempted"],
        improvements: ["Interview ended prematurely or server error"],
        summary:
          "The interview was submitted, but we could not generate a full report at this time.",
      });
    }
  };

  // --- FULL SCREEN LOGIC ---

  useEffect(() => {
    const handleFullScreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullScreen(isFull);

      // Violations check
      if (!isFull && step === "interview" && !modal.show) {
        handleViolation("Exited Full Screen");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && step === "interview") {
        handleViolation("Switched Tab/Window");
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAudio();
    };
  }, [step, modal.show]);

  // Auto-fill from Job Board
  useEffect(() => {
    if (location.state) {
      setJobTitle(location.state.jobTitle || "");
      setJobDesc(location.state.jobDescription || "");
    }
  }, [location.state]);

  const handleViolation = (reason) => {
    const newCount = violations + 1;
    setViolations(newCount);

    setModal({
      show: true,
      title: "⚠️ Violation Detected",
      message: `${reason}. This is violation ${newCount}/3. Please return to full screen immediately.`,
      type: "warning",
      onConfirm: async () => {
        setModal({ ...modal, show: false });
        // Attempt to re-enter full screen
        try {
          if (!document.fullscreenElement)
            await document.documentElement.requestFullscreen();
        } catch (e) {
          /* ignore */
        }
      },
    });

    if (newCount >= 3) {
      stopAudio();
      alert("🚫 Maximum violations reached. Auto-submitting interview.");
      finalizeInterview();
    }
  };

  const enterFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.error("Full screen denied", e);
    }
  };

  // --- AUDIO INIT ---

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        speechBuffer.current = transcript;
      };
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      handleNextQuestion(true);
    }
    return () => clearInterval(interval);
  }, [timeLeft, isTimerRunning]);

  const playQuestion = (text) => {
    stopAudio();

    // Small delay to ensure previous audio is cleared
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      setAiSpeaking(true);
      setIsTimerRunning(false);

      utterance.onend = () => {
        setAiSpeaking(false);
        setIsTimerRunning(true);
        speechBuffer.current = "";
        try {
          if (recognitionRef.current) recognitionRef.current.start();
        } catch (e) {
          /* ignore */
        }
      };

      synthRef.current.speak(utterance);
    }, 100);
  };

  // --- API ACTIONS ---

  const handleStart = async () => {
    if (!jobTitle || !jobDesc) return alert("Please fill in fields");
    await enterFullScreen();

    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user"));

    try {
      const res = await axios.post(
        "http://localhost:5000/api/interview/start",
        {
          userId: user._id || user.id,
          jobTitle,
          jobDescription: jobDesc,
        },
      );

      setInterviewId(res.data._id);
      setStep("interview");
      setQuestionCount(1);

      const qData = res.data.currentQuestion;
      setCurrentQuestion(qData.question);
      setTimeLeft(qData.timeLimit || 60);
      playQuestion(qData.question);
    } catch (err) {
      console.error(err);
      alert("Failed to start. Check your connection or try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async (isAuto = false) => {
    const executeNext = async () => {
      stopAudio();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsTimerRunning(false);
      setLoading(true);

      const answerToSend =
        speechBuffer.current.trim() || "[User skipped or stayed silent]";

      try {
        const res = await axios.post(
          "http://localhost:5000/api/interview/chat",
          {
            interviewId,
            userAnswer: answerToSend,
          },
        );

        if (res.data.status === "completed") {
          setFeedback(res.data.feedback);
          forceFeedbackState();
        } else {
          const qData = res.data.currentQuestion;
          setCurrentQuestion(qData.question);
          setTimeLeft(qData.timeLimit || 60);
          setQuestionCount((prev) => prev + 1);
          playQuestion(qData.question);
        }
      } catch (err) {
        console.error("Next Question Error:", err);
        // If error is 429 or 500, we likely can't continue. Force submit.
        alert("Server is busy. Submitting interview results now.");
        forceFeedbackState();
      } finally {
        setLoading(false);
        setModal({ ...modal, show: false });
      }
    };

    if (isAuto) {
      executeNext();
    } else {
      setModal({
        show: true,
        title: "Skip Question?",
        message: "Are you sure you want to skip?",
        type: "confirm",
        onConfirm: executeNext,
      });
    }
  };

  const finalizeInterview = async () => {
    const executeSubmit = async () => {
      stopAudio();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsTimerRunning(false);
      setLoading(true);

      const answerToSend =
        speechBuffer.current.trim() || "[User ended interview early]";

      try {
        const res = await axios.post(
          "http://localhost:5000/api/interview/chat",
          {
            interviewId,
            userAnswer: answerToSend,
          },
        );

        if (res.data.feedback) setFeedback(res.data.feedback);
        forceFeedbackState();
      } catch (err) {
        console.error("Submit Error:", err);
        forceFeedbackState(); // FORCE END EVEN ON ERROR
      } finally {
        setLoading(false);
        setModal({ ...modal, show: false });
      }
    };

    setModal({
      show: true,
      title: "End Interview?",
      message: "Are you sure you want to submit your interview now?",
      type: "confirm",
      onConfirm: executeSubmit,
    });
  };

  // --- RENDER ---

  // NOTE: Added z-[9999] and fixed inset-0 to interview container to cover navbar
  return (
    <div className="min-h-screen bg-gray-50 font-sans select-none relative">
      {/* MODAL */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3
              className={`text-xl font-bold mb-2 ${modal.type === "warning" ? "text-red-600" : "text-gray-800"}`}
            >
              {modal.title}
            </h3>
            <p className="text-gray-600 mb-6">{modal.message}</p>
            <div className="flex justify-end gap-3">
              {modal.type !== "warning" && (
                <button
                  onClick={() => setModal({ ...modal, show: false })}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={modal.onConfirm}
                className={`px-4 py-2 rounded-lg font-bold text-white ${modal.type === "warning" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {modal.type === "warning" ? "Return to Full Screen" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETUP STEP (Normal Layout) */}
      {step === "setup" && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-xl shadow-xl border w-full max-w-2xl">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">
              AI Mock Interview
            </h1>
            <p className="text-gray-500 mb-6">
              Proctored Environment • Voice Only
            </p>

            <div className="space-y-4">
              <input
                className="w-full p-3 border rounded-lg"
                placeholder="Target Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <textarea
                className="w-full p-3 border rounded-lg h-32"
                placeholder="Paste Job Description..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              ></textarea>
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                {loading ? "Initializing..." : "Start Interview"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERVIEW STEP (Overlay Layout - Covers Main Navbar) */}
      {step === "interview" && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="h-16 bg-gray-900 text-white flex justify-between items-center px-8 shadow-md z-10">
            <span className="font-medium text-gray-400">
              Question {questionCount}/5
            </span>
            <div
              className={`text-2xl font-mono font-bold flex items-center gap-3 ${timeLeft < 10 ? "text-red-500 animate-pulse" : "text-green-400"}`}
            >
              <FaClock />
              {Math.floor(timeLeft / 60)}:{("0" + (timeLeft % 60)).slice(-2)}
            </div>
          </div>

          {/* Question Viewport */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 overflow-y-auto">
            {loading ? (
              <div className="animate-pulse text-2xl text-gray-400 font-light">
                Thinking...
              </div>
            ) : (
              <div className="max-w-5xl w-full text-center space-y-8">
                <div
                  className={`font-bold text-gray-800 leading-relaxed ${getFontSize(currentQuestion)}`}
                >
                  {formatText(currentQuestion)}
                </div>

                <div className="h-12 flex items-center justify-center">
                  {aiSpeaking && (
                    <span className="text-indigo-600 font-medium flex items-center gap-2 animate-pulse">
                      🔊 AI is speaking...
                    </span>
                  )}
                  {isTimerRunning && (
                    <span className="text-red-500 font-medium flex items-center gap-2">
                      <FaMicrophone className="animate-bounce" /> Listening...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="h-24 bg-gray-50 border-t flex items-center justify-center gap-6 px-4">
            <button
              onClick={() => handleNextQuestion(false)}
              disabled={aiSpeaking || loading}
              className="flex items-center gap-2 px-8 py-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 hover:shadow-md transition"
            >
              Skip / Next <FaForward />
            </button>

            <button
              onClick={finalizeInterview}
              className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 hover:shadow-md transition"
            >
              End Interview <FaCheckCircle />
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK STEP */}
      {step === "feedback" && feedback && (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-4xl w-full bg-white p-10 rounded-2xl shadow-xl border">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
              Interview Results
            </h1>

            <div className="flex justify-center mb-8">
              <div className="h-24 w-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                {feedback.score}%
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                <h3 className="font-bold text-green-800 mb-4 text-lg">
                  ✅ Strengths
                </h3>
                <ul className="space-y-2 text-green-900 text-sm">
                  {feedback.strengths?.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                <h3 className="font-bold text-orange-800 mb-4 text-lg">
                  ⚠️ Improvements
                </h3>
                <ul className="space-y-2 text-orange-900 text-sm">
                  {feedback.improvements?.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-xl mb-8">
              <h3 className="font-bold text-gray-800 mb-2">Summary</h3>
              <p className="text-gray-600">{feedback.summary}</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterview;
