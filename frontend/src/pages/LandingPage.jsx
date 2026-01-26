import React from 'react';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaMicrophone, FaUserTie } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      
      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-indigo-900 to-indigo-700 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Recruitment, <br/>
            <span className="text-indigo-300">Reimagined with AI.</span>
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto mb-10">
            Unified platform for job specific candidate screening and preparation.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/signup" className="bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-xl">
              Get Started for Free
            </Link>
            <Link to="/login" className="border border-white/30 bg-white/10 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose EvalHire?</h2>
          <p className="text-gray-500 mt-2">Powerful tools for both Candidates and Recruiters.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          
          {/* Feature 1 */}
          <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition text-center border">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              <FaFileAlt />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Smart Resume Analyzer</h3>
            <p className="text-gray-600">
              Upload your resume and get an instant AI score against any job description. Find missing skills in seconds.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition text-center border">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              <FaMicrophone />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">AI Mock Interview</h3>
            <p className="text-gray-600">
              Practice with our voice-enabled AI interviewer. Get real-time questions tailored to the specific job role.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition text-center border">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              <FaUserTie />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Auto-Ranked Applicants</h3>
            <p className="text-gray-600">
              Recruiters see the top candidates first. Our AI reads every resume and assigns a match score automatically.
            </p>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-gray-900 text-gray-400 py-8 text-center border-t border-gray-800">
        <p>&copy; {new Date().getFullYear()} EvalHire Project. Built with React, Node.js & Gemini AI.</p>
      </div>

    </div>
  );
};

export default LandingPage;