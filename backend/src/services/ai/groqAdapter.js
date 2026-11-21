const https = require('https');

class GroqAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name = 'Groq (Llama-3.3-70b)';
    this.code = 'groq';
  }

  async generateText(prompt, systemInstruction = 'You are a school communications AI assistant.') {
    if (!this.apiKey) {
      throw new Error('Groq API Key is not configured');
    }

    const payload = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
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
}

module.exports = GroqAdapter;
