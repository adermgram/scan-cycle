import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Main Content */}
      <div className="flex-1 p-8">
        {/* Top Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-6 border-b border-gray-200">
            {['Overview', 'Statistics', 'History', 'Reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-4 px-2 text-sm font-medium transition-colors ${
                  activeTab === tab.toLowerCase()
                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-2 gap-8">
          {/* Garbage Bin Visualization */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Recycling Status</h2>
            <div className="relative h-96 flex items-center justify-center">
              {/* Green Garbage Bin */}
              <div className="relative w-48 h-64">
                <div className="absolute bottom-0 w-full h-full bg-emerald-500 rounded-lg shadow-lg">
                  {/* Recycling Symbol */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-white">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                      <path
                        d="M12 4V2M12 4C7.58172 4 4 7.58172 4 12M12 4C16.4183 4 20 7.58172 20 12M12 20V22M12 20C7.58172 20 4 16.4183 4 12M12 20C16.4183 20 20 16.4183 20 12M20 12H22M2 12H4M12 7L9 10H15L12 7ZM12 17L15 14H9L12 17Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {/* Wheels */}
                  <div className="absolute -bottom-1 left-4 w-4 h-4 bg-gray-700 rounded-full"></div>
                  <div className="absolute -bottom-1 right-4 w-4 h-4 bg-gray-700 rounded-full"></div>
                </div>
                {/* Lid */}
                <div className="absolute -top-2 w-full h-4 bg-emerald-600 rounded-t-lg transform origin-bottom transition-transform hover:rotate-45"></div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Activity Score</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Daily recycling</p>
                  <p className="text-2xl font-semibold">1,236 points</p>
                </div>
                <div className="w-24 h-24 rounded-full border-8 border-emerald-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-500">69%</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Plastic</span>
                    <span className="font-medium">8,152/day</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-3/4 bg-emerald-500 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Paper</span>
                    <span className="font-medium">6.4 kg/day</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-1/2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <button 
            onClick={() => navigate('/scanner')}
            className="bg-white rounded-2xl p-6 shadow-lg flex items-center space-x-4 hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-emerald-500 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">QR Code Scanner</h3>
              <p className="text-sm text-gray-500">Scan and identify recyclables</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/leaderboard')}
            className="bg-white rounded-2xl p-6 shadow-lg flex items-center space-x-4 hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-emerald-500 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Leaderboard</h3>
              <p className="text-sm text-gray-500">View recycling rankings</p>
            </div>
          </button>
        </div>
      </div>

      {/* Right Side - User Profile */}
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div>
            <h2 className="font-semibold">John Doe</h2>
            <p className="text-sm text-gray-500">Eco Warrior Level 5</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recycling Score</h3>
            <div className="text-2xl font-semibold">1,236</div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Weekly Goal</h3>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-full w-2/3 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium">66%</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Plastic bottles recycled</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Paper waste recycled</span>
                <span className="font-medium">3.2 kg</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Glass items recycled</span>
                <span className="font-medium">5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 