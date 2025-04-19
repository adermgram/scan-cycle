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
    enum: ['plastic', 'paper', 'glass', 'metal', 'electronics', 'other']
  },
  points: {
    type: Number,
    required: true,
    default: 10
  },
  qrCode: {
    type: String,
    required: true
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