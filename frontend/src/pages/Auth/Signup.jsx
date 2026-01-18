import React, { useState } from 'react';
import API from '../../api';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', userType: 'candidate' });
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/register', formData);
      alert('Registration Successful! Please Login.');
      navigate('/login');
    } catch (err) {
      alert('Error registering user');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Full Name" onChange={handleChange} className="w-full p-3 border rounded-lg" required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} className="w-full p-3 border rounded-lg" required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full p-3 border rounded-lg" required />
          
          <div className="flex justify-around p-2 bg-gray-100 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="userType" value="candidate" checked={formData.userType === 'candidate'} onChange={handleChange} /> Candidate
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="userType" value="recruiter" checked={formData.userType === 'recruiter'} onChange={handleChange} /> Recruiter
            </label>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">Sign Up</button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;