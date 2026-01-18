import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaArrowRight } from 'react-icons/fa';

const JobBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/jobs/all');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Find Your Dream Job</h1>
          <p className="text-gray-500 text-lg">Browse openings and use AI to increase your chances.</p>
          
          <div className="mt-8 max-w-xl mx-auto">
            <input 
              type="text" 
              placeholder="Search by role or company..."
              className="w-full p-4 rounded-full border shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* JOBS GRID */}
        {loading ? (
          <p className="text-center text-gray-500">Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
             <h3 className="text-xl text-gray-600">No jobs found matching your criteria.</h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredJobs.map(job => (
              <div key={job._id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-lg transition group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition">
                      {job.title}
                    </h2>
                    <p className="text-gray-600 font-medium">{job.company}</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {job.type}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <span className="flex items-center gap-1"><FaMapMarkerAlt /> {job.location}</span>
                  <span className="flex items-center gap-1"><FaMoneyBillWave /> {job.salaryRange || 'Not disclosed'}</span>
                </div>

                <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                  {job.description}
                </p>

                <div className="pt-4 border-t flex justify-end">
                  <Link 
                    to={`/candidate/job/${job._id}`}
                    className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg transition"
                  >
                    View & Apply <FaArrowRight />
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

export default JobBoard;