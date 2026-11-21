const https = require('https');

class NvidiaAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name = 'NVIDIA Nemotron AI';
    this.code = 'nvidia';
  }

  async _call(hostname, path, model, prompt, systemInstruction) {
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
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Length': Buffer.byteLength(payload),
      };

      if (hostname.includes('openrouter')) {
        headers['HTTP-Referer'] = 'https://schoolconnect.io';
        headers['X-Title'] = 'Smart School Connect';
      }

      const options = {
        hostname,
        path,
        method: 'POST',
        headers,
        timeout: 12000,
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
              reject(new Error(`NVIDIA Nemotron JSON parse error: ${err.message}`));
            }
          } else {
            reject(new Error(`NVIDIA API returned status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (e) => reject(new Error(`NVIDIA request failed: ${e.message}`)));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('NVIDIA request timed out'));
      });
      req.write(payload);
      req.end();
    });
  }

  async generateText(prompt, systemInstruction = 'You are a school communications AI assistant.') {
    if (!this.apiKey) {
      throw new Error('NVIDIA API Key is not configured');
    }

    const isOpenRouter = this.apiKey.startsWith('sk-or-v1-') || this.apiKey.includes('openrouter');
    const hostname = isOpenRouter ? 'openrouter.ai' : 'integrate.api.nvidia.com';
    const path = isOpenRouter ? '/api/v1/chat/completions' : '/v1/chat/completions';

    const candidateModels = isOpenRouter
      ? [
          process.env.NVIDIA_MODEL,
          'nvidia/nemotron-3.5-lightning',
          'nvidia/nemotron-3.5-lightning:free',
          'nvidia/nemotron-3-nano-30b-a3b',
        ].filter(Boolean)
      : [
          process.env.NVIDIA_MODEL,
          'nvidia/nemotron-3.5-lightning',
          'meta/llama-3.1-70b-instruct',
        ].filter(Boolean);

    let lastError = null;
    for (const model of candidateModels) {
      try {
        const text = await this._call(hostname, path, model, prompt, systemInstruction);
        return text;
      } catch (err) {
        lastError = err;
        if (err.message.includes('404') || err.message.includes('410') || err.message.includes('no provider')) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('All NVIDIA Nemotron candidate models failed');
  }
}

module.exports = NvidiaAdapter;
