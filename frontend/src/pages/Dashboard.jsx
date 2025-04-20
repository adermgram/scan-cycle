import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardScanner from '../components/DashboardScanner';
import QRCode from 'qrcode';
import { FaQrcode, FaTrophy, FaTimes, FaDownload } from 'react-icons/fa';
import { API_BASE_URL, getAuthHeader } from '../config/api';
import { toast } from 'react-hot-toast';

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
  const [qrInfo, setQrInfo] = useState(null);
  const canvasRef = useRef(null);

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
        const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            ...getAuthHeader()
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
        const leaderboardResponse = await fetch(`${API_BASE_URL}/api/leaderboard/global`, {
          headers: {
            ...getAuthHeader()
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
      console.log('QR data to send:', data);
      
      // Send the raw QR code string directly
      const response = await fetch(`${API_BASE_URL}/api/items/validate-qr`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          itemId: data.itemId,
          type: data.type,
          points: data.points
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        // Handle specific error for already recycled items
        if (responseData.isUsed) {
          toast.error(responseData.message, {
            icon: '🔄',
            duration: 4000
          });
        } else {
          throw new Error(responseData.message || 'Failed to validate QR code');
        }
        return;
      }

      // Handle successful scan
      toast.success(`Item recycled successfully! +${responseData.points} points`, {
        icon: '♻️'
      });

      // Refresh user data to update points
      const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          ...getAuthHeader()
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
      toast.error(error.message || 'Error validating QR code');
    }
  };

  // Function to handle leaderboard button click
  const handleLeaderboardClick = () => {
    if (showScanner) {
      setShowScanner(false);
    }
    setShowFullLeaderboard(!showFullLeaderboard);
  };

  // Function to generate QR code on canvas
  const renderQRCodeToCanvas = (text) => {
    if (!canvasRef.current) return;
    
    QRCode.toCanvas(
      canvasRef.current, 
      text,
      { 
        width: 300,
        margin: 4,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      },
      (error) => {
        if (error) {
          console.error('Error rendering QR code to canvas:', error);
        }
      }
    );
  };

  // Function to properly download the QR code
  const handleDownloadQR = () => {
    try {
      // Make sure the canvas has the latest QR code
      if (qrInfo && canvasRef.current) {
        const qrString = `${qrInfo.itemId}|${qrInfo.type}|${qrInfo.points}`;
        renderQRCodeToCanvas(qrString);
        
        // Convert canvas to data URL and download
        const dataUrl = canvasRef.current.toDataURL('image/png');
        
        // Create a temporary link for download
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `recyclable-qr-${qrInfo.type}-${Date.now()}.png`;
        
        // Append to body, click and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('QR code downloaded successfully!');
      } else {
        toast.error('Unable to download QR code. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  // Function to generate test QR code
  const generateTestQR = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ type: 'plastic' })
      });
      const data = await response.json();
      
      // Use the data URL for display
      setTestQR(data.qrDataUrl);
      
      // Store QR info for display and canvas rendering
      const newQrInfo = {
        itemId: data.itemId,
        type: data.type,
        points: data.points
      };
      setQrInfo(newQrInfo);
      
      // Render QR code to canvas (for download)
      renderQRCodeToCanvas(data.qrCode);
      
      toast.success(`QR code generated: ${data.type} (${data.points} points)`);
    } catch (err) {
      console.error('Error generating QR code:', err);
      toast.error('Failed to generate QR code');
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
    <div className="min-h-screen bg-white">
      <div className="w-full flex flex-col lg:flex-row">
        {/* Left Side - Garbage Visualization */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full lg:w-[55%] p-4 lg:p-8"
        >
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-gray-800">Your Recycling Progress</h2>
          <div className="relative h-[30vh] md:h-[40vh] lg:h-[80vh] flex items-center justify-center bg-gray-50 rounded-2xl lg:rounded-3xl shadow-lg">
            {/* Garbage Bin */}
            <div className="relative w-32 h-52 md:w-40 md:h-64 lg:w-64 lg:h-96">
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
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-xs md:text-sm lg:text-base">
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
                <div className="absolute -bottom-2 left-4 w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-gray-700 rounded-full" />
                <div className="absolute -bottom-2 right-4 w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-gray-700 rounded-full" />
              </div>
            </div>
            {/* Points Display */}
            <div className="absolute bottom-4 lg:bottom-8 text-center">
              <p className="text-gray-600 text-sm md:text-base lg:text-lg">Your Points</p>
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-600">{userPoints}</p>
              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                {userPoints >= 10 
                  ? "Container full! Keep recycling!" 
                  : `${10 - userPoints} points until full`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side - QR Scanner & Leaderboard */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full lg:w-[45%] p-4 lg:p-8 bg-gray-50"
        >
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowScanner(!showScanner)}
              className={`${showScanner ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-xl p-2 md:p-3 lg:p-4 shadow-lg flex items-center justify-center space-x-1 md:space-x-2 transition-colors`}
            >
              {showScanner ? (
                <>
                  <FaTimes className="h-3 w-3 md:h-4 md:w-4 lg:h-6 lg:w-6" />
                  <span className="text-xs md:text-sm lg:text-base">Close Scanner</span>
                </>
              ) : (
                <>
                  <FaQrcode className="h-3 w-3 md:h-4 md:w-4 lg:h-6 lg:w-6" />
                  <span className="text-xs md:text-sm lg:text-base">Scan QR</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLeaderboardClick}
              className={`text-white rounded-xl p-2 md:p-3 lg:p-4 shadow-lg flex items-center justify-center space-x-1 md:space-x-2 transition-colors ${
                showFullLeaderboard ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <FaTrophy className="h-3 w-3 md:h-4 md:w-4 lg:h-6 lg:w-6" />
              <span className="text-xs md:text-sm lg:text-base">{showFullLeaderboard ? 'Show Less' : 'Full Leaderboard'}</span>
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
                className="bg-white rounded-2xl overflow-hidden shadow-lg"
              >
                <DashboardScanner onScanComplete={handleScanComplete} />
              </motion.div>
            ) : (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl p-3 md:p-4 lg:p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
                  <h3 className="text-base md:text-lg lg:text-xl font-semibold">Top Recyclers</h3>
                  <span className="text-xs lg:text-sm text-gray-500">Updated live</span>
                </div>
                <div className="space-y-2 md:space-y-3 lg:space-y-4 max-h-[250px] md:max-h-[300px] lg:max-h-[500px] overflow-y-auto">
                  {leaderboard.slice(0, showFullLeaderboard ? undefined : 5).map((user, index) => (
                    <motion.div
                      key={user._id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 md:p-3 lg:p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
                        <div className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-emerald-100 rounded-full flex items-center justify-center text-lg md:text-xl lg:text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🌟'}
                        </div>
                        <div>
                          <p className="font-medium text-black text-xs md:text-sm lg:text-base">{user.name || user.username}</p>
                          <p className="text-xs lg:text-sm text-gray-500">{user.points} points</p>
                        </div>
                      </div>
                      <div className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-base">
                        {index + 1}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Test QR Code Section */}
          {!showScanner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 lg:mt-6 bg-white rounded-2xl p-3 md:p-4 lg:p-6 shadow-lg"
            >
              <h3 className="text-sm md:text-base lg:text-lg font-semibold mb-2 md:mb-3 lg:mb-4">Generate Test QR Code</h3>
              <div className="flex flex-col items-center">
                {/* Hidden canvas for QR code generation and download */}
                <canvas ref={canvasRef} className="hidden" width="300" height="300"></canvas>
                
                {testQR && (
                  <>
                    <div className="bg-white p-2 md:p-3 lg:p-4 rounded-lg shadow-md mb-2 md:mb-3 lg:mb-4">
                      <img src={testQR} alt="Test QR Code" className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64" />
                    </div>
                    
                    {qrInfo && (
                      <div className="bg-gray-50 p-2 md:p-2 lg:p-3 rounded-lg mb-2 md:mb-3 lg:mb-4 w-full text-center">
                        <p className="text-xs lg:text-sm text-gray-700">ID: <span className="font-mono">{qrInfo.itemId}</span></p>
                        <p className="text-xs lg:text-sm text-gray-700">Type: <span className="font-medium text-emerald-600">{qrInfo.type}</span></p>
                        <p className="text-xs lg:text-sm text-gray-700">Points: <span className="font-bold">{qrInfo.points}</span></p>
                        <div className="mt-1 md:mt-2 text-xs bg-amber-50 p-1 md:p-2 rounded border border-amber-200 text-amber-800">
                          <span className="font-medium">⚠️ One-Time Use Only:</span> This QR code can only be recycled once.
                        </div>
                      </div>
                    )}
                    
                    <button 
                      onClick={handleDownloadQR}
                      className="px-2 py-1 md:px-3 md:py-2 lg:px-4 lg:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mb-2 md:mb-3 lg:mb-4 flex items-center space-x-1 md:space-x-2 text-xs md:text-sm lg:text-base"
                    >
                      <FaDownload className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span>Download QR Code</span>
                    </button>
                  </>
                )}
                
                <button
                  onClick={generateTestQR}
                  className="px-2 py-1 md:px-3 md:py-2 lg:px-4 lg:py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-xs md:text-sm lg:text-base"
                >
                  {testQR ? "Generate New QR Code" : "Generate QR Code"}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 