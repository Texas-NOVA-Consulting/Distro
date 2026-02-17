// ============================================
// Vercel Serverless Function: Generate Summaries
// File: api/generate-summaries.js
// ============================================

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

function getLLM() {
  return new ChatGoogleGenerativeAI({
    modelName: 'gemini-2.5-flash',
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      articles,
      tone = 'professional',
      summaryLength = 'medium',
      customInstructions = ''
    } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ success: false, error: 'No articles provided' });
    }

    console.log(`✍️  Generating ${summaryLength} "${tone}" summaries for ${articles.length} articles`);

    const model = getLLM();
    const summaries = [];

    // Match exactly what the frontend settings page offers
    const toneInstructions = {
      professional: 'professional and informative, suitable for a business audience',
      casual:       'casual and conversational, easy to read and friendly',
      analyst:      'like a financial/tech analyst - data-driven, insightful, with market implications and strategic context',
      custom:       customInstructions || 'professional and informative',
    };

    const lengthInstructions = {
      short:  '2-3 concise bullet points (keep it tight)',
      medium: '3-4 detailed bullet points with key insights',
      long:   '5-6 comprehensive bullet points with analysis and implications',
    };

    const toneStyle = toneInstructions[tone] || toneInstructions.professional;
    const bulletCount = lengthInstructions[summaryLength] || lengthInstructions.medium;

    for (const article of articles) {
      try {
        const prompt = `Write a summary for this news article in a ${toneStyle} tone.

Title: ${article.title}
Source: ${article.source}
Description: ${article.description}

Format: ${bulletCount}
- Each bullet point must start with "•"
- Focus on: what happened, why it matters, and implications
- Return ONLY the bullet points, nothing else`;

        const response = await model.invoke(prompt);

        summaries.push({
          id: article.id,
          title: article.title,
          url: article.url,
          source: article.source,
          description: article.description,
          summary: response.content.trim()
        });

      } catch (err) {
        console.error(`Error on article ${article.id}:`, err.message);
        summaries.push({
          id: article.id,
          title: article.title,
          url: article.url,
          source: article.source,
          description: article.description,
          summary: `• ${article.description}\n\n• Further details are available in the full article.\n\n• This development may have broader implications for the industry.`
        });
      }
    }

    console.log(`✅ Generated ${summaries.length} summaries`);
    res.status(200).json({ success: true, summaries });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate summaries', message: error.message });
  }
}
