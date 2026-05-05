const winston = require('winston');
const env = require('../../config/env');

class MistralService {
  constructor() {
    this.apiKey = env.MISTRAL_API_KEY;
    this.model = env.MISTRAL_MODEL || 'mistral-small-latest';
    this.baseUrl = 'https://api.mistral.ai/v1/chat/completions';
    this.timeout = parseInt(env.MISTRAL_TIMEOUT) || 20000;
  }

  isAvailable() {
    return !!this.apiKey && this.apiKey !== 'your_mistral_api_key_here';
  }

  async generate(prompt, systemPrompt = '') {
    if (!this.isAvailable()) {
      throw new Error('Mistral API key not configured');
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        provider: 'mistral',
        model: this.model,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      winston.error('Mistral Service Error:', error.message);
      throw error;
    }
  }
}

module.exports = new MistralService();
