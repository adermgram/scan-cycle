import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navbar />}
        <div className={`${isAuthenticated ? 'pt-16' : ''}`}>
          <Routes>
            <Route 
              path="/" 
              element={
                !isAuthenticated ? (
                  <Auth onLoginSuccess={() => setIsAuthenticated(true)} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              } 
            />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
            />
            <Route
              path="/scanner"
              element={isAuthenticated ? <Scanner /> : <Navigate to="/" />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
