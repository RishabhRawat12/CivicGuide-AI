/**
 * @fileoverview Civic Controller — handles election education features
 */
const civicService = require('../../services/business/CivicService');
const scenarioService = require('../../services/business/ScenarioService');
const translateService = require('../../services/google/TranslateService');
const voiceService = require('../../services/google/VoiceService');
const analyticsService = require('../../services/business/AnalyticsService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { log } = require('../../utils/logger');

/** @route GET /api/civic/journey */
const getJourney = asyncHandler(async (req, res) => {
  const data = await civicService.getPersonalizedJourney(req.user.uid);
  res.json({ success: true, data });
});

/** @route GET /api/civic/readiness */
const getReadiness = asyncHandler(async (req, res) => {
  const data = await civicService.getReadinessScore(req.user.uid);
  res.json({ success: true, data });
});

/** @route GET /api/civic/quiz */
const getQuiz = asyncHandler(async (req, res) => {
  const data = await civicService.getQuiz(req.user.uid);
  res.json({ success: true, data });
});

/** @route GET /api/civic/timeline */
const getTimeline = asyncHandler(async (req, res) => {
  const data = await civicService.getTimeline(req.user.uid);
  res.json({ success: true, data });
});

/** @route GET /api/civic/scenarios */
const getScenarios = asyncHandler(async (req, res) => {
  const data = scenarioService.getAvailableScenarios();
  res.json({ success: true, data });
});

/** @route GET /api/civic/scenario/:type */
const simulateScenario = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const data = await scenarioService.simulate(req.user.uid, type);
  res.json({ success: true, data });
});

/** @route POST /api/civic/translate */
const translate = asyncHandler(async (req, res) => {
  const { text, targetLanguage } = req.body;
  const translatedText = await translateService.translateText(text, targetLanguage);
  res.json({ success: true, data: translatedText });
});

/** @route POST /api/civic/speech/synthesize */
const synthesize = asyncHandler(async (req, res) => {
  const { text, languageCode } = req.body;
  const audioContent = await voiceService.synthesizeSpeech(text, languageCode);
  res.set('Content-Type', 'audio/mpeg');
  res.send(audioContent);
});

/** @route POST /api/civic/speech/recognize */
const recognizeSpeech = asyncHandler(async (req, res) => {
  const { audio, languageCode } = req.body;
  const audioBuffer = Buffer.from(audio, 'base64');
  const transcript = await voiceService.recognizeSpeech(audioBuffer, languageCode);
  res.json({ success: true, transcript });
});

/** @route GET /api/civic/checklist */
const getChecklist = asyncHandler(async (req, res) => {
  const data = await civicService.getChecklist(req.user.uid);
  res.json({ success: true, data });
});

/** @route POST /api/civic/checklist/update */
const updateChecklist = asyncHandler(async (req, res) => {
  const data = await civicService.updateChecklist(req.user.uid, req.body.items);
  res.json({ success: true, data });
});

/** @route POST /api/civic/quiz/results */
const saveQuizResult = asyncHandler(async (req, res) => {
  const data = await civicService.saveQuizResult(req.user.uid, req.body);
  res.json({ success: true, data });
});

/** @route GET /api/civic/quiz/results */
const getQuizResults = asyncHandler(async (req, res) => {
  const data = await civicService.getQuizResults(req.user.uid);
  res.json({ success: true, data });
});

/** @route POST /api/civic/booth */
const getBoothGuide = asyncHandler(async (req, res) => {
  const { pincode, location } = req.body;
  // Validation middleware handles the constraints now
  const boothData = await civicService.getBoothGuidance(req.user.uid, pincode, location);
  res.json({ success: true, data: boothData });
});

/** @route GET /api/civic/analytics/stats */
const getGlobalStats = asyncHandler(async (req, res) => {
  const data = await analyticsService.getGlobalStats();
  res.json({ success: true, data });
});

module.exports = {
  getJourney,
  getReadiness,
  getQuiz,
  getTimeline,
  getScenarios,
  simulateScenario,
  translate,
  synthesize,
  recognizeSpeech,
  getChecklist,
  updateChecklist,
  saveQuizResult,
  getQuizResults,
  getBoothGuide,
  getGlobalStats,
};
