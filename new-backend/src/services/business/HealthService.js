/**
 * @fileoverview Health Service — monitors system uptime and service health
 */
const mongoose = require('mongoose');
const redis = require('../../config/redis');
const aiOrchestrator = require('../ai/AIOrchestrator');
const translateService = require('../google/TranslateService');
const voiceService = require('../google/VoiceService');
const mapsService = require('../google/MapsService');
const { firebaseInitialized } = require('../../config/firebase');
const env = require('../../config/env');
const { log } = require('../../utils/logger');

class HealthService {
  async getFullStatus() {
    const aiStatus = await aiOrchestrator.getStatus();
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    let redisStatus = 'disconnected';
    try {
      const pong = await redis.ping();
      if (pong === 'PONG') {
        redisStatus = 'connected';
      }
    } catch (err) {
      log.warn('Health Check: Redis ping failed', { error: err.message });
    }

    return {
      success: true,
      status: 'operational',
      version: '2.0.0-supersystem',
      timestamp: new Date().toISOString(),
      ai: aiStatus,
      googleServices: {
        geminiAI: aiStatus.providers?.gemini?.available || false,
        firebaseAuth: firebaseInitialized,
        cloudTranslate: translateService.isAvailable(),
        cloudVoice: voiceService.isAvailable(),
        maps: mapsService.apiKey ? 'configured' : 'missing',
        analytics: true,
      },
      infrastructure: {
        database: { status: dbStatus, type: 'MongoDB' },
        cache: { status: redisStatus, type: 'Redis' },
      },
      environment: env.NODE_ENV,
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };
  }
}

module.exports = new HealthService();
