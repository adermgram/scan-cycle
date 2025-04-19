import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardScanner from '../components/DashboardScanner';
import QRCode from 'qrcode';
import { FaQrcode, FaTrophy } from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const [fillLevel, setFillLevel] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [testQR, setTestQR] = useState(null);

  // Fetch user profile and leaderboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        // Fetch user profile
        const profileResponse = await fetch('http://localhost:5000/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const profileData = await profileResponse.json();
        setUserPoints(profileData.points);
        
        // Calculate fill level based on user's points
        // Using 10 points as maximum (100% full)
        const calculatedFillLevel = Math.min((profileData.points / 10) * 100, 100);
        setFillLevel(calculatedFillLevel);

        // Fetch leaderboard
        const leaderboardResponse = await fetch('http://localhost:5000/api/leaderboard/global', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!leaderboardResponse.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.leaderboard);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('token')) {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Function to handle scan completion
  const handleScanComplete = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/items/validate-qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qrData: data })
      });

      if (!response.ok) {
        throw new Error('Failed to validate QR code');
      }

      // Refresh user data to update points
      const profileResponse = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserPoints(profileData.points);
        const calculatedFillLevel = Math.min((profileData.points / 10) * 100, 100);
        setFillLevel(calculatedFillLevel);
      }

      // Close scanner and show success message
      setShowScanner(false);
    } catch (error) {
      console.error('Error validating QR code:', error);
    }
  };

  // Function to handle leaderboard button click
  const handleLeaderboardClick = () => {
    if (showScanner) {
      setShowScanner(false);
    }
    setShowFullLeaderboard(!showFullLeaderboard);
  };

  // Function to generate test QR code
  const generateTestQR = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/items/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type: 'plastic' })
      });
      const data = await response.json();
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(data.qrCode);
      setTestQR(qrCodeDataUrl);
    } catch (err) {
      setError('Failed to generate QR code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-emerald-500 text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Garbage Visualization */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-[55%] p-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Recycling Progress</h2>
        <div className="relative h-[80vh] flex items-center justify-center bg-white rounded-3xl shadow-lg">
          {/* Garbage Bin */}
          <div className="relative w-64 h-96">
            {/* Bin Body */}
            <motion.div 
              className="absolute bottom-0 w-full bg-emerald-500 rounded-lg shadow-lg transition-all duration-300"
              style={{ 
                height: `${fillLevel}%`,
                background: `linear-gradient(180deg, 
                  ${fillLevel > 80 ? '#ef4444' : fillLevel > 50 ? '#eab308' : '#10b981'} 0%,
                  ${fillLevel > 80 ? '#dc2626' : fillLevel > 50 ? '#ca8a04' : '#059669'} 100%)`
              }}
            >
              {/* Fill Level Text */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold">
                {Math.round(fillLevel)}%
              </div>
            </motion.div>
            {/* Bin Outline */}
            <div className="absolute inset-0 border-4 border-gray-800 rounded-lg">
              {/* Lid */}
              <motion.div 
                className="absolute -top-4 w-full h-4 bg-gray-800 rounded-t-lg origin-bottom"
                whileHover={{ rotateX: 45 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              {/* Wheels */}
              <div className="absolute -bottom-2 left-4 w-4 h-4 bg-gray-700 rounded-full" />
              <div className="absolute -bottom-2 right-4 w-4 h-4 bg-gray-700 rounded-full" />
            </div>
          </div>
          {/* Points Display */}
          <div className="absolute bottom-8 text-center">
            <p className="text-gray-600 text-lg">Your Points</p>
            <p className="text-4xl font-bold text-emerald-600">{userPoints}</p>
            <p className="text-sm text-gray-500 mt-1">
              {userPoints >= 10 
                ? "Container full! Keep recycling!" 
                : `${10 - userPoints} points until full`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right Side - QR Scanner & Leaderboard */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-[45%] p-8 bg-gray-100"
      >
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowScanner(true)}
            className="bg-emerald-500 text-white rounded-xl p-4 shadow-lg flex items-center justify-center space-x-2 hover:bg-emerald-600 transition-colors"
          >
            <FaQrcode className="h-6 w-6" />
            <span>Scan QR</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLeaderboardClick}
            className={`text-white rounded-xl p-4 shadow-lg flex items-center justify-center space-x-2 transition-colors ${
              showFullLeaderboard ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            <FaTrophy className="h-6 w-6" />
            <span>{showFullLeaderboard ? 'Show Less' : 'Full Leaderboard'}</span>
          </motion.button>
        </div>

        {/* Content Area - Toggle between Scanner and Leaderboard */}
        <AnimatePresence mode="wait">
          {showScanner ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl overflow-hidden"
            >
              <DashboardScanner onScanComplete={handleScanComplete} />
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Top Recyclers</h3>
                <span className="text-sm text-gray-500">Updated live</span>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {leaderboard.slice(0, showFullLeaderboard ? undefined : 5).map((user, index) => (
                  <motion.div
                    key={user.username}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
                        {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🌟'}
                      </div>
                      <div>
                        <p className="font-medium">{user.name || user.username}</p>
                        <p className="text-sm text-gray-500">{user.points} points</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test QR Code Section */}
        {testQR && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4">Test QR Code</h3>
            <div className="flex flex-col items-center">
              <img src={testQR} alt="Test QR Code" className="w-48 h-48" />
              <button
                onClick={generateTestQR}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Generate New Test QR
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard; 