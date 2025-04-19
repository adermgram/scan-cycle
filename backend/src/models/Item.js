const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['plastic', 'tin', 'paper', 'glass', 'electronics', 'other']
  },
  points: {
    type: Number,
    required: true,
    default: function() {
      // Set points based on item type
      switch(this.type) {
        case 'plastic':
          return 2;
        case 'tin':
          return 1;
        case 'paper':
          return 1;
        case 'glass':
          return 1;
        case 'electronics':
          return 3;
        default:
          return 1;
      }
    }
  },
  qrCode: {
    type: String,
    required: true
  },
  qrCodeImage: {
    type: String
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to mark an item as used
itemSchema.methods.markAsUsed = async function(userId) {
  if (this.isUsed) {
    throw new Error('Item has already been used');
  }
  
  this.isUsed = true;
  this.usedBy = userId;
  this.usedAt = new Date();
  
  return this.save();
};

const Item = mongoose.model('Item', itemSchema);

module.exports = Item; 