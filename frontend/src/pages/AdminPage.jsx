import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import QRGenerator from '../components/QRGenerator';
import { API_BASE_URL, getAuthHeader } from '../config/api';

const AdminPage = () => {
  const [itemType, setItemType] = useState('plastic');
  const [generatedQR, setGeneratedQR] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Admin Dashboard - Generate QR Codes</h2>
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleGenerateQR}>
            <div className="mb-3">
              <label className="form-label">Item Type</label>
              <select 
                className="form-select"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
              >
                <option value="plastic">Plastic</option>
                <option value="tin">Tin</option>
                <option value="paper">Paper</option>
                <option value="glass">Glass</option>
                <option value="electronics">Electronics</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </form>

          {generatedQR && (
            <div className="mt-4">
              <h4>Generated QR Code</h4>
              <div className="d-flex flex-column align-items-center">
                <QRGenerator data={generatedQR.qrCode} />
                <div className="mt-3">
                  <p><strong>Item ID:</strong> {generatedQR.itemId}</p>
                  <p><strong>Type:</strong> {generatedQR.type}</p>
                  <p><strong>Points:</strong> {generatedQR.points}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 