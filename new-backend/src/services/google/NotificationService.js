const { admin } = require('../firebase');
const winston = require('winston');

class NotificationService {
  /**
   * Sends a proactive push notification to a user.
   * 10x Upgrade: Proactive civic reminders for registration deadlines.
   */
  async sendDeadlineReminder(token, state, deadlineType) {
    return this.sendNotification(token, {
      title: `🗳️ Important Deadline for ${state}!`,
      body: `The deadline for ${deadlineType} is approaching. Don't lose your chance to vote!`,
      data: { type: 'deadline', state },
    });
  }

  async sendAIInsight(token, insight) {
    return this.sendNotification(token, {
      title: '🤖 Civic Insight for You',
      body: insight,
      data: { type: 'insight' },
    });
  }

  async sendNotification(token, { title, body, data = {} }) {
    try {
      if (!admin) {throw new Error('Firebase Admin not initialized');}

      const message = {
        notification: { title, body },
        data,
        token,
      };

      const response = await admin.messaging().send(message);
      winston.info(`✅ Successfully sent FCM message to ${token}`);
      return response;
    } catch (error) {
      winston.error('❌ FCM Error:', error.message);
      return null;
    }
  }
}

module.exports = new NotificationService();
