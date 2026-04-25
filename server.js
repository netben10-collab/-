const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/scan', async (req, res) => {
  try {
    const { image, apiKey, mediaType = 'image/jpeg' } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image }
            },
            {
              type: 'text',
              text: `Read this Israeli invoice carefully. Extract all available information and return ONLY a valid JSON object with these exact fields:
{
  "supplier_name": "שם הספק כפי שמופיע",
  "invoice_number": "מספר החשבונית",
  "date": "DD/MM/YYYY",
  "amount_total": "הסכום הכולל כולל מעמ - מספר בלבד עם נקודה עשרונית לאגורות, לדוגמה 1250.00",
  "service_description": "תיאור קצר של השירות או המוצר בעברית",
  "doc_type": "סוג המסמך: חשבונית מס / חשבונית עסקה / קבלה / חשבונית מס קבלה / הצעת מחיר",
  "payment_terms": "מיידי אם השולם כבר שולמה, שוטף+30 / שוטף+60 / שוטף אחרת, ריק אם לא ברור"
}
Return ONLY the JSON object. No markdown, no explanation, no extra text.`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('לא ניתן לפרש את תשובת הסריקה');
    res.json(JSON.parse(match[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
