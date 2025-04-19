const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const QRCode = require('qrcode');
const Item = require('../models/Item');
const User = require('../models/User');

// Generate QR code for a new recyclable item
router.post('/generate-qr', auth, async (req, res) => {
  try {
    const { type } = req.body;
    
    // Create a unique item ID
    const itemId = Date.now().toString() + Math.random().toString(36).substring(2, 8);
    
    // Create QR code data
    const qrData = JSON.stringify({
      itemId,
      timestamp: new Date().toISOString()
    });
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    
    // Create new item in database
    const item = new Item({
      itemId,
      type,
      qrCode: qrData
    });
    
    await item.save();
    
    res.json({
      itemId,
      qrCode: qrCodeDataUrl,
      type
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating QR code', error: error.message });
  }
});

// Validate a scanned QR code
router.post('/validate-qr', auth, async (req, res) => {
  try {
    const { qrData } = req.body;
    
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
router.get('/', auth, async (req, res) => {
  try {
    // In a real app, you would check if the user is an admin
    const items = await Item.find({})
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

module.exports = router; 