// ============================================
// Vercel Serverless Function: Generate Summaries
// File: api/generate-summaries.js
// ============================================

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

/**
 * Initialize Gemini model
 */
function getLLM() {
  return new ChatGoogleGenerativeAI({
    modelName: 'gemini-2.5-flash',
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

/**
 * Vercel serverless function handler
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { articles, tone = 'professional', summaryLength = 'medium' } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No articles provided' 
      });
    }

    console.log(`✍️  Generating ${summaryLength} ${tone} summaries for ${articles.length} articles`);

    const model = getLLM();
    const summaries = [];

    // Determine summary format based on length
    const lengthInstructions = {
      short: '2-3 concise bullet points',
      medium: '3-4 detailed bullet points with key insights',
      long: '5-6 comprehensive bullet points with analysis and implications'
    };

    const bulletCount = lengthInstructions[summaryLength] || lengthInstructions.medium;

    // Determine tone instructions
    const toneInstructions = {
      professional: 'professional and informative',
      casual: 'casual and conversational',
      technical: 'technical and detailed',
      witty: 'witty and engaging',
      concise: 'extremely concise and to-the-point'
    };

    const toneStyle = toneInstructions[tone] || 'professional and engaging';

    for (const article of articles) {
      try {
        const prompt = `Write a ${toneStyle} summary for this news article.

Title: ${article.title}
Source: ${article.source}
Description: ${article.description}

Format: ${bulletCount}
Each bullet point should start with "•" and provide meaningful insights, not just facts.
Focus on: what happened, why it matters, and potential implications.

Return ONLY the bullet points, no introduction, no conclusion.`;

        const response = await model.invoke(prompt);
        
        summaries.push({
          id: article.id,
          title: article.title,
          url: article.url,
          source: article.source,
          description: article.description,
          summary: response.content.trim()
        });

      } catch (error) {
        console.error(`Error summarizing article ${article.id}:`, error.message);
        // Add placeholder summary if individual article fails
        summaries.push({
          id: article.id,
          title: article.title,
          url: article.url,
          source: article.source,
          description: article.description,
          summary: `• ${article.description}\n\n• This article discusses recent developments in the field.\n\n• Further analysis shows potential impact on the industry.`
        });
      }
    }

    console.log(`✅ Generated ${summaries.length} summaries`);

    res.status(200).json({
      success: true,
      summaries
    });

  } catch (error) {
    console.error('❌ Error generating summaries:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summaries',
      message: error.message
    });
  }
}
