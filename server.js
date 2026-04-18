const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.post('/scan', async (req, res) => {
  try {
    const { image, apiKey } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: 'Read this invoice. Return ONLY JSON: {"supplier_name":"","invoice_number":"","date":"DD/MM/YYYY","amount_total":0,"service_description":""}' }
          ]
        }]
      })
    });
    const data = await response.json();
    const text = data.content[0].text.replace(/```json|```/g,'').trim();
    const match = text.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(match[0]));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000);
