import { cache } from '../lib/cache.js';
import { logger } from '../lib/logger.js';

const WINDOW_MS = 72 * 60 * 60 * 1000;

export async function fetchLatestNews(company) {
  const cacheKey = `news:${company.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const items = [];

  if (process.env.NEWS_API_KEY) {
    try {
      const from = new Date(Date.now() - WINDOW_MS).toISOString();
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        `"${company}"`,
      )}&from=${from}&language=en&sortBy=publishedAt&pageSize=25&apiKey=${process.env.NEWS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      for (const a of data?.articles ?? []) {
        items.push({
          source: a.source?.name || 'NewsAPI',
          title: a.title,
          summary: a.description,
          url: a.url,
          publishedAt: a.publishedAt,
        });
      }
    } catch (err) {
      logger.warn('newsapi_failed', { error: err.message });
    }
  }

  if (process.env.GOOGLE_NEWS_ENABLED === 'true') {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(company)}+when:3d&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetch(url);
      const xml = await res.text();
      const regex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g;
      let match;
      while ((match = regex.exec(xml)) !== null && items.length < 50) {
        items.push({
          source: 'Google News',
          title: match[1].replace(/<!\[CDATA\[|\]\]>/g, ''),
          summary: '',
          url: match[2],
          publishedAt: new Date(match[3]).toISOString(),
        });
      }
    } catch (err) {
      logger.warn('google_news_failed', { error: err.message });
    }
  }

  const categorized = categorize(items);
  cache.set(cacheKey, categorized, 30 * 60 * 1000);
  return categorized;
}

function categorize(items) {
  const kw = {
    opportunity: ['expansion', 'partnership', 'rfp', 'hiring', 'launch', 'contract', 'pilot'],
    risk: ['layoff', 'automation', 'replaced', 'cut', 'exit', 'churn', 'lawsuit'],
    competitive: ['competitor', 'rival', 'market share', 'acquired', 'merger'],
    technology: ['ai', 'genai', 'llm', 'automation', 'bot', 'rpa', 'cloud', 'platform'],
    outsourcing: ['outsourc', 'bpo', 'vendor', 'offshore', 'nearshore', 'gcc', 'managed services'],
  };
  const buckets = {
    opportunities: [],
    risks: [],
    competitive_movement: [],
    technology_signals: [],
    outsourcing_signals: [],
  };
  for (const item of items) {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    if (kw.opportunity.some((k) => text.includes(k))) buckets.opportunities.push(item);
    if (kw.risk.some((k) => text.includes(k))) buckets.risks.push(item);
    if (kw.competitive.some((k) => text.includes(k))) buckets.competitive_movement.push(item);
    if (kw.technology.some((k) => text.includes(k))) buckets.technology_signals.push(item);
    if (kw.outsourcing.some((k) => text.includes(k))) buckets.outsourcing_signals.push(item);
  }
  return { items, ...buckets };
}
