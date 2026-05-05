const express = require('express');
const router = express.Router();
const civicController = require('../controllers/civic.controller');
const analyticsController = require('../controllers/analytics.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { aiLimiter } = require('../../middlewares/rateLimiter.middleware');
const { validate } = require('../../middlewares/validator.middleware');
const {
  translateSchema,
  boothGuidanceSchema,
  updateChecklistSchema,
  saveQuizResultSchema,
} = require('../../validators/civic.validator');

router.use(protect); // All civic routes require auth

// Journey, Readiness, Quiz, Timeline
router.get('/journey', aiLimiter, civicController.getJourney);
router.get('/readiness', aiLimiter, civicController.getReadiness);
router.get('/quiz', aiLimiter, civicController.getQuiz);
router.get('/timeline', aiLimiter, civicController.getTimeline);

// Scenarios
router.get('/scenarios', aiLimiter, civicController.getScenarios);
router.get('/scenario/:type', aiLimiter, civicController.simulateScenario);

// Translation & Voice (Accessibility)
router.post('/translate', aiLimiter, validate(translateSchema), civicController.translate);
router.post('/speech/synthesize', aiLimiter, civicController.synthesize);
router.post('/speech/recognize', aiLimiter, civicController.recognizeSpeech);

// Checklist & Quiz
router.get('/checklist', aiLimiter, civicController.getChecklist);
router.post('/checklist/update', aiLimiter, validate(updateChecklistSchema), civicController.updateChecklist);
router.get('/quiz/results', aiLimiter, civicController.getQuizResults);
router.post('/quiz/results', aiLimiter, validate(saveQuizResultSchema), civicController.saveQuizResult);

// Booth
router.post('/booth', aiLimiter, validate(boothGuidanceSchema), civicController.getBoothGuide);

// Analytics & Personalization
router.get('/analytics/insights', analyticsController.getUserInsights);
router.get('/analytics/recommendations', analyticsController.getRecommendations);
router.get('/analytics/stats', analyticsController.getGlobalStats);

module.exports = router;
