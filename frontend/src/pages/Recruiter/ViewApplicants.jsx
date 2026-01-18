import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaFilePdf,
  FaEnvelope,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

const ViewApplicants = () => {
  const { id } = useParams(); // Job ID
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  const handleUpdateStatus = async (applicantId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/jobs/${id}/applicant/${applicantId}/status`,
        {
          status: newStatus,
        },
      );

      // Update local state instantly to reflect change
      setApplicants((prev) =>
        prev.map((app) =>
          app._id === applicantId ? { ...app, status: newStatus } : app,
        ),
      );
    } catch (err) {
      alert("Failed to update status");
      console.error(err);
    }
  };

  const fetchApplicants = async () => {
    try {
      // 1. Get Job Details (for Title)
      const jobRes = await axios.get(`http://localhost:5000/api/jobs/${id}`);
      setJobTitle(jobRes.data.title);

      // 2. Get Applicants List
      const res = await axios.get(
        `http://localhost:5000/api/jobs/${id}/applicants`,
      );
      setApplicants(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = (resumeUrl) => {
    // Construct the full URL to the file on the backend
    // Note: You might need to make the 'uploads' folder static in server.js for this to work perfectly
    const fullUrl = `http://localhost:5000/${resumeUrl.replace(/\\/g, "/")}`;
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Applicants</h1>
          <p className="text-gray-500">
            Managing candidates for:{" "}
            <span className="font-bold text-indigo-600">{jobTitle}</span>
          </p>
        </div>

        {loading ? (
          <p>Loading candidates...</p>
        ) : applicants.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm">
            <h3 className="text-xl text-gray-500">No applicants yet.</h3>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Match Score
                  </th>{" "}
                  {/* NEW */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applicants.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50 transition">
                    {/* 1. Candidate Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                          <FaUser />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">
                            {app.candidateId?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <FaEnvelope className="text-xs" />{" "}
                            {app.candidateId?.email || "No Email"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. AI Score */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {app.matchScore > 0 ? (
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            app.matchScore >= 70
                              ? "bg-green-100 text-green-800"
                              : app.matchScore >= 40
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {app.matchScore}% Match
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Processing...
                        </span>
                      )}
                    </td>

                    {/* 3. Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt />{" "}
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* 4. Resume */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadResume(app.resumeUrl)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center gap-2"
                      >
                        <FaFilePdf /> View PDF
                      </button>
                    </td>

                    {/* 5. ACTIONS / STATUS (The Fix) */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* If Status is Pending -> Show Buttons */}
                      {app.status === "Pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleUpdateStatus(app._id, "Accepted")
                            }
                            className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-lg flex items-center gap-1 transition shadow-sm"
                          >
                            <FaCheck /> Accept
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(app._id, "Rejected")
                            }
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg flex items-center gap-1 transition shadow-sm"
                          >
                            <FaTimes /> Reject
                          </button>
                        </div>
                      ) : (
                        // If Status is NOT Pending -> Show Badge Only (Buttons Disappear)
                        <span
                          className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                            app.status === "Accepted"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {app.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewApplicants;
