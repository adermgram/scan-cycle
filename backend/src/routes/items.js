const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const QRCode = require('qrcode');
const Item = require('../models/Item');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

// Points configuration for different item types
const ITEM_POINTS = {
  plastic: 2,
  tin: 3,
  paper: 1,
  glass: 4,
  electronics: 5,
  other: 1
};

// Generate QR code for a new recyclable item (admin only)
router.post('/generate-qr', auth, admin, async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ message: 'Item type is required' });
    }

    // Generate a unique item ID using timestamp and random string
    const itemId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    
    // Create a more concise QR code data structure
    const qrData = {
      id: itemId,
      t: type,
      p: ITEM_POINTS[type] || 0
    };

    // Convert to a compact string format
    const qrString = `${qrData.id}|${qrData.t}|${qrData.p}`;
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300
    });

    // Ensure the uploads/qrcodes directory exists
    const uploadsDir = path.join(__dirname, '../../uploads/qrcodes');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save QR code as PNG
    const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
    const qrPath = path.join(uploadsDir, `${itemId}.png`);
    await fs.writeFile(qrPath, qrBuffer);

    res.json({
      itemId,
      type,
      points: ITEM_POINTS[type] || 0,
      qrCode: qrString // Send the compact string instead of the full data URL
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Error generating QR code' });
  }
});

// Validate a scanned QR code
router.post('/validate-qr', auth, async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }
    
    // Parse QR data
    const qrDataObj = JSON.parse(qrData);
    const { itemId } = qrDataObj;
    
    // Find item in database
    const item = await Item.findOne({ itemId });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (item.isUsed) {
      return res.status(400).json({ message: 'Item has already been recycled' });
    }
    
    // Mark item as used
    await item.markAsUsed(req.user._id);
    
    // Update user points
    req.user.points += item.points;
    req.user.recycledItems.push(item._id);
    await req.user.save();
    
    // Check if user has reached a points threshold for a coupon
    // This is a placeholder implementation
    let coupon = null;
    if (req.user.points >= 100 && req.user.points % 100 === 0) {
      // In a real app, you would create a coupon here
      coupon = {
        message: 'Congratulations! You\'ve earned a reward coupon!',
        points: req.user.points
      };
    }
    
    res.json({
      valid: true,
      itemType: item.type,
      points: item.points,
      totalPoints: req.user.points,
      message: 'Item recycled successfully',
      coupon
    });
  } catch (error) {
    res.status(500).json({ message: 'Error validating QR code', error: error.message });
  }
});

// Get all recyclable items (admin only)
router.get('/', [auth, admin], async (req, res) => {
  try {
    const items = await Item.find({})
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

// Get item by ID
router.get('/:itemId', auth, async (req, res) => {
  try {
    const item = await Item.findOne({ itemId: req.params.itemId });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({ item });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
});

// Add this route after your existing routes
router.get('/test-qr', auth, async (req, res) => {
  try {
    // Create a test item
    const testItem = {
      id: 'test-' + Date.now(),
      type: 'plastic',
      points: 2
    };

    // Return the test item data that can be used to generate QR code
    res.json(testItem);
  } catch (error) {
    console.error('Error generating test QR:', error);
    res.status(500).json({ message: 'Error generating test QR code' });
  }
});

module.exports = router; 