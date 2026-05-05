const EventEmitter = require('events');
const { analyticsEventSchema } = require('../../validators/pubsub.validator');
const winston = require('winston');

class PubSubService extends EventEmitter {
  constructor() {
    super();
    winston.info('📊 Pub/Sub Service initialized in Zero-Cost (Local) mode');
  }

  /**
   * Mock publishing to a local emitter (Zero-Cost)
   */
  async publishEvent(eventData) {
    try {
      const validatedEvent = analyticsEventSchema.parse({
        ...eventData,
        timestamp: new Date().toISOString(),
      });

      // Emit locally instead of cloud
      this.emit('message_received', validatedEvent);

      winston.debug(`[Local Analytics] Event Captured: ${validatedEvent.eventType}`);
      return `local_${Date.now()}`;
    } catch (error) {
      winston.error('Analytics Event Error:', error.message);
      return null;
    }
  }

  /**
   * Initializes a local subscriber (Zero-Cost)
   */
  async initializeSubscriber() {
    this.on('message_received', (data) => {
      winston.info(`📥 Local Analytics Event [${data.eventType}]: Logging to system logs...`);
      // In a real scenario, you could also save this to MongoDB here
    });
    winston.info('✅ Local Analytics Subscriber active');
  }
}

module.exports = new PubSubService();
