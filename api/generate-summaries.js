import { GoogleGenerativeAI } from '@google/generative-ai';

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.7 }
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

    console.log(`✍️  Generating ${summaryLength} summaries (tone: "${tone}") for ${articles.length} articles`);

    const model = getModel();

    const toneInstructions = {
      professional: 'professional and informative, suitable for a business audience',
      casual: 'casual and conversational, easy to read and friendly',
      analyst: 'like a financial/tech analyst — data-driven, with market implications and strategic context',
      custom: customInstructions || 'professional and informative',
    };

    const lengthInstructions = {
      short: '1 short paragraph (2-3 sentences)',
      medium: '1 paragraph (4-5 sentences) covering what happened, why it matters, and key implications',
      long: '2 paragraphs — the first covering the news itself, the second covering broader implications and context',
    };

    const toneStyle = toneInstructions[tone] || tone || toneInstructions.professional;
    const paragraphFormat = lengthInstructions[summaryLength] || lengthInstructions.medium;

    const summaries = [];

    for (const article of articles) {
      try {
        const prompt = `Write a summary for this news article in a ${toneStyle} tone.
Title: ${article.title}
Source: ${article.source}
Description: ${article.description}
Format: ${paragraphFormat}
- Write in flowing prose, no bullet points
- Focus on: what happened, why it matters, and implications
- Return ONLY the paragraph(s), nothing else`;

        const result = await model.generateContent(prompt);
        const summary = result.response.text().trim();

        summaries.push({
          id: article.id,
          title: article.title,
          url: article.url,
          source: article.source,
          description: article.description,
          summary
        });
      } catch (err) {
        console.error(`Error on article ${article.id}:`, err.message);
        summaries.push({
          id: article.id,
          title: article.title,
          url: article.url,
          source: article.source,
          description: article.description,
          summary: article.description
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
