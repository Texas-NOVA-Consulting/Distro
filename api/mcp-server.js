import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

const server = new Server({
  name: "distro-tools",
  version: "1.0.0",
}, {
  capabilities: { tools: {} },
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "fetch_news",
      description: "Fetches recent news articles for a given topic using Tavily search",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Topic or search query for news" },
          count: { type: "number", description: "Number of articles to fetch (default 10)" }
        },
        required: ["topic"]
      }
    },
    {
      name: "generate_summary",
      description: "Generates an AI-powered summary for a news article using Google Gemini",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Article title" },
          description: { type: "string", description: "Article description or content snippet" },
          source: { type: "string", description: "Article source or domain" },
          tone: { type: "string", description: "Tone preset (professional, casual, analyst) or a custom tone instruction string" },
          summaryLength: { type: "string", description: "Length: short, medium, or long" }
        },
        required: ["title"]
      }
    },
    {
      name: "post_to_telegram",
      description: "Posts a curated news summary to a Telegram channel",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Article title" },
          summary: { type: "string", description: "Article summary content" },
          url: { type: "string", description: "Article URL" },
          source: { type: "string", description: "Article source" },
          channelId: { type: "string", description: "Telegram channel ID (overrides TELEGRAM_CHAT_ID env var)" },
          botToken: { type: "string", description: "Telegram bot token (overrides TELEGRAM_BOT_TOKEN env var)" }
        },
        required: ["title", "summary"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "fetch_news") {
    const { topic, count = 10 } = args;

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: topic,
        topic: 'news',
        search_depth: 'basic',
        max_results: parseInt(count),
        include_answer: false,
        include_raw_content: false
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Tavily error: ${response.status} — ${err}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return { content: [{ type: "text", text: "No articles found for this topic." }] };
    }

    const articles = data.results.map((item, i) => ({
      id: Date.now() + i,
      title: item.title || 'Untitled',
      source: (() => { try { return new URL(item.url).hostname.replace(/^www\./, ''); } catch { return 'News'; } })(),
      date: item.published_date || 'Recent',
      description: (item.content || '').substring(0, 220).trim() || item.title,
      url: item.url || ''
    }));

    return { content: [{ type: "text", text: JSON.stringify({ success: true, articles }, null, 2) }] };
  }

  if (name === "generate_summary") {
    const { title, description = '', source = '', tone = 'professional', summaryLength = 'medium' } = args;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.7 }
    });

    const toneMap = {
      professional: 'professional and informative, suitable for a business audience',
      casual: 'casual and conversational, easy to read and friendly',
      analyst: 'like a financial/tech analyst — data-driven, with market implications and strategic context',
    };

    const lengthMap = {
      short: '1 short paragraph (2-3 sentences)',
      medium: '1 paragraph (4-5 sentences) covering what happened, why it matters, and key implications',
      long: '2 paragraphs — the first covering the news itself, the second covering broader implications and context',
    };

    const toneStyle = toneMap[tone] || tone;
    const paragraphFormat = lengthMap[summaryLength] || lengthMap.medium;

    const prompt = `Write a summary for this news article in a ${toneStyle} tone.
Title: ${title}
Source: ${source}
Description: ${description}
Format: ${paragraphFormat}
- Write in flowing prose, no bullet points
- Focus on: what happened, why it matters, and implications
- Return ONLY the paragraph(s), nothing else`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    return { content: [{ type: "text", text: summary }] };
  }

  if (name === "post_to_telegram") {
    const { title, summary, url = '', source = '', channelId, botToken } = args;
    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = channelId || process.env.TELEGRAM_CHAT_ID;

    if (!token) throw new Error('No bot token provided. Set TELEGRAM_BOT_TOKEN env var or pass botToken.');
    if (!chatId) throw new Error('No channel ID provided. Set TELEGRAM_CHAT_ID env var or pass channelId.');

    const lines = [title];
    if (source) lines.push(source);
    lines.push('', summary);
    if (url) lines.push('', url);
    const message = lines.join('\n');

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: false
      })
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) throw new Error(`Telegram error: ${tgData.description}`);

    return { content: [{ type: "text", text: `Successfully posted "${title}" to Telegram channel ${chatId}.` }] };
  }

  throw new Error(`Tool not found: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
