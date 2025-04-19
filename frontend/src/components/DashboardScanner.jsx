import React, { useCallback } from 'react';
import { QrReader } from 'react-qr-reader';

const DashboardScanner = ({ onScanComplete }) => {
  const handleScan = useCallback((result) => {
    if (result) {
      try {
        const data = JSON.parse(result?.text || '{}');
        // Process the scanned data
        console.log('Scanned data:', data);
        // Call the callback to close scanner and update points
        onScanComplete(data);
      } catch (error) {
        console.error('Error parsing QR code:', error);
      }
    }
  }, [onScanComplete]);

  return (
    <div className="relative w-full h-[400px] bg-black rounded-xl overflow-hidden">
      {/* Camera View */}
      <div className="absolute inset-0">
        <QrReader
          onResult={handleScan}
          constraints={{
            facingMode: ''
          }}
          className="w-full h-full"
          videoStyle={{ objectFit: 'cover' }}
        />
      </div>

      {/* Scanning Interface */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Scan Area */}
        <div className="relative w-48 h-48">
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

      {/* Instructions */}
      <div className="absolute bottom-0 inset-x-0 p-4 text-center text-white bg-black/50 backdrop-blur-sm">
        Position the QR code within the frame to scan
      </div>
    </div>
  );
};

export default DashboardScanner; 