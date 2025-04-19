import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-toastify';

const DashboardScanner = ({ onScanComplete }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const videoContainerRef = useRef(null);

  // Setup available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log('Available cameras:', devices);
        if (devices && devices.length > 0) {
          setCameras(devices);
          setSelectedCamera(devices[0].id);
        } else {
          toast.error('No cameras found on your device');
        }
      } catch (error) {
        console.error('Error getting cameras:', error);
        toast.error('Failed to access cameras. Please check permissions.');
      }
    };

    getCameras();
  }, []);

  // Handle camera change
  const handleCameraChange = (e) => {
    setSelectedCamera(e.target.value);
  };

  // Handle scan success
  const handleScanSuccess = useCallback((decodedText) => {
    if (decodedText) {
      try {
        console.log('Raw QR data:', decodedText);
        
        // Parse the QR code data (format: itemId|type|points)
        const parts = decodedText.split('|');
        
        if (parts.length !== 3) {
          throw new Error('Invalid QR code format. Expected format: itemId|type|points');
        }
        
        const [itemId, type, points] = parts;
        
        if (!itemId || !type || !points) {
          throw new Error('Invalid QR code: Missing required data');
        }

        // Process the scanned data
        console.log('Parsed data:', { itemId, type, points });
        
        // Stop the scanner
        if (scannerRef.current) {
          scannerRef.current.stop().catch(error => {
            console.error('Error stopping scanner:', error);
          });
        }
        
        // Call the callback with the parsed data
        onScanComplete({
          itemId,
          type,
          points: parseInt(points)
        });

        // Show success message
        toast.success(`Scanned ${type}! Processing...`);
      } catch (error) {
        console.error('Error parsing QR code:', error);
        toast.error(error.message || 'Invalid QR code format');
      }
    }
  }, [onScanComplete]);

  // Start scanning
  const startScanner = async () => {
    if (!selectedCamera) {
      toast.error('No camera selected');
      return;
    }

    try {
      setScanning(true);
      
      // Create scanner instance
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        handleScanSuccess,
        (errorMessage) => {
          // Don't show error for ongoing scan
          console.log('QR Code scanning ongoing:', errorMessage);
        }
      );
      
      toast.success('Scanner started');
    } catch (error) {
      console.error('Error starting scanner:', error);
      setScanning(false);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Camera access denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('Selected camera not found. Please select a different camera.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Camera is in use by another application. Please close other apps using the camera.');
      } else {
        toast.error(`Failed to start scanner: ${error.message}`);
      }
    }
  };

  // Stop scanning
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
        toast.info('Scanner stopped');
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(error => {
          console.error('Failed to stop scanner on cleanup:', error);
        });
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] bg-gray-900 rounded-xl overflow-hidden">
      {/* QR Reader for Html5Qrcode to attach to */}
      <div id="qr-reader" className="w-full h-full">
        {/* Video will be attached here by Html5Qrcode */}
      </div>
      
      {/* Camera Selection and Controls */}
      <div className="absolute top-0 inset-x-0 p-4 bg-black/70 backdrop-blur-sm space-y-3">
        <select
          value={selectedCamera}
          onChange={handleCameraChange}
          className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-700"
          disabled={scanning}
        >
          {cameras.map(camera => (
            <option key={camera.id} value={camera.id}>
              {camera.label || `Camera ${camera.id}`}
            </option>
          ))}
        </select>
        
        <div className="flex justify-center space-x-4">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              disabled={!selectedCamera}
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Stop Camera
            </button>
          )}
        </div>
      </div>

      {/* Scan Target */}
      {scanning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            {/* Scanner Target */}
            <div className="absolute inset-0 border-2 border-emerald-500">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500"></div>
            </div>
            
            {/* Scanning Animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="w-full h-1 bg-emerald-500/50 animate-scan"></div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-0 inset-x-0 p-4 text-center text-white bg-black/50 backdrop-blur-sm">
        {!scanning 
          ? "Click 'Start Camera' to begin scanning" 
          : "Position the QR code within the frame to scan"}
      </div>
    </div>
  );
};

export default DashboardScanner; 