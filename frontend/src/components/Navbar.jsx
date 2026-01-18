import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaRobot, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show Navbar inside the Interview or Resume Analyzer (Focus Mode)
  if (location.pathname.includes('/mock-interview') || location.pathname.includes('/resume-analyzer')) {
    return null;
  }

  // --- SAFELY GET USER (The Fix) ---
  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (err) {
    console.error("Invalid user data found, clearing storage.");
    localStorage.removeItem('user'); // Auto-clean bad data
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* LOGO */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
              <FaRobot className="text-3xl" />
              <span>HireAI</span>
            </Link>
          </div>

          {/* LINKS */}
          <div className="flex items-center gap-6">
            {!user ? (
              // GUEST LINKS
              <>
                <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium">Home</Link>
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Login</Link>
                <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition">
                  Get Started
                </Link>
              </>
            ) : (
              // LOGGED IN LINKS
              <>
                {/* Dashboard Link based on Role */}
                {user.userType === 'recruiter' ? (
                  <Link to="/recruiter/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/candidate/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium">Dashboard</Link>
                    <Link to="/candidate/jobs" className="text-gray-600 hover:text-indigo-600 font-medium">Jobs</Link>
                  </>
                )}

                {/* Profile / Logout */}
                <div className="flex items-center gap-4 border-l pl-6 ml-2">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <FaUserCircle className="text-xl text-gray-400" />
                    <span>{user.name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full uppercase text-gray-500 border">
                      {user.userType}
                    </span>
                  </div>
                  
                  <button 
                    onClick={handleLogout} 
                    className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;