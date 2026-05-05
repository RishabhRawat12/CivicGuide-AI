/**
 * @fileoverview User Repository — Data access layer for User model
 */
const User = require('../models/User');

class UserRepository {
  async findByUid(uid) {
    return await User.findOne({ uid });
  }

  async create(userData) {
    return await User.create(userData);
  }

  async updateByUid(uid, updateData) {
    return await User.findOneAndUpdate(
      { uid },
      { $set: updateData },
      { new: true, runValidators: true },
    );
  }

  async incrementReadinessScore(uid, amount) {
    return await User.findOneAndUpdate(
      { uid },
      { $inc: { readinessScore: amount } },
      { new: true },
    );
  }
}

module.exports = new UserRepository();
