import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; // Import Axios
import { FaFileAlt, FaMicrophone, FaBriefcase, FaArrowRight, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

const CandidateDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || { name: "Candidate" };
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/jobs/candidate/${user._id || user.id}/applications`);
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for Status Badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Accepted': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-bold"><FaCheckCircle/> Accepted</span>;
      case 'Rejected': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-bold"><FaTimesCircle/> Rejected</span>;
      default: return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm font-bold"><FaClock/> Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user.name} 👋</h1>
          <p className="text-gray-500 mt-2">Track your applications and improve your skills with AI.</p>
        </div>

        {/* ... (Keep the MAIN ACTION GRID code exactly as it was) ... */}
        {/* Paste the 3 Cards (Find Jobs, Resume, Mock Interview) here from previous code */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
           {/* ... existing cards ... */}
           {/* If you need the code for cards again, let me know, otherwise keep them as is */}
             <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-xl transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-50 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition group-hover:bg-indigo-100"></div>
            <FaBriefcase className="text-4xl text-indigo-600 mb-6 relative z-10" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2 relative z-10">Find Jobs</h2>
            <p className="text-gray-500 mb-6 relative z-10">Browse openings, apply with one click, and track your status.</p>
            <Link to="/candidate/jobs" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline relative z-10">
              Browse Openings <FaArrowRight />
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-xl transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-50 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition group-hover:bg-purple-100"></div>
            <FaFileAlt className="text-4xl text-purple-600 mb-6 relative z-10" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2 relative z-10">Resume Analyzer</h2>
            <p className="text-gray-500 mb-6 relative z-10">Check your resume score against any job description instantly.</p>
            <Link to="/candidate/resume-analyzer" className="inline-flex items-center gap-2 text-purple-600 font-bold hover:underline relative z-10">
              Analyze Resume <FaArrowRight />
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-xl transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-50 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition group-hover:bg-green-100"></div>
            <FaMicrophone className="text-4xl text-green-600 mb-6 relative z-10" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2 relative z-10">Mock Interview</h2>
            <p className="text-gray-500 mb-6 relative z-10">Practice with our AI voice interviewer and get feedback.</p>
            <Link to="/candidate/mock-interview" className="inline-flex items-center gap-2 text-green-600 font-bold hover:underline relative z-10">
              Start Practice <FaArrowRight />
            </Link>
          </div>
        </div>

        {/* REAL APPLICATIONS SECTION */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Applications</h2>
          
          {loading ? (
             <p>Loading history...</p>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <p className="text-gray-400">You haven't applied to any jobs yet.</p>
              <Link to="/candidate/jobs" className="text-indigo-600 font-bold mt-2 inline-block">
                Start Applying Now
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Job Role</th>
                    <th className="p-4 font-semibold text-gray-600">Company</th>
                    <th className="p-4 font-semibold text-gray-600">Applied Date</th>
                    <th className="p-4 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {applications.map((app) => (
                    <tr key={app.jobId} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-800">{app.title}</td>
                      <td className="p-4 text-gray-600">{app.company}</td>
                      <td className="p-4 text-gray-500">{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        {getStatusBadge(app.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CandidateDashboard;