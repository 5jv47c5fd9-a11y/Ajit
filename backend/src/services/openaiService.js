import OpenAI from 'openai';
import { logger } from '../lib/logger.js';

let client = null;

function getClient() {
  if (client) return client;
  if (!process.env.OPENAI_API_KEY) return null;
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are Outsight AI, an executive enterprise intelligence engine.
You produce structured, boardroom-ready analysis for outsourcing vendors, CX/BPO
providers, consulting firms, automation vendors, and AI service providers.
Respond ONLY with a single JSON object matching the schema the caller supplies.
Never include commentary outside JSON. Use conservative, non-speculative language.`;

export async function reasonAboutCompany({ company, signals, newsItems, schema }) {
  const api = getClient();
  if (!api) {
    logger.warn('openai_unavailable_using_heuristics', { company });
    return null;
  }
  const user = `Company: ${company}
Signals: ${JSON.stringify(signals).slice(0, 6000)}
RecentNews: ${JSON.stringify(newsItems?.slice(0, 12) ?? []).slice(0, 6000)}
Schema: ${JSON.stringify(schema)}

Produce a JSON object whose keys exactly match the schema. Populate every field
with concise executive-grade analysis. Scores must be integers 0-100. Lists
must be 3-7 items unless the schema says otherwise.`;

  try {
    const resp = await api.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
    });
    const raw = resp.choices[0]?.message?.content || '{}';
    return JSON.parse(raw);
  } catch (err) {
    logger.error('openai_error', { message: err.message });
    return null;
  }
}
