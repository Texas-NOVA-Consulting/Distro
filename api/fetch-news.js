export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { topic, count = 10 } = req.body;
    const searchTopic = topic || 'latest technology and AI news';

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: searchTopic,
        topic: 'news',              // news-specific results
        search_depth: 'basic',      // 1 credit per search
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
      throw new Error('No articles found for this topic');
    }

    const articles = data.results.map((item, index) => ({
      id: Date.now() + index,
      title: item.title || 'Untitled',
      source: extractDomain(item.url),
      date: formatDate(item.published_date),
      description: (item.content || '').substring(0, 220).trim() || `${item.title} — click to read more.`,
      url: item.url || ''
    }));

    console.log(`✅ Fetched ${articles.length} articles via Tavily for: "${searchTopic}"`);
    res.status(200).json({ success: true, articles });

  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return 'News';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHrs / 24);
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recent';
  }
}
