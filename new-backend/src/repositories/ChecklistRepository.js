/**
 * @fileoverview Checklist Repository
 */
const Checklist = require('../models/Checklist');

class ChecklistRepository {
  async findByUid(uid) {
    return await Checklist.findOne({ uid });
  }

  async create(uid, items) {
    return await Checklist.create({ uid, items });
  }

  async updateItems(uid, items) {
    return await Checklist.findOneAndUpdate(
      { uid },
      { $set: { items } },
      { new: true, upsert: true },
    );
  }
}

module.exports = new ChecklistRepository();
