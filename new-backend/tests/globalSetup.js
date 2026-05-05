module.exports = async () => {
  console.log('\n🧪 CivicGuide AI: Test suite starting...');
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5003';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.GOOGLE_PROJECT_ID = 'test-project';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.GCS_BUCKET_NAME = 'test-bucket';
  process.env.PUBSUB_ANALYTICS_TOPIC = 'test-topic';
  process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
  process.env.COOKIE_SECRET = 'test-cookie-secret-at-least-32-characters-long';
};

