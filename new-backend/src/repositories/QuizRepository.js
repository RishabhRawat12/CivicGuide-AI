/**
 * @fileoverview Quiz Repository
 */
const QuizResult = require('../models/QuizResult');

class QuizRepository {
  async createResult(resultData) {
    return await QuizResult.create(resultData);
  }

  async findByUid(uid) {
    return await QuizResult.find({ uid }).sort({ timestamp: -1 });
  }

  async getLatestResult(uid) {
    return await QuizResult.findOne({ uid }).sort({ timestamp: -1 });
  }
}

module.exports = new QuizRepository();
