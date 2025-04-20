import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import QRGenerator from '../components/QRGenerator';
import { API_BASE_URL, getAuthHeader } from '../config/api';
import { motion } from 'framer-motion';
import { FaQrcode, FaDownload, FaHistory, FaChartBar, FaUsers, FaRecycle } from 'react-icons/fa';

const AdminPage = () => {
  const [itemType, setItemType] = useState('plastic');
  const [generatedQR, setGeneratedQR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [stats, setStats] = useState({
    totalQRCodes: 0,
    recyclableItems: 0,
    activeUsers: 0,
    recycledItems: 0
  });
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API calls in a real implementation
        // For now, using mock data
        setStats({
          totalQRCodes: 157,
          recyclableItems: 89,
          activeUsers: 42,
          recycledItems: 68
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  // Fetch QR code generation history
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      // This would be replaced with an actual API call
      // For now, using mock data
      setTimeout(() => {
        setHistory([
          { id: 'qr123', type: 'plastic', points: 5, date: '2023-11-10', used: true },
          { id: 'qr124', type: 'glass', points: 8, date: '2023-11-11', used: false },
          { id: 'qr125', type: 'paper', points: 3, date: '2023-11-12', used: false },
          { id: 'qr126', type: 'electronics', points: 15, date: '2023-11-13', used: true },
          { id: 'qr127', type: 'tin', points: 6, date: '2023-11-14', used: false },
        ]);
        setHistoryLoading(false);
      }, 800);
    } catch (error) {
      toast.error("Failed to load history");
      setHistoryLoading(false);
    }
  };

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/items/generate-qr`, 
        { type: itemType },
        { headers: getAuthHeader() }
      );
      setGeneratedQR(response.data);
      toast.success('QR code generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error generating QR code');
    }
    setLoading(false);
  };

  const getPointsForItemType = (type) => {
    const pointsMap = {
      'plastic': 5,
      'glass': 8,
      'paper': 3,
      'tin': 6,
      'electronics': 15,
      'other': 4
    };
    return pointsMap[type] || 4;
  };

  const getItemTypeColor = (type) => {
    const colorMap = {
      'plastic': 'bg-blue-500',
      'glass': 'bg-purple-500',
      'paper': 'bg-yellow-500',
      'tin': 'bg-gray-500',
      'electronics': 'bg-red-500',
      'other': 'bg-green-500'
    };
    return colorMap[type] || 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-6 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-emerald-100 mt-1">Manage recyclable items and QR codes</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            title="Total QR Codes" 
            value={stats.totalQRCodes} 
            icon={<FaQrcode />} 
            color="bg-blue-500" 
          />
          <StatsCard 
            title="Recyclable Items" 
            value={stats.recyclableItems} 
            icon={<FaRecycle />} 
            color="bg-green-500" 
          />
          <StatsCard 
            title="Active Users" 
            value={stats.activeUsers} 
            icon={<FaUsers />} 
            color="bg-purple-500" 
          />
          <StatsCard 
            title="Recycled Items" 
            value={stats.recycledItems} 
            icon={<FaChartBar />} 
            color="bg-amber-500" 
          />
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-t-lg shadow-md p-4 flex flex-wrap">
          <TabButton 
            active={activeTab === 'generate'} 
            onClick={() => setActiveTab('generate')}
            icon={<FaQrcode />}
            text="Generate QR" 
          />
          <TabButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            icon={<FaHistory />}
            text="QR History" 
          />
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-md p-6 mb-6">
          {activeTab === 'generate' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col md:flex-row gap-8"
            >
              {/* QR Code Generator Form */}
              <div className="w-full md:w-1/2">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FaQrcode className="mr-2 text-emerald-600" />
                  Generate New QR Code
                </h2>
                
                <form onSubmit={handleGenerateQR} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                    <div className="relative">
                      <select 
                        className="w-full p-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                        value={itemType}
                        onChange={(e) => setItemType(e.target.value)}
                      >
                        <option value="plastic">Plastic (5 points)</option>
                        <option value="tin">Tin (6 points)</option>
                        <option value="paper">Paper (3 points)</option>
                        <option value="glass">Glass (8 points)</option>
                        <option value="electronics">Electronics (15 points)</option>
                        <option value="other">Other (4 points)</option>
                      </select>
                      <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <motion.button 
                      type="submit" 
                      className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow transition-colors flex items-center justify-center space-x-2"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <FaQrcode />
                          <span>Generate QR Code</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Item Type Preview */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Item Type:</h3>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full ${getItemTypeColor(itemType)} flex items-center justify-center text-white`}>
                        <FaRecycle />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900 capitalize">{itemType}</p>
                        <p className="text-sm text-gray-500">{getPointsForItemType(itemType)} points per item</p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* QR Code Display */}
              <div className="w-full md:w-1/2">
                {generatedQR ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center bg-white p-6 rounded-xl border border-gray-200 shadow-md"
                  >
                    <QRGenerator data={generatedQR.qrCode} />
                    
                    <div className="w-full mt-6 grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Item ID</p>
                        <p className="font-mono font-medium text-gray-800 truncate text-sm">{generatedQR.itemId}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Type</p>
                        <p className={`font-medium capitalize ${getItemTypeColor(generatedQR.type)} text-white px-2 py-1 rounded text-xs inline-block`}>
                          {generatedQR.type}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Points</p>
                        <p className="font-bold text-emerald-600">{generatedQR.points}</p>
                      </div>
                    </div>
                    
                    <div className="w-full mt-4">
                      <motion.button
                        onClick={() => {
                          // Download functionality would trigger here
                          toast.success('QR code downloaded');
                        }}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaDownload />
                        <span>Download QR Code</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl w-full">
                      <FaQrcode className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No QR Code Generated</h3>
                      <p className="mt-1 text-sm text-gray-500">Select an item type and click generate to create a new QR code.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaHistory className="mr-2 text-emerald-600" />
                QR Code History
              </h2>
              
              {historyLoading ? (
                <div className="flex justify-center my-12">
                  <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-800">{item.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getItemTypeColor(item.type)}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{item.points}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.used ? (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">Used</span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-2">View</button>
                            {!item.used && (
                              <button className="text-red-600 hover:text-red-900">Deactivate</button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, color }) => {
  return (
    <motion.div 
      className="bg-white rounded-lg shadow p-6"
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center">
        <div className={`rounded-full p-3 text-white ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <motion.p 
            className="text-2xl font-bold text-gray-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, icon, text }) => {
  return (
    <button
      className={`flex items-center mr-4 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-emerald-600 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <span className="mr-2">{icon}</span>
      {text}
    </button>
  );
};

export default AdminPage; 