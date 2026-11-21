const https = require('https');

class GroqAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name = 'Groq Cloud AI';
    this.code = 'groq';
  }

  async _callGroq(model, prompt, systemInstruction) {
    const payload = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(data);
              const output = json.choices?.[0]?.message?.content || '';
              resolve(output.trim());
            } catch (err) {
              reject(new Error(`Groq JSON parse error: ${err.message}`));
            }
          } else {
            reject(new Error(`Groq API returned status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (e) => reject(new Error(`Groq request failed: ${e.message}`)));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Groq request timed out'));
      });
      req.write(payload);
      req.end();
    });
  }

  async generateText(prompt, systemInstruction = 'You are a school communications AI assistant.') {
    if (!this.apiKey) {
      throw new Error('Groq API Key is not configured');
    }

    const candidateModels = [
      process.env.GROQ_MODEL,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama3-70b-8192',
      'qwen/qwen3.8-27b',
    ].filter(Boolean);

    let lastError = null;
    for (const model of candidateModels) {
      try {
        const result = await this._callGroq(model, prompt, systemInstruction);
        return result;
      } catch (err) {
        lastError = err;
        if (err.message.includes('model_not_found') || err.message.includes('404')) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('All Groq candidate models failed');
  }
}

module.exports = GroqAdapter;
