const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // Metadata for analytics/grounding
  metadata: {
    sentiment: String,
    sentimentScore: Number,
    groundingMetadata: mongoose.Schema.Types.Mixed,
    provider: String,
    responseTimeMs: Number,
  },
}, {
  timestamps: true,
});

// CRITICAL: Compound index for efficient context retrieval and preventing COLLSCAN
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
