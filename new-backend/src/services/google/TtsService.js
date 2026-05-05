const { log } = require('../../utils/logger');

class TtsService {
  constructor() {
    log.info('🔊 TtsService initialized in Zero-Cost (Client-Side) mode');
  }

  /**
   * Placeholder for Zero-Cost mode.
   * Frontend will use window.speechSynthesis instead.
   */
  async synthesize(_text, _languageCode) {
    log.warn('⚠️ Server-side TTS called in Zero-Cost mode. This should be handled by the browser.');
    return Buffer.from(''); // Return empty buffer
  }
}

module.exports = new TtsService();
