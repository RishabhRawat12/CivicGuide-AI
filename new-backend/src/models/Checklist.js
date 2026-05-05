const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

const checklistSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: true,
  },
  items: [checklistItemSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Checklist', checklistSchema);
