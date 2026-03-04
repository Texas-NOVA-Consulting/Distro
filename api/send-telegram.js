export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ success: false, error: 'Telegram credentials not configured. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to your Vercel environment variables.' });
  }

  try {
    const { articles } = req.body; // array of { title, summary, url, source }

    if (!articles || articles.length === 0) {
      return res.status(400).json({ success: false, error: 'No articles provided' });
    }

    const results = [];

    for (const article of articles) {
      const message = formatMessage(article);

      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
      });

      const tgData = await tgRes.json();

      if (!tgData.ok) {
        results.push({ title: article.title, success: false, error: tgData.description });
      } else {
        results.push({ title: article.title, success: true });
      }
    }

    const allOk = results.every(r => r.success);
    console.log(`✅ Sent ${results.filter(r => r.success).length}/${results.length} messages to Telegram`);

    res.status(200).json({ success: allOk, results });

  } catch (error) {
    console.error('❌ Telegram send error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

function formatMessage(article) {
  const lines = [];

  lines.push(`*${escapeMarkdown(article.title)}*`);
  if (article.source) lines.push(`_${escapeMarkdown(article.source)}_`);
  lines.push('');

  if (article.summary) {
    lines.push(article.summary);
  }

  if (article.url) {
    lines.push('');
    lines.push(article.url);
  }

  return lines.join('\n');
}

function escapeMarkdown(text) {
  return (text || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
