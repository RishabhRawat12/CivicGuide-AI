/**
 * @fileoverview User Service — handles user profile and readiness scoring
 */
const userRepository = require('../../repositories/UserRepository');
const civicService = require('./CivicService');
const { log } = require('../../utils/logger');

class UserService {
  async getOrCreateUser(uid, email, name, avatar) {
    let user = await userRepository.findByUid(uid);
    if (!user) {
      user = await userRepository.create({
        uid,
        email,
        name,
        avatar,
        profileCompleted: false,
        authProvider: 'firebase',
      });

      // Auto-create checklist on user initialization
      await civicService.getChecklist(uid).catch(err => {
        log.error('Failed to auto-create checklist', { error: err.message, uid });
      });
    }
    return user;
  }

  async updateProfile(uid, profileData) {
    const age = profileData.age;
    const isFirstTimeVoter = profileData.isFirstTimeVoter !== undefined
      ? profileData.isFirstTimeVoter
      : (age <= 21);

    const updatedData = {
      ...profileData,
      isFirstTimeVoter,
      profileCompleted: true,
      readinessScore: this._calculateReadiness({ ...profileData, age }),
    };

    return await userRepository.updateByUid(uid, updatedData);
  }

  _calculateReadiness(profile) {
    let score = 0;
    if (profile.voterStatus === 'registered') {
      score += 30;
    } else if (profile.voterStatus === 'applied') {
      score += 15;
    }

    if (profile.hasVoterId) {
      score += 25;
    }
    if (profile.age >= 18) {
      score += 10;
    }
    if (profile.pincode) {
      score += 5;
    }

    return score;
  }
}

module.exports = new UserService();
