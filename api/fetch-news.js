export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { topic, count = 10 } = req.body;
    const searchTopic = topic || 'latest technology and AI news';

    const query = encodeURIComponent(searchTopic);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
    });
    if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);

    const xml = await response.text();
    const articles = parseRSS(xml, parseInt(count));

    if (articles.length === 0) throw new Error('No articles found for this topic');

    console.log(`✅ Fetched ${articles.length} real articles for: "${searchTopic}"`);
    res.status(200).json({ success: true, articles });

  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

function parseRSS(xml, limit) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let id = Date.now();

  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const item = match[1];

    const rawTitle = extractCDATA(item, 'title') || extractTag(item, 'title') || '';
    const rawDesc  = extractCDATA(item, 'description') || '';
    const pubDate  = extractTag(item, 'pubDate') || '';
    const source   = extractSourceTag(item) || '';

    if (!rawTitle) continue;

    // Google News RSS wraps the real article URL in the first <a href> of the description CDATA
    const realUrl = extractFirstHref(rawDesc) || extractTag(item, 'link') || '';

    // Strip HTML for readable description text
    const descText = stripHtml(rawDesc).substring(0, 220).trim();
    const cleanedTitle = cleanTitle(rawTitle, source);

    items.push({
      id: id++,
      title: cleanedTitle,
      source: source || extractSourceFromTitle(rawTitle) || 'News',
      date: formatDate(pubDate),
      description: descText || `${cleanedTitle} — click to read more.`,
      url: realUrl
    });
  }

  return items;
}

// Google News description CDATA contains the real article URL as the first <a href>
function extractFirstHref(html) {
  const m = html.match(/<a\s+[^>]*href="([^"]+)"/i);
  return m ? m[1] : '';
}

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

function extractCDATA(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
  return m ? m[1].trim() : null;
}

function extractSourceTag(xml) {
  const m = xml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
  return m ? m[1].trim() : '';
}

function extractSourceFromTitle(title) {
  const m = title.match(/ - ([^-]+)$/);
  return m ? m[1].trim() : '';
}

function cleanTitle(title, source) {
  let t = title;
  if (source) t = t.replace(new RegExp(` - ${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
  return t.replace(/ - [^-]*$/, '').trim();
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
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
