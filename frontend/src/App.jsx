import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import ProjectList from './pages/ProjectList';
import Login from './pages/Login';
import Analytics from './pages/Analytics';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {user && (
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex space-x-8">
                  <div className="flex-shrink-0 flex items-center">
                    <span className="text-xl font-bold text-indigo-600">TaskFlow</span>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link to="/" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium">Dashboard</Link>
                    <Link to="/tasks" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">Tasks</Link>
                    {user.role === 'ADMIN' && (
                      <>
                        <Link to="/projects" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">Projects</Link>
                        <Link to="/analytics" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">Analytics</Link>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Welcome, {user.name} ({user.role})</span>
                  <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-500">Logout</button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/tasks" element={user ? <TaskList user={user} /> : <Navigate to="/login" />} />
            <Route path="/projects" element={user && user.role === 'ADMIN' ? <ProjectList /> : <Navigate to="/" />} />
            <Route path="/analytics" element={user && user.role === 'ADMIN' ? <Analytics /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
