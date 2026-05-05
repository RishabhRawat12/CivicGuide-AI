const language = require('@google-cloud/language');
const winston = require('winston');

class NLPService {
  constructor() {
    this.client = new language.LanguageServiceClient();
  }

  async analyzeSentiment(text) {
    try {
      const document = {
        content: text,
        type: 'PLAIN_TEXT',
      };

      const [result] = await this.client.analyzeSentiment({ document });
      const sentiment = result.documentSentiment;

      return {
        score: sentiment.score,
        magnitude: sentiment.magnitude,
        label: sentiment.score > 0.2 ? 'positive' : sentiment.score < -0.2 ? 'negative' : 'neutral',
      };
    } catch (error) {
      winston.error('NLP Sentiment Error:', error.message);
      return { score: 0, magnitude: 0, label: 'neutral' };
    }
  }

  async classifyContent(text) {
    if (text.length < 20) {return [];}
    try {
      const document = { content: text, type: 'PLAIN_TEXT' };
      const [result] = await this.client.classifyText({ document });
      return (result.categories || []).map(cat => ({
        name: cat.name,
        confidence: cat.confidence,
      }));
    } catch (error) {
      winston.error('NLP Classification Error:', error.message);
      return [];
    }
  }

  async extractEntities(text) {
    try {
      const document = { content: text, type: 'PLAIN_TEXT' };
      const [result] = await this.client.analyzeEntities({ document });
      return (result.entities || []).map(entity => ({
        name: entity.name,
        type: entity.type,
        salience: entity.salience,
      }));
    } catch (error) {
      winston.error('NLP Entity Error:', error.message);
      return [];
    }
  }
}

module.exports = new NLPService();
