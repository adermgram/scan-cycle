import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { QrReader } from 'react-qr-reader';
import { API_BASE_URL, getAuthHeader } from '../config/api';

const Scanner = () => {
  const [scannedItems, setScannedItems] = useState([]);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const handleScan = useCallback(async (result) => {
    if (result) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/items/validate-qr`, {
          method: 'POST',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ qrData: result.text })
        });

        if (!response.ok) {
          throw new Error('Failed to validate QR code');
        }

        const data = await response.json();
        const mockItem = {
          id: Date.now(),
          type: data.itemType || 'Plastic Bottle',
          points: data.points || 10,
          image: '/bottle-icon.svg'
        };
        
        setScannedItems(prev => [...prev, mockItem]);
        
        // Animate the item being added to container
        if (containerRef.current) {
          const newItem = document.createElement('div');
          newItem.className = 'absolute w-12 h-12 bg-contain bg-center bg-no-repeat animate-drop';
          newItem.style.backgroundImage = `url(${mockItem.image})`;
          newItem.style.left = `${Math.random() * 80}%`;
          containerRef.current.appendChild(newItem);
        }
      } catch (error) {
        console.error('Error parsing QR code:', error);
      }
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Camera View */}
      <div className="absolute inset-0">
        <QrReader
          onResult={handleScan}
          constraints={{
            facingMode: 'environment'
          }}
          className="w-full h-full"
          videoStyle={{ objectFit: 'cover' }}
        />
      </div>

      {/* Scanning Interface */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top Section - Header */}
        <div className="p-4 bg-black/50 backdrop-blur-sm">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Middle Section - Scan Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-64 h-64">
            {/* Scanner Target */}
            <div className="absolute inset-0 border-2 border-emerald-500">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500"></div>
            </div>
            
            {/* Scanning Animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="w-full h-1 bg-emerald-500/50 animate-scan"></div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Container */}
        <div className="p-4 bg-black/50 backdrop-blur-sm">
          <div 
            ref={containerRef}
            className="relative mx-auto w-full max-w-md h-32 border-2 border-dashed border-emerald-500/50 rounded-xl bg-black/30 backdrop-blur-sm overflow-hidden"
          >
            {scannedItems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-emerald-500/70">
                Scan items to add them to the container
              </div>
            )}
            {scannedItems.map((item, index) => (
              <div
                key={item.id}
                className="absolute bottom-4 left-4 flex items-center space-x-2 bg-white/20 backdrop-blur-lg rounded-lg px-3 py-2"
                style={{ left: `${index * 120}px` }}
              >
                <img src={item.image} alt={item.type} className="w-8 h-8" />
                <div className="text-white">
                  <div className="text-sm font-medium">{item.type}</div>
                  <div className="text-xs opacity-75">+{item.points} points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner; 