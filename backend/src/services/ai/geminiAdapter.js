const https = require('https');

class GeminiAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name = 'Google Gemini (Gemini Flash)';
    this.code = 'gemini';
  }

  async generateText(prompt, systemInstruction = 'You are a helpful school communication and homework assistant.') {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is not configured');
    }

    const payload = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nUser request: ${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
              const output = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
              resolve(output.trim());
            } catch (err) {
              reject(new Error(`Gemini JSON parse error: ${err.message}`));
            }
          } else {
            reject(new Error(`Gemini API returned status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (e) => reject(new Error(`Gemini request failed: ${e.message}`)));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Gemini request timed out'));
      });
      req.write(payload);
      req.end();
    });
  }
}

module.exports = GeminiAdapter;
