const fs = require('fs');
const path = require('path');
const winston = require('winston');

class StorageService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    this._ensureDir();
    winston.info(`📂 StorageService initialized in Zero-Cost (Local) mode at: ${this.uploadDir}`);
  }

  _ensureDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Uploads an avatar to the local filesystem (Zero-Cost).
   * @param {string} uid - User ID
   * @param {Buffer} buffer - Image data
   * @param {string} mimeType - Image MIME type
   * @returns {Promise<string>} Public URL for the avatar
   */
  async uploadAvatar(uid, buffer, mimeType) {
    try {
      const ext = mimeType.split('/')[1] || 'jpg';
      const fileName = `${uid}_${Date.now()}.${ext}`;
      const filePath = path.join(this.uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      // Return a relative URL that the frontend can use
      // Assumes /uploads is served as static in app.js
      return `/uploads/avatars/${fileName}`;
    } catch (error) {
      winston.error('Local Upload Error:', error.message);
      throw new Error('Failed to upload image locally');
    }
  }
}

module.exports = new StorageService();
