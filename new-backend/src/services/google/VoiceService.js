const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const env = require('../../config/env');
const winston = require('winston');

class VoiceService {
  constructor() {
    this.ttsClient = new textToSpeech.TextToSpeechClient({ projectId: env.GOOGLE_PROJECT_ID });
    this.sttClient = new speech.SpeechClient({ projectId: env.GOOGLE_PROJECT_ID });
  }

  isAvailable() {
    return !!env.GOOGLE_PROJECT_ID;
  }

  /**
   * Converts text to high-quality speech.
   * 10x Upgrade: Voice-first accessibility for senior citizens.
   */
  async synthesizeSpeech(text, languageCode = 'hi-IN') {
    try {
      if (!env.GOOGLE_PROJECT_ID) {
        throw new Error('Google Project ID is not configured for Voice services');
      }

      const request = {
        input: { text },
        voice: { languageCode, ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      return response.audioContent; // Returns Buffer
    } catch (error) {
      winston.error(`❌ TTS API Error for [${languageCode}]:`, error.message);
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }

  /**
   * Converts user speech (audio) to text.
   */
  async recognizeSpeech(audioBuffer, languageCode = 'hi-IN') {
    try {
      const request = {
        audio: { content: audioBuffer.toString('base64') },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode,
        },
      };

      const [response] = await this.sttClient.recognize(request);
      return response.results.map(result => result.alternatives[0].transcript).join('\n');
    } catch (error) {
      winston.error('STT API Error:', error.message);
      throw new Error('Speech recognition failed');
    }
  }
}

module.exports = new VoiceService();
