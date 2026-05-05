const mongoose = require('mongoose');

const queryLogSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: true, // Firebase UID
  },
  query: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    default: '',
  },
  provider: {
    type: String,
    enum: ['gemini', 'mistral', 'cache', 'fallback'],
    default: 'gemini',
  },
  endpoint: {
    type: String,
    enum: ['chat', 'journey', 'scenario', 'booth', 'quiz', 'timeline', 'checklist', 'translate', 'speech'],
    default: 'chat',
  },
  category: {
    type: String,
    default: 'general',
    index: true,
  },
  responseTimeMs: {
    type: Number,
    default: 0,
  },
  cached: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for time-based queries
queryLogSchema.index({ createdAt: -1 });
queryLogSchema.index({ uid: 1, createdAt: -1 });

module.exports = mongoose.model('QueryLog', queryLogSchema);
