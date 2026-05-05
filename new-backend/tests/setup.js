const mongoose = require('mongoose');
const winston = require('winston');

// 1. Mock Redis (ioredis-mock)
const RedisMock = require('ioredis-mock');
const mockRedisInstance = new RedisMock();
mockRedisInstance.status = 'ready'; // Crucial for middleware checks
mockRedisInstance.call = jest.fn(); 
jest.mock('ioredis', () => jest.fn(() => mockRedisInstance));



// 2. Mock Firebase Admin
const mockFirebase = {
  verifyIdToken: jest.fn().mockResolvedValue({ 
    uid: 'test-uid-123', 
    email: 'test@test.com',
    name: 'Test User',
    picture: 'https://avatar.url',
    exp: Math.floor(Date.now() / 1000) + 3600
  }),
  getUser: jest.fn().mockResolvedValue({ uid: 'test-uid-123', displayName: 'Test User' }),
  createCustomToken: jest.fn().mockResolvedValue('mock-custom-token'),
};

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  auth: () => mockFirebase,
}));

global.mockFirebaseAuth = mockFirebase;

// 3. Mock AI & Google Services
jest.mock('../src/services/ai/MistralService', () => ({
  isAvailable: jest.fn().mockReturnValue(true),
  generate: jest.fn().mockResolvedValue({ content: 'Mock Mistral Response', provider: 'mistral' }),
}));

jest.mock('../src/services/ai/GeminiService', () => ({
  isAvailable: jest.fn().mockReturnValue(true),
  generateResponse: jest.fn().mockResolvedValue({ content: 'Mock Gemini Response', provider: 'gemini' }),
  generateStructuredResponse: jest.fn().mockResolvedValue({ 
    steps: [
      { number: 1, title: 'Check Eligibility', description: 'Ensure 18+', resource: 'https://voters.eci.gov.in/', estimatedTime: '5 mins' }
    ], 
    score: 85, 
    breakdown: {
      registration: { score: 90, status: 'Done' },
      documents: { score: 80, status: 'Pending' },
      awareness: { score: 85, status: 'Good' }
    },
    tips: ['Register early'],
    questions: [
      { question: 'Test?', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: 'OK', didYouKnow: 'Yes' }
    ],
    events: [
      { date: '2024-05-01', title: 'Registration Deadline', description: 'Last day to register', importance: 'high' }
    ],
    summary: 'Mocked Summary',
    nextAction: 'Mocked Next Action',
    title: 'Mocked Title',
    description: 'Mocked Desc',
    reasoning: 'Personalized.',
    confidenceScore: 95
  }),
}));

// Mock @google-cloud/aiplatform
jest.mock('@google-cloud/aiplatform', () => ({
  PredictionServiceClient: jest.fn(() => ({
    predict: jest.fn().mockResolvedValue([{ predictions: [{ content: 'Mocked', safetyAttributes: { scores: [0.1] } }] }]),
  })),
  helpers: { toValue: jest.fn(v => v), fromValue: jest.fn(v => v) },
}), { virtual: true });

// Mock @google-cloud/translate
jest.mock('@google-cloud/translate', () => ({
  TranslationServiceClient: jest.fn(() => ({
    detectLanguage: jest.fn().mockResolvedValue([{ languages: [{ languageCode: 'en' }] }]),
    translateText: jest.fn().mockResolvedValue([{ translations: [{ translatedText: 'Translated' }] }]),
  })),
}), { virtual: true });

// Mock Winston/Logger
winston.add(new winston.transports.Console({ silent: true }));
jest.mock('../src/utils/logger', () => ({
  log: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
  storage: { getStore: jest.fn().mockReturnValue('test-id'), run: (id, fn) => fn() },
}));

// 4. OFFLINE MOCK FOR DATABASE
// We mock mongodb-memory-server to prevent downloads
jest.mock('mongodb-memory-server', () => ({
  MongoMemoryServer: {
    create: jest.fn().mockResolvedValue({
      getUri: jest.fn().mockReturnValue('mongodb://mock-uri'),
      stop: jest.fn().mockResolvedValue(true),
    }),
  },
}));

// Mock mongoose connection to avoid real network calls
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  const connection = {
    ...actualMongoose.connection,
    db: { collection: jest.fn(() => ({ deleteMany: jest.fn() })) },
    collections: {},
  };
  
  Object.defineProperty(connection, 'readyState', {
    get: jest.fn(() => 1), // Default to connected
    configurable: true
  });

  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    connection,
  };
});

// 5. Mock Mongoose Models
const createMockModel = (defaultResponse = null) => {
  const mock = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    create: jest.fn().mockImplementation(data => Promise.resolve({ _id: 'mock-id', ...data })),
    save: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(defaultResponse),
    deleteMany: jest.fn().mockResolvedValue({}),
    // Support direct await
    then: function(resolve) { return Promise.resolve(this.exec()).then(resolve); },
  };
  
  mock.findOne.mockImplementation(() => {
    const findOneMock = { 
      ...mock, 
      then: function(resolve) { return Promise.resolve(this.exec()).then(resolve); }
    };
    return findOneMock;
  });

  return mock;
};


// ─── Google Services Mocks ────────────────────────────────
jest.mock('../src/services/google/TranslateService', () => ({
  isAvailable: jest.fn().mockReturnValue(true),
  detectLanguage: jest.fn().mockResolvedValue({ language: 'en' }),
  translateText: jest.fn().mockImplementation((text, lang) => Promise.resolve({ translatedText: `Translated to ${lang}: ${text}` })),
}));

jest.mock('../src/services/google/NlpService', () => ({
  isAvailable: jest.fn().mockReturnValue(true),
  analyzeSentiment: jest.fn().mockResolvedValue({ score: 0.5, label: 'positive' }),
  classifyContent: jest.fn().mockResolvedValue([]),
  extractEntities: jest.fn().mockResolvedValue([]),
}));

jest.mock('../src/services/google/VoiceService', () => ({
  isAvailable: jest.fn().mockReturnValue(true),
  synthesizeSpeech: jest.fn().mockResolvedValue(Buffer.from('mock-audio')),
  recognizeSpeech: jest.fn().mockResolvedValue('Mock transcript'),
}));

jest.mock('../src/services/google/MapsService', () => ({
  isAvailable: jest.fn().mockReturnValue(true),
  getBoothFromPincode: jest.fn().mockResolvedValue({ name: 'Mock Booth', address: '123 Street' }),
}));

jest.mock('../src/services/google/PubSubService', () => ({
  publishEvent: jest.fn().mockResolvedValue(true),
}));

// ─── Model Mocks ─────────────────────────────────────────
const mockGeneric = createMockModel([]);
const mockUser = createMockModel({ 
  uid: 'test-uid-123', 
  email: 'test@test.com', 
  name: 'Test User',
  age: 20,
  state: 'Delhi',
  voterStatus: 'not_registered'
});
const mockChecklist = createMockModel({ uid: 'test-uid-123', items: [] });
const mockResponseCache = createMockModel(null);

jest.mock('../src/models/User', () => mockUser);
jest.mock('../src/models/Checklist', () => mockChecklist);
jest.mock('../src/models/ChatMessage', () => createMockModel([]));
jest.mock('../src/models/QueryLog', () => mockGeneric);
jest.mock('../src/models/QuizResult', () => mockGeneric);
jest.mock('../src/models/ResponseCache', () => mockResponseCache);

global.mockModel = mockGeneric;
global.userMock = mockUser;
global.checklistMock = mockChecklist;



beforeAll(async () => {

  // No-op due to mocks
});

afterAll(async () => {
  // No-op due to mocks
});

afterEach(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
