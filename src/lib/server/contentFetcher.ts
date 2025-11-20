import axios from "axios";
import { embedText, cosineSimilarity } from './llmClient';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "TruthScope";
const APP_CONTACT = process.env.NEXT_PUBLIC_APP_URL || "https://github.com/AdityaP700";
const USER_AGENT = `${APP_NAME}/1.0 (${APP_CONTACT})`;

const DEFAULT_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "application/json",
};

// Simple in-memory cache (replace with Redis if needed)
const cache = new Map<string, { value: any; expires: number }>();
function cacheGet(key: string) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}
function cacheSet(key: string, value: any, ttlMs = 300_000) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

const STOPWORDS = new Set(['this','that','with','from','about','which','shall','where','there','their','these','those','would','could','should','into','being','have','been','without','under','over','using','instead','pros','cons']);
function extractTopicKeywords(topic: string) {
  return Array.from(new Set((topic.toLowerCase().match(/[a-z]{4,}/g) || []).filter(w => !STOPWORDS.has(w))));
}

function relevanceScore(text: string, keywords: string[]) {
  const lc = text.toLowerCase();
  let score = 0;
  for (const k of keywords) if (k && lc.includes(k)) score += 1;
  return score;
}

// 1. Search for page titles
export async function searchWikipedia(query: string, limit = 5, lang = "en") {
  const params = {
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: limit,
    format: "json",
  };
  const url = `https://${lang}.wikipedia.org/w/api.php`;
  const resp = await axios.get(url, { params, headers: DEFAULT_HEADERS, timeout: 10000 });
  return resp.data?.query?.search?.map((r: any) => r.title) ?? [];
}

// 2. Fetch clean REST summary (fast, good for quick diffing)
export async function fetchWikipediaSummary(title: string, lang = "en") {
  const key = `summary:${lang}:${title}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const resp = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 8000 });
    const extract = resp.data?.extract ?? null;
    cacheSet(key, extract);
    return extract;
  } catch (e: any) {
    if (e?.response?.status === 403) {
      throw new Error(`403 Forbidden from REST summary. User-Agent sent: ${USER_AGENT}`);
    }
    throw new Error(`Failed REST summary for "${title}": ${e.message}`);
  }
}

// 3. Fetch plaintext full extract (your original approach, slightly enhanced)
export async function fetchWikipediaArticle(title: string, lang = "en", sentences?: number) {
  const key = `extract:${lang}:${title}:${sentences || "all"}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const params: any = {
    action: "query",
    prop: "extracts",
    explaintext: 1,
    format: "json",
    redirects: 1,
    titles: title,
    exsectionformat: "plain",
  };
  if (sentences && sentences > 0) params.exsentences = sentences;

  const url = `https://${lang}.wikipedia.org/w/api.php`;
  try {
    const resp = await axios.get(url, { params, headers: DEFAULT_HEADERS, timeout: 15000 });
    const pages = resp.data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as any;
    const text = page?.extract ?? null;
    cacheSet(key, text);
    return text;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      throw new Error(`Wikipedia 403 (extracts). User-Agent: ${USER_AGENT}`);
    }
    throw new Error(`Error fetching extract for "${title}": ${err.message}`);
  }
}

// 4. Structured fetch (HTML, sections, links)
export async function fetchWikipediaStructured(title: string, lang = "en") {
  const key = `structured:${lang}:${title}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const params = {
    action: "parse",
    page: title,
    prop: "text|sections|links|categories",
    format: "json",
    redirects: 1,
  };
  const url = `https://${lang}.wikipedia.org/w/api.php`;
  try {
    const resp = await axios.get(url, { params, headers: DEFAULT_HEADERS, timeout: 15000 });
    const parse = resp.data?.parse ?? null;
    cacheSet(key, parse, 600_000);
    return parse;
  } catch (e: any) {
    if (e?.response?.status === 403) {
      throw new Error(`Wikipedia 403 (parse). User-Agent: ${USER_AGENT}`);
    }
    throw new Error(`Failed structured fetch for "${title}": ${e.message}`);
  }
}

// 5. Helper: query string → best match → extract text
export async function fetchWikipediaByQuery(query: string, lang = "en") {
  const titles = await searchWikipedia(query, 5, lang);
  if (!titles.length) return null;
  const keywords = extractTopicKeywords(query);
  // Score titles by keyword overlap; pick best, then try summary to confirm
  let best = titles[0];
  let bestScore = -1;
  for (const t of titles) {
    const s = relevanceScore(t, keywords);
    if (s > bestScore) { bestScore = s; best = t; }
  }
  // If tied/low score, try REST summaries to refine
  if (bestScore < 2) {
    let refined = best;
    let refinedScore = bestScore;
    for (const t of titles) {
      try {
        const summary = await fetchWikipediaSummary(t, lang);
        const s = relevanceScore((summary || '') + ' ' + t, keywords);
        if (s > refinedScore) { refined = t; refinedScore = s; }
      } catch {}
    }
    best = refined;
  }
  return fetchWikipediaArticle(best, lang);
}

// 6. Placeholder Grokipedia content (replace when real source available)
// --- Inside contentFetcher.ts ---

export async function fetchGrokipediaContent(topic: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'mock') {
      console.warn("No OpenAI Key for Grok content generation. Returning empty.");
      return "";
  }

  console.log(`[TruthAgent] Generating 'Grokipedia' content for: ${topic}`);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // or gpt-4 if available
        messages: [
          {
            role: 'system',
            content: 'You are "Grokipedia", an AI encyclopedia. Write a detailed, factual article about the user request. Focus on technical mechanisms and facts.'
          },
          { role: 'user', content: topic }
        ],
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    const text = response.data?.choices?.[0]?.message?.content;
    return text || "";
  } catch (error: any) {
    console.error("Failed to generate Grok content:", error?.message);
    return "";
  }
}

/**
 * Compatibility wrapper expected by API route:
 * - tries search -> article extract
 * - falls back to REST summary then full extract
 */
export async function fetchWikipediaContent(topic: string, lang = "en"): Promise<string | null> {
  const keywords = extractTopicKeywords(topic);

  // Fast path: try summary of first three keyword joins
  const primaryVariant = keywords.slice(0, 3).join(' ') || topic;
  let candidateTitles: string[] = [];
  try {
    candidateTitles = await searchWikipedia(primaryVariant, 5, lang);
  } catch (e) {
    console.warn('fetchWikipediaContent: initial search failed', (e as any)?.message);
  }
  if (candidateTitles.length === 0) {
    // fallback single search with full topic
    try { candidateTitles = await searchWikipedia(topic, 5, lang); } catch {}
  }
  if (candidateTitles.length === 0) {
    throw new Error(`Wikipedia search produced no titles for topic="${topic}"`);
  }

  // Embed topic once
  let topicEmbedding: number[] | null = null;
  try { topicEmbedding = await embedText(topic); } catch (e) {
    console.warn('Embedding failed for topic, using keyword score only:', (e as any)?.message);
  }

  interface RankedCandidate { title: string; summary?: string; score: number; sim: number; }
  const ranked: RankedCandidate[] = [];
  for (const title of candidateTitles.slice(0, 5)) {
    try {
      const summary = await fetchWikipediaSummary(title, lang) || '';
      const cleanSummary = summary.replace(/\[[0-9]+\]/g, ' ').replace(/\s+/g, ' ').trim();
      let kwScore = relevanceScore(title + ' ' + cleanSummary.slice(0,500), keywords);

      // Boost exact title-topic matches (case insensitive)
      const titleLower = title.toLowerCase();
      const topicLower = topic.toLowerCase();
      if (titleLower.includes(topicLower.slice(0, Math.min(30, topicLower.length)))) kwScore += 5;
      keywords.forEach(kw => { if (titleLower.includes(kw)) kwScore += 0.5; });

      let sim = 0;
      if (topicEmbedding) {
        try {
          const summaryEmbedding = await embedText(cleanSummary.slice(0,2000));
          sim = cosineSimilarity(topicEmbedding, summaryEmbedding);
        } catch {}
      }
      ranked.push({ title, summary: cleanSummary, score: kwScore, sim });
    } catch (e) {
      console.warn('fetchWikipediaContent: summary failure for', title, (e as any)?.message);
    }
  }

  if (!ranked.length) throw new Error(`Wikipedia summaries unavailable for topic="${topic}"`);

  // ranked.sort((a, b) => (b.sim * 10 + b.score) - (a.sim * 10 + a.score));
  // const best = ranked[0];

  // === Fully generalized topic-page semantic alignment check ===
  const MIN_TOPIC_TITLE_SIM = 0.15;
  const MIN_TOPIC_SUMMARY_SIM = 0.20;
  const MIN_SUMMARY_LENGTH = 40;
  const SUMMARY_ACCEPT_LENGTH = 300; // fallback acceptance threshold
  const HARD_KEYWORD_MISS = keywords.length > 0 ? 0 : -1;

  // try to pick the first candidate that passes semantic+keyword alignment checks
  let chosen: RankedCandidate | null = null;
  const debugCandidates: any[] = [];

  for (const cand of ranked) {
    const title = cand.title;
    const summary = (cand.summary || '').trim();
    const titleLower = title.toLowerCase();
    const summaryLower = summary.toLowerCase();

    // keyword presence
    const kwInTitle = relevanceScore(title, keywords);
    const kwInSummary = relevanceScore(summary, keywords);
    const keywordHit = Math.max(kwInTitle, kwInSummary);

    // compute title embedding similarity where possible
    let titleSim = 0;
    if (topicEmbedding) {
      try {
        const titleEmbedding = await embedText(title);
        titleSim = cosineSimilarity(topicEmbedding, titleEmbedding);
      } catch (e) {
        // ignore embedding failures for title
      }
    }

    const summarySim = cand.sim || 0;

    // disambiguation / meta-page detection
    const isDisamb = /may refer to:|disambiguation/i.test(summary) || /\(disambiguation\)/i.test(title);
    const summaryLen = summary.length;

    // coarse token intersection check
    const topicWords = new Set(keywords);
    const titleWords = new Set(extractTopicKeywords(title));
    const intersection = Array.from(topicWords).filter(w => titleWords.has(w)).length;

    // mismatch decision (strong signal)
    let isMismatch =
      titleSim < MIN_TOPIC_TITLE_SIM &&
      summarySim < MIN_TOPIC_SUMMARY_SIM &&
      keywordHit <= HARD_KEYWORD_MISS;

    // extra heuristics
    if (intersection === 0 && summarySim < 0.22) isMismatch = true;
    if (isDisamb) isMismatch = true;
    if (summaryLen > 0 && summaryLen < MIN_SUMMARY_LENGTH) isMismatch = true;

    debugCandidates.push({
      title,
      score: cand.score,
      summarySim: Number(summarySim.toFixed(3)),
      titleSim: Number(titleSim.toFixed(3)),
      keywordHit,
      summaryLen,
      intersection
    });

    if (!isMismatch) {
      chosen = cand;
      break;
    }
  }

  // If no candidate passes, provide transparent error with top debug info
  if (!chosen) {
    const topDebug = debugCandidates.slice(0, 5);
    throw new Error(
      `No sufficiently relevant Wikipedia page found for topic="${topic}". Top candidates debug: ${JSON.stringify(
        topDebug,
        null,
        2
      )}`
    );
  }

  // use the chosen candidate as best
  const best = chosen;

  // Fetch full article for best title (same as before)
  try {
    const full = (await fetchWikipediaArticle(best.title, lang)) || best.summary || '';
    const cleaned = full.replace(/\[[0-9]+\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleaned.length < 500 && (best.summary || '').length < SUMMARY_ACCEPT_LENGTH) {
      throw new Error(`Retrieved Wikipedia article too short (${cleaned.length} chars). Title="${best.title}"`);
    }
    return cleaned;
  } catch (e) {
    console.warn('fetchWikipediaContent: full article fetch failed, using summary', (e as any)?.message);
    const fallback = best.summary || null;
    if (fallback && fallback.length < 300) {
      throw new Error(`Summary too short (${fallback.length} chars) for meaningful comparison. Topic="${topic}"`);
    }
    return fallback;
  }
}
