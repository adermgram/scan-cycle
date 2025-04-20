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
          <div className="relative h-[30vh] md:h-[40vh] lg:h-[80vh] flex items-center justify-center bg-gradient-to-b from-sky-50 to-gray-100 rounded-2xl lg:rounded-3xl shadow-lg overflow-hidden">
            {/* Environment Background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-emerald-100 to-transparent"></div>
              <motion.div 
                className="absolute top-10 right-10 w-12 h-12 md:w-16 md:h-16 lg:w-24 lg:h-24 text-yellow-400"
                animate={{ y: [0, -5, 0], opacity: [1, 0.8, 1] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              </motion.div>
              
              {/* Floating Recycling Symbols */}
              <motion.div
                className="absolute left-1/4 top-1/3 text-emerald-500 w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 opacity-30"
                animate={{ 
                  y: [0, -40, 0],
                  opacity: [0, 0.4, 0], 
                  scale: [0.8, 1, 0.8] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 15,
                  delay: 2,
                  ease: "easeInOut" 
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.82 15.42L19.32 19.75C18.83 20.61 17.92 21.16 16.93 21.16H15.12C16.37 18.85 18.24 17.18 20.34 16.34L21.82 15.42M15.56 11.13C16.07 11.13 16.5 11.56 16.5 12.06C16.5 12.57 16.07 13 15.56 13C15.05 13 14.62 12.57 14.62 12.06C14.62 11.56 15.05 11.13 15.56 11.13M8.46 11.13C8.96 11.13 9.39 11.56 9.39 12.06C9.39 12.57 8.96 13 8.46 13C7.95 13 7.5 12.57 7.5 12.06C7.5 11.56 7.95 11.13 8.46 11.13M12 17.5C9.5 17.5 7.5 15.5 7.5 13C7.5 10.5 9.5 8.5 12 8.5C14.5 8.5 16.5 10.5 16.5 13C16.5 15.5 14.5 17.5 12 17.5M12 6.5A6.5 6.5 0 0,0 5.5 13A6.5 6.5 0 0,0 12 19.5A6.5 6.5 0 0,0 18.5 13A6.5 6.5 0 0,0 12 6.5Z" />
                </svg>
              </motion.div>
              
              <motion.div
                className="absolute right-1/4 top-2/3 text-blue-500 w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 opacity-30"
                animate={{ 
                  y: [0, -30, 0],
                  opacity: [0, 0.3, 0], 
                  scale: [0.8, 1, 0.8] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 12,
                  delay: 5,
                  ease: "easeInOut" 
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.36 10.27L16 9L14.73 6.39L16.9 2.45C17.2 1.86 16.71 1.17 16.05 1.2L7.58 1.97C7.22 2 6.9 2.18 6.7 2.4L1.81 8.61C1.4 9.19 1.81 10 2.55 10H4.43C4.8 10 5.13 10.23 5.24 10.59L5.87 12.59C6.04 13.17 5.89 13.79 5.46 14.17L4.3 15.21C3.97 15.5 3.93 16 4.24 16.34L9.06 21.67C9.37 22 9.87 22 10.18 21.67L13.08 18.55C13.57 18 14.32 17.81 15.03 18.05L19.93 19.86C20.57 20.09 21.22 19.65 21.13 18.97L20.13 12.9C20.08 12.43 19.82 12 19.42 11.77L19.36 10.27M10.45 14.17L12.05 12.91C12.92 12.23 14.05 12.11 15.05 12.61L15.82 12.95L17.12 12.12L17.5 14L15.82 16.17L14.85 16L14.46 15.87C14.03 15.69 13.55 15.94 13.39 16.4L12.95 17.97L11.44 17.91L10.89 16.78C10.56 16.11 10 15.58 9.32 15.31L7.6 14.66L9.27 14.33C9.61 14.26 9.92 14.08 10.13 13.8L10.45 14.17Z" />
                </svg>
              </motion.div>
            </div>
            
            {/* Garbage Bin */}
            <div className="relative w-32 h-52 md:w-40 md:h-64 lg:w-64 lg:h-96 z-10">
              {/* Shadow */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] h-3 bg-black/20 rounded-full blur-sm"></div>
              
              {/* Bin Body */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                {/* Metal/Plastic Texture */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-300 overflow-hidden">
                  {/* Texture Lines */}
                  <div className="absolute inset-0 opacity-10">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute h-px bg-gray-600" 
                        style={{ 
                          left: 0, 
                          right: 0, 
                          top: `${i * 5}%` 
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  {/* Recycling Symbol */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 text-emerald-600/10">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.82,15.42L19.32,19.75C18.83,20.61 17.92,21.16 16.93,21.16H15.12C16.37,18.85 18.24,17.18 20.34,16.34L21.82,15.42M15.56,11.13C16.07,11.13 16.5,11.56 16.5,12.06C16.5,12.57 16.07,13 15.56,13C15.05,13 14.62,12.57 14.62,12.06C14.62,11.56 15.05,11.13 15.56,11.13M8.46,11.13C8.96,11.13 9.39,11.56 9.39,12.06C9.39,12.57 8.96,13 8.46,13C7.95,13 7.5,12.57 7.5,12.06C7.5,11.56 7.95,11.13 8.46,11.13M12,17.5C9.5,17.5 7.5,15.5 7.5,13C7.5,10.5 9.5,8.5 12,8.5C14.5,8.5 16.5,10.5 16.5,13C16.5,15.5 14.5,17.5 12,17.5M12,6.5A6.5,6.5 0 0,0 5.5,13A6.5,6.5 0 0,0 12,19.5A6.5,6.5 0 0,0 18.5,13A6.5,6.5 0 0,0 12,6.5Z" />
                    </svg>
                  </div>
                </div>
                
                {/* Fill Animation */}
                <motion.div 
                  className="absolute bottom-0 w-full transition-all duration-700 ease-in-out"
                  initial={{ height: "0%" }}
                  animate={{ height: `${fillLevel}%` }}
                  style={{ 
                    background: `linear-gradient(180deg, 
                      ${fillLevel > 80 ? '#ef4444' : fillLevel > 50 ? '#eab308' : '#10b981'} 0%,
                      ${fillLevel > 80 ? '#dc2626' : fillLevel > 50 ? '#ca8a04' : '#059669'} 100%)`
                  }}
                >
                  {/* Bubbles Animation */}
                  {fillLevel > 0 && (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 rounded-full bg-white/30"
                          initial={{ 
                            x: `${Math.random() * 80 + 10}%`, 
                            y: `${Math.random() * 20 + 80}%`, 
                            opacity: 0, 
                            scale: 0 
                          }}
                          animate={{ 
                            y: ["100%", "0%"],
                            opacity: [0, 0.7, 0],
                            scale: [0, 1, 0.5] 
                          }}
                          transition={{
                            duration: 2 + Math.random() * 3,
                            repeat: Infinity,
                            delay: i * 0.7,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Fill Level Text */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-xs md:text-sm lg:text-base drop-shadow-md">
                    {Math.round(fillLevel)}%
                  </div>
                </motion.div>
              </div>
              
              {/* Bin Outline and Details */}
              <div className="absolute inset-0 border-4 border-gray-800 rounded-lg">
                {/* Rim at top */}
                <div className="absolute -top-1 inset-x-0 h-3 bg-gray-700 rounded-t-sm"></div>
                
                {/* Bin handle */}
                <div className="absolute top-[15%] right-0 w-2 h-10 md:h-12 lg:h-16 -mr-1 bg-gray-800 rounded-r-md"></div>
                <div className="absolute top-[15%] left-0 w-2 h-10 md:h-12 lg:h-16 -ml-1 bg-gray-800 rounded-l-md"></div>
                
                {/* Lid */}
                <motion.div 
                  className="absolute -top-4 w-full h-5 md:h-6 lg:h-8 bg-gray-800 rounded-t-lg origin-bottom"
                  whileHover={{ rotateX: 45 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Lid handle */}
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 md:w-8 lg:w-12 h-1 md:h-1.5 lg:h-2 bg-gray-700 rounded-full"></div>
                </motion.div>
                
                {/* Ridges */}
                <div className="absolute inset-x-0 top-[40%] h-1 bg-gray-900/20"></div>
                <div className="absolute inset-x-0 top-[60%] h-1 bg-gray-900/20"></div>
                <div className="absolute inset-x-0 top-[80%] h-1 bg-gray-900/20"></div>
                
                {/* Wheels */}
                <div className="absolute -bottom-2 left-[25%] w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-gray-700 rounded-full"></div>
                <div className="absolute -bottom-2 right-[25%] w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-gray-700 rounded-full"></div>
              </div>
            </div>
            
            {/* Points Display */}
            <div className="absolute bottom-4 lg:bottom-8 text-center bg-white/80 backdrop-blur-sm py-2 px-4 rounded-xl shadow-lg">
              <motion.p 
                className="text-gray-600 text-sm md:text-base lg:text-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Your Points
              </motion.p>
              <motion.p 
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-600"
                key={userPoints} // Trigger animation when points change
                initial={{ scale: 1.2, y: -10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {userPoints}
              </motion.p>
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
                style={{ minHeight: '350px' }}
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
                      className="flex items-center justify-between p-2 md:p-3 lg:p-4 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors"
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)"
                      }}
                    >
                      <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
                        <div className="relative">
                          <motion.div 
                            className={`w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-lg md:text-xl lg:text-2xl 
                            ${index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-amber-100' : 'bg-emerald-100'}`}
                            whileHover={{ rotate: [0, -5, 5, -5, 5, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🌟'}
                          </motion.div>
                          {index < 3 && (
                            <motion.div
                              className="absolute -inset-1 rounded-full opacity-30"
                              style={{ 
                                background: index === 0 ? 'radial-gradient(#fde047, transparent 70%)' : 
                                            index === 1 ? 'radial-gradient(#e5e7eb, transparent 70%)' : 
                                            'radial-gradient(#fed7aa, transparent 70%)'
                              }}
                              animate={{ opacity: [0.2, 0.5, 0.2] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-black text-xs md:text-sm lg:text-base">{user.name || user.username}</p>
                          <div className="flex items-center">
                            <motion.span 
                              className="text-xs lg:text-sm text-emerald-600 font-semibold"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 + 0.2 }}
                            >
                              {user.points} points
                            </motion.span>
                            {index === 0 && (
                              <motion.span 
                                className="ml-1 text-yellow-500 text-xs"
                                animate={{ rotate: [0, 10, -10, 10, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                              >
                                👑
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </div>
                      <motion.div 
                        className={`w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-base
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-500' : index === 2 ? 'bg-amber-600' : 'bg-emerald-500'}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {index + 1}
                      </motion.div>
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
              <h3 className="text-sm md:text-base lg:text-lg font-semibold mb-2 md:mb-3 lg:mb-4 flex items-center">
                <motion.span
                  animate={{ rotate: [0, 0, -5, 0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, repeatDelay: 3 }}
                  className="mr-2 text-emerald-500"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 11H5V13H3V11M11 11H13V13H11V11M19 11H21V13H19V11M3 7H5V9H3V7M11 7H13V9H11V7M19 7H21V9H19V7M3 15H5V17H3V15M11 15H13V17H11V15M19 15H21V17H19V15M3 3H9V9H3V3M5 5V7H7V5H5M11 3H17V9H11V3M13 5V7H15V5H13M19 3H21V5H19V3M19 19H21V21H19V19M13 11H15V15H17V11H19V9H15V7H13V9H11V11H13M13 19H17V17H19V15H17V13H15V15H13V19M3 11H9V17H3V11M5 13V15H7V13H5Z" />
                  </svg>
                </motion.span>
                Generate Test QR Code
              </h3>
              <div className="flex flex-col items-center">
                {/* Hidden canvas for QR code generation and download */}
                <canvas ref={canvasRef} className="hidden" width="300" height="300"></canvas>
                
                {testQR && (
                  <>
                    <div className="bg-white p-2 md:p-3 lg:p-4 rounded-lg shadow-md mb-2 md:mb-3 lg:mb-4 relative overflow-hidden">
                      {/* Scanner line animation */}
                      <motion.div 
                        className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 z-10" 
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                      />
                      <img src={testQR} alt="Test QR Code" className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 relative z-0" />
                      
                      {/* Corner markers for QR look */}
                      <div className="absolute top-2 left-2 w-4 h-4 md:w-6 md:h-6 border-t-2 border-l-2 border-emerald-500"></div>
                      <div className="absolute top-2 right-2 w-4 h-4 md:w-6 md:h-6 border-t-2 border-r-2 border-emerald-500"></div>
                      <div className="absolute bottom-2 left-2 w-4 h-4 md:w-6 md:h-6 border-b-2 border-l-2 border-emerald-500"></div>
                      <div className="absolute bottom-2 right-2 w-4 h-4 md:w-6 md:h-6 border-b-2 border-r-2 border-emerald-500"></div>
                    </div>
                    
                    {qrInfo && (
                      <motion.div 
                        className="bg-gray-50 p-2 md:p-2 lg:p-3 rounded-lg mb-2 md:mb-3 lg:mb-4 w-full text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="grid grid-cols-3 gap-1 md:gap-2">
                          <div className="bg-gray-100 p-1 md:p-2 rounded">
                            <p className="text-xs text-gray-500">ID</p>
                            <p className="font-mono text-xs truncate">{qrInfo.itemId}</p>
                          </div>
                          <div className="bg-emerald-50 p-1 md:p-2 rounded">
                            <p className="text-xs text-gray-500">Type</p>
                            <p className="font-medium text-emerald-600 text-xs md:text-sm">{qrInfo.type}</p>
                          </div>
                          <div className="bg-blue-50 p-1 md:p-2 rounded">
                            <p className="text-xs text-gray-500">Points</p>
                            <motion.p 
                              className="font-bold text-blue-600 text-xs md:text-sm"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                            >
                              {qrInfo.points}
                            </motion.p>
                          </div>
                        </div>
                        <motion.div 
                          className="mt-1 md:mt-2 text-xs bg-amber-50 p-1 md:p-2 rounded border border-amber-200 text-amber-800"
                          animate={{ 
                            boxShadow: ['0 0 0 rgba(217, 119, 6, 0)', '0 0 8px rgba(217, 119, 6, 0.3)', '0 0 0 rgba(217, 119, 6, 0)']
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <span className="font-medium">⚠️ One-Time Use Only:</span> This QR code can only be recycled once.
                        </motion.div>
                      </motion.div>
                    )}
                    
                    <motion.button 
                      onClick={handleDownloadQR}
                      className="px-2 py-1 md:px-3 md:py-2 lg:px-4 lg:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mb-2 md:mb-3 lg:mb-4 flex items-center space-x-1 md:space-x-2 text-xs md:text-sm lg:text-base group"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <motion.span
                        animate={{ y: [0, -2, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <FaDownload className="h-3 w-3 lg:h-4 lg:w-4 group-hover:text-blue-200 transition-colors" />
                      </motion.span>
                      <span>Download QR Code</span>
                    </motion.button>
                  </>
                )}
                
                <motion.button
                  onClick={generateTestQR}
                  className="px-2 py-1 md:px-3 md:py-2 lg:px-4 lg:py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-xs md:text-sm lg:text-base"
                  whileHover={{ scale: 1.05, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center justify-center">
                    {testQR ? (
                      <>
                        <motion.svg 
                          className="w-4 h-4 mr-2" 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                        </motion.svg>
                        Generate New QR Code
                      </>
                    ) : (
                      <>
                        <motion.svg 
                          className="w-4 h-4 mr-2" 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <path d="M3 11H5V13H3V11M11 11H13V13H11V11M19 11H21V13H19V11M3 7H5V9H3V7M11 7H13V9H11V7M19 7H21V9H19V7M3 15H5V17H3V15M11 15H13V17H11V15M19 15H21V17H19V15M3 3H9V9H3V3M5 5V7H7V5H5M11 3H17V9H11V3M13 5V7H15V5H13M19 3H21V5H19V3M19 19H21V21H19V19M13 11H15V15H17V11H19V9H15V7H13V9H11V11H13M13 19H17V17H19V15H17V13H15V15H13V19M3 11H9V17H3V11M5 13V15H7V13H5Z" />
                        </motion.svg>
                        Generate QR Code
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 