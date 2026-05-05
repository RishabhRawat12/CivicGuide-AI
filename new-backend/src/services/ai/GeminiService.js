const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../../config/env');
const winston = require('winston');

class GeminiService {
  constructor() {
    this.apiKeys = env.GEMINI_API_KEY ? env.GEMINI_API_KEY.split(',').map(k => k.trim()) : [];
    this.currentKeyIndex = 0;
    this.exhaustedKeys = new Map(); // keyIndex -> expiryTimestamp
    this._initializeModel();
  }

  _initializeModel() {
    if (this.apiKeys.length === 0) {
      winston.warn('⚠️ Gemini API keys not configured');
      return;
    }
    const key = this.apiKeys[this.currentKeyIndex];
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({
      model: env.GEMINI_MODEL || 'gemini-1.5-flash',
    });
  }

  isAvailable() {
    return this.apiKeys.length > 0 && this._getNextAvailableKeyIndex() !== -1;
  }

  _getNextAvailableKeyIndex() {
    const now = Date.now();
    for (let i = 0; i < this.apiKeys.length; i++) {
      const idx = (this.currentKeyIndex + i) % this.apiKeys.length;
      const expiry = this.exhaustedKeys.get(idx);
      if (!expiry || now >= expiry) {
        if (expiry) {this.exhaustedKeys.delete(idx);}
        return idx;
      }
    }
    return -1;
  }

  _rotateKey(errorMsg = '') {
    const now = Date.now();
    // Mark current key as exhausted if it's a rate limit error
    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      winston.warn(`⚠️ Gemini Key #${this.currentKeyIndex + 1} exhausted. Cooling down...`);
      this.exhaustedKeys.set(this.currentKeyIndex, now + 60000); // 1 min cooldown
    }

    const nextIdx = this._getNextAvailableKeyIndex();
    if (nextIdx !== -1) {
      this.currentKeyIndex = nextIdx;
      this._initializeModel();
      winston.info(`🔄 Rotated to Gemini Key #${this.currentKeyIndex + 1}`);
    } else {
      winston.error('❌ All Gemini API keys exhausted');
    }
  }

  async generateStructuredResponse(prompt, systemInstruction, schema, retryCount = 0) {
    if (!this.isAvailable()) {throw new Error('Gemini service unavailable');}

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const response = await result.response;
      const json = JSON.parse(response.text());
      return schema.parse(json);
    } catch (error) {
      if ((error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) && retryCount < this.apiKeys.length) {
        this._rotateKey(error.message);
        return this.generateStructuredResponse(prompt, systemInstruction, schema, retryCount + 1);
      }
      winston.error('Gemini Error:', error.message);
      throw error;
    }
  }

  async generateResponse(message, history = [], retryCount = 0) {
    if (!this.isAvailable()) {throw new Error('Gemini service unavailable');}

    try {
      const chat = this.model.startChat({
        history: history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return { content: response.text(), provider: 'gemini' };
    } catch (error) {
      if ((error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) && retryCount < this.apiKeys.length) {
        this._rotateKey(error.message);
        return this.generateResponse(message, history, retryCount + 1);
      }
      throw error;
    }
  }
}

module.exports = new GeminiService();
