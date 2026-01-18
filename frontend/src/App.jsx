import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Component Imports
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

// Candidate Imports
import CandidateDashboard from './pages/Candidate/CandidateDashboard';
import ResumeAnalyzer from './pages/Candidate/ResumeAnalyzer';
import MockInterview from './pages/Candidate/MockInterview';
import JobBoard from './pages/Candidate/JobBoard';
import JobDetails from './pages/Candidate/JobDetails';

// Recruiter Imports
import RecruiterDashboard from './pages/Recruiter/RecruiterDashboard';
import PostJob from './pages/Recruiter/PostJob';
import ViewApplicants from './pages/Recruiter/ViewApplicants';

function App() {
  return (
    <Router>
      {/* Navbar stays at the top of all pages */}
      <Navbar /> 
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Candidate Routes */}
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route path="/candidate/resume-analyzer" element={<ResumeAnalyzer />} />
        <Route path="/candidate/mock-interview" element={<MockInterview />} />
        <Route path="/candidate/jobs" element={<JobBoard />} />
        <Route path="/candidate/job/:id" element={<JobDetails />} />

        {/* Recruiter Routes */}
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/recruiter/post-job" element={<PostJob />} />
        <Route path="/recruiter/job/:id/applicants" element={<ViewApplicants />} />
      </Routes>
    </Router>
  );
}

export default App;