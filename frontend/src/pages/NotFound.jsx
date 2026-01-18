import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
      <Link to="/" className="text-indigo-600 hover:underline">Go Home</Link>
    </div>
  );
};

export default NotFound;