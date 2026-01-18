import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../../api';
import { FaUpload, FaFileAlt, FaChartLine, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const ResumeAnalyzer = () => {
  const location = useLocation();

  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- AUTO-FILL LOGIC ---
  useEffect(() => {
    // If we came from the Job Board, fill the JD automatically
    if (location.state && location.state.jobDescription) {
      setJobDescription(location.state.jobDescription);
    }
  }, [location.state]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file || !jobDescription) {
      alert("Please upload a resume and provide a job description.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      // <--- 2. UPDATED: API.post() with relative path
      // We keep the header for multipart/form-data to ensure file uploads work correctly
      const res = await API.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
        
        {/* LEFT COLUMN: INPUTS */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaChartLine className="text-indigo-600" /> Smart Resume Analyzer
            </h1>

            {/* 1. Job Description Input */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                1. Job Description
                {location.state?.jobTitle && (
                   <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      Auto-filled for: {location.state.jobTitle}
                   </span>
                )}
              </label>
              <textarea
                className="w-full h-48 p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm leading-relaxed"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              ></textarea>
            </div>

            {/* 2. File Upload */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2">2. Upload Resume (PDF)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FaUpload className="text-3xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  {file ? file.name : "Click to upload or drag & drop"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF files only</p>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              {loading ? 'Analyzing with AI...' : 'Analyze My Resume'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div>
          {result ? (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Analysis Report</h2>
                <div className={`text-3xl font-bold ${result.score >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                  {result.score}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${result.score >= 70 ? 'bg-green-500' : 'bg-orange-500'}`} 
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>

              {/* Missing Skills */}
              <div className="mb-8">
                <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                  <FaExclamationTriangle /> Missing Skills
                </h3>
                {result.missingSkills && result.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.map((skill, idx) => (
                      <span key={idx} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm border border-red-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600 text-sm italic">Great job! No major skills missing.</p>
                )}
              </div>

              {/* Suggestions */}
              <div>
                <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
                  <FaFileAlt /> AI Suggestions
                </h3>
                <ul className="space-y-3">
                  {result.suggestions && result.suggestions.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-gray-600 leading-relaxed bg-indigo-50/50 p-3 rounded-lg">
                      <FaCheckCircle className="text-indigo-500 flex-shrink-0 mt-1" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            // Placeholder State
            <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <FaChartLine className="text-4xl text-gray-300" />
              </div>
              <h3 className="text-gray-400 font-bold text-lg">Ready to Analyze</h3>
              <p className="text-gray-400 max-w-xs mt-2 text-sm">
                Upload your resume and job description to see how well you match the role.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ResumeAnalyzer;