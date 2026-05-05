const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  answers: [{
    questionId: Number,
    selectedAnswer: Number,
    correct: Boolean,
  }],
  completedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('QuizResult', quizResultSchema);
