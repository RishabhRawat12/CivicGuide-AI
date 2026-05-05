const redis = require('../../config/redis');
const { admin } = require('../../config/firebase');

class AuthService {
  /**
   * Revokes a token by adding it to the Redis denylist.
   * Sets TTL based on the token's remaining lifespan to prevent memory leaks.
   */
  async revokeToken(token) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const now = Math.floor(Date.now() / 1000);
      const remainingTime = decodedToken.exp - now;

      if (remainingTime > 0) {
        // Use Redis TTL to automatically expire the denylist entry
        await redis.set(`revoked_token:${token}`, 'true', 'EX', remainingTime);
      }
      return true;
    } catch (error) {
      return false; // Token already invalid or expired
    }
  }
}

module.exports = new AuthService();
