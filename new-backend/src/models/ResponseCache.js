const mongoose = require('mongoose');

const ResponseCacheSchema = new mongoose.Schema({
  promptHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  response: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ResponseCache', ResponseCacheSchema);

