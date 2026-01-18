import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaBriefcase,
  FaCheckCircle,
  FaRobot,
  FaMicrophone,
  FaFileAlt,
  FaPaperPlane,
} from "react-icons/fa";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  // Hidden file input ref
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/jobs/${id}`);
      setJob(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- SMART ACTIONS ---
  const handleSmartAnalyze = () => {
    navigate("/candidate/resume-analyzer", {
      state: { jobDescription: job.description, jobTitle: job.title },
    });
  };

  const handleSmartInterview = () => {
    navigate("/candidate/mock-interview", {
      state: { jobDescription: job.description, jobTitle: job.title },
    });
  };

  // --- APPLY LOGIC ---
  const handleApplyClick = () => {
    // Trigger the hidden file input
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // NO Confirm Dialog - Just do it (or use a custom modal if you prefer)
    setApplying(true);
    const user = JSON.parse(localStorage.getItem("user"));

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("candidateId", user._id || user.id);

    try {
      await axios.post(`http://localhost:5000/api/jobs/apply/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // UX Improvement: Show success state on button instead of Alert
      alert("Application Sent!"); // Keep simple alert or remove entirely if you prefer
      navigate("/candidate/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  if (loading)
    return <div className="p-10 text-center">Loading job details...</div>;
  if (!job)
    return <div className="p-10 text-center text-red-500">Job not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mt-10 -mr-10"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {job.title}
            </h1>
            <p className="text-xl text-indigo-600 font-medium mb-6">
              {job.company}
            </p>
            <div className="flex flex-wrap gap-6 text-gray-500 text-sm">
              <span className="flex items-center gap-2">
                <FaMapMarkerAlt /> {job.location}
              </span>
              <span className="flex items-center gap-2">
                <FaMoneyBillWave /> {job.salaryRange || "Not disclosed"}
              </span>
              <span className="flex items-center gap-2">
                <FaBriefcase /> {job.type}
              </span>
              <span className="flex items-center gap-2">
                <FaCheckCircle /> Posted{" "}
                {new Date(job.postedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* JOB INFO */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Job Description
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Requirements
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="space-y-6">
            {/* AI TOOLS */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <FaRobot /> AI Power Tools
              </h3>
              <p className="text-indigo-100 text-sm mb-6">
                Increase your chances by 80% using our AI tools before applying.
              </p>
              <button
                onClick={handleSmartAnalyze}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white p-3 rounded-lg mb-3 flex items-center justify-center gap-2 font-semibold transition"
              >
                <FaFileAlt /> Analyze Resume
              </button>
              <button
                onClick={handleSmartInterview}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition"
              >
                <FaMicrophone /> Take Mock Interview
              </button>
            </div>

            {/* APPLY CARD */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-800 mb-4">Ready to Apply?</h3>
              <p className="text-gray-500 text-sm mb-4">
                Upload your resume to submit your application.
              </p>

              {/* Hidden File Input */}
              <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                onClick={handleApplyClick}
                disabled={applying}
                className={`w-full py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 ${
                  applying
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-black text-white"
                }`}
              >
                {applying ? (
                  "Uploading & Applying..."
                ) : (
                  <>
                    <FaPaperPlane /> Apply Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
