import React, { useState } from 'react';
import axios from 'axios';

const PostJob = () => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salaryRange: '',
    type: 'Full-time',
    description: '',
    requirements: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user'));

    try {
      await axios.post('http://localhost:5000/api/jobs/post', {
        ...formData,
        recruiterId: user._id || user.id
      });
      alert('Job Posted Successfully!');
      setFormData({
        title: '', company: '', location: '', salaryRange: '', type: 'Full-time', description: '', requirements: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl border">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Post a New Job</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input name="title" required value={formData.title} onChange={handleChange} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. React Developer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input name="company" required value={formData.company} onChange={handleChange} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Tech Corp" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input name="location" required value={formData.location} onChange={handleChange} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Remote / New York" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
              <input name="salaryRange" value={formData.salaryRange} onChange={handleChange} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. $80k - $120k" />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
             <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
               <option>Full-time</option>
               <option>Part-time</option>
               <option>Contract</option>
               <option>Internship</option>
             </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea name="description" required value={formData.description} onChange={handleChange} rows="4"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Describe the role..."></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (Skills)</label>
            <textarea name="requirements" required value={formData.requirements} onChange={handleChange} rows="3"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. React, Node.js, MongoDB..."></textarea>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostJob;