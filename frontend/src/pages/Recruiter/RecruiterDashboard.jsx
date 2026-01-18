import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api"; 
import { FaPlus, FaBriefcase, FaUsers } from "react-icons/fa";

const RecruiterDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      // Ensure we handle both _id (MongoDB) and id (some auth providers)
      const userId = user._id || user.id;

      // <--- 2. UPDATED: API.get() with relative path
      const res = await API.get(`/jobs/recruiter/${userId}`);
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Recruiter Dashboard
            </h1>
            <p className="text-gray-500">
              Manage your job postings and view applicants.
            </p>
          </div>

          <Link
            to="/recruiter/post-job"
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg"
          >
            <FaPlus /> Post New Job
          </Link>
        </div>

        {/* STATS CARDS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-indigo-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Jobs</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {jobs.length}
                </h3>
              </div>
              <FaBriefcase className="text-indigo-200 text-3xl" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Total Applicants
                </p>
                {/* Calculate total applicants across all jobs */}
                <h3 className="text-2xl font-bold text-gray-800">
                  {jobs.reduce(
                    (acc, job) =>
                      acc + (job.applicants ? job.applicants.length : 0),
                    0,
                  )}
                </h3>
              </div>
              <FaUsers className="text-green-200 text-3xl" />
            </div>
          </div>
        </div>

        {/* JOBS LIST */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Your Recent Job Postings
        </h2>

        {loading ? (
          <p className="text-gray-500 animate-pulse">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
            <FaBriefcase className="text-gray-300 text-5xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800">
              No Jobs Posted Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first job opening to start finding candidates.
            </p>
            <Link
              to="/recruiter/post-job"
              className="text-indigo-600 font-bold hover:underline"
            >
              Create Job Now &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {job.company} • {job.location} • {job.type}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Posted on {new Date(job.postedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {job.applicants ? job.applicants.length : 0} Applicants
                  </span>
                  
                    <Link
                      to={`/recruiter/job/${job._id}/applicants`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition"
                    >
                      View Applicants
                    </Link>
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;