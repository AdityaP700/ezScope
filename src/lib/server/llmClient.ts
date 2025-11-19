import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const CLAIM_EXTRACTION_PROMPT = `You extract factual claims from provided text ONLY.
Rules:
1. Do NOT use outside knowledge.
2. Do NOT hallucinate or guess.
3. If the text does not mention something, do NOT create a claim.
4. Do NOT output generic meta claims like "X is a subject of significant interest."
5. Do NOT output claims from unrelated topics.
6. Every claim must be explicitly supported by the provided text.
7. If no claims exist, return an empty JSON array.
8. When the text is a chunk of a larger article, extract the most salient factual claims from THIS chunk only. Aim for 5–15 concise, atomic claims when present; otherwise return [].

Output format: ONLY a JSON array where each item has fields: subject, predicate, object, rawText, confidence (0..1).`;
const RDF_GENERATION_PROMPT = `Convert claims into JSON-LD Knowledge Asset with @context schema.org, @type KnowledgeAsset, include source, topic, and claims list. Output ONLY JSON.`;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';

if (!OPENAI_API_KEY) {
  // in production prefer to fail early; keep a clear fallback toggle instead of silent mocks
  console.warn("OPENAI_API_KEY not set — LLM calls will throw. Set OPENAI_API_KEY in .env");
}

async function extractClaims(promptText: string, topic?: string): Promise<any[]> {
  const system = CLAIM_EXTRACTION_PROMPT;
  const user = `Extract factual claims ONLY from the text below. Ignore anything unrelated to the text. Do NOT invent information. Return ONLY a JSON array (no prose). If present, return up to 10 claims for this chunk.\n\nTOPIC: ${topic || '(unspecified)'}\n\nTEXT:\n${promptText}`;
  const resp = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0,
    },
    { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
  );
  const respText: string | undefined = resp.data?.choices?.[0]?.message?.content;
  if (!respText) throw new Error('No content from LLM for claim extraction');

  // sanitize: remove markdown fences and surrounding text, keep the first JSON array found
  function sanitizeAndExtractJsonArray(raw: string) {
    if (!raw) return raw;
    // remove ```json blocks or ``` ... ``` wrappers
    const fenceMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
    let candidate = fenceMatch ? fenceMatch[1].trim() : raw.trim();

    // find first '[' and last ']' to extract the JSON array segment
    const firstIdx = candidate.indexOf('[');
    const lastIdx = candidate.lastIndexOf(']');
    if (firstIdx !== -1 && lastIdx !== -1 && lastIdx > firstIdx) {
      candidate = candidate.slice(firstIdx, lastIdx + 1);
    } else {
      // if no clear array found, attempt to strip leading/trailing non-json
      candidate = candidate.replace(/^[^\[\{]*/, '').replace(/[^\]\}]*$/, '').trim();
    }

    return candidate;
  }

  const cleaned = sanitizeAndExtractJsonArray(respText);

  // try parsing with graceful fallbacks
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Parsed JSON is not an array');
    return parsed;
  } catch (parseErr) {
    // try a last-resort trim at the last closing bracket
    try {
      const lastBracket = cleaned.lastIndexOf(']');
      const trimmed = lastBracket !== -1 ? cleaned.slice(0, lastBracket + 1) : cleaned;
      const parsed2 = JSON.parse(trimmed);
      if (Array.isArray(parsed2)) return parsed2;
    } catch (e) {
      // continue to throw a helpful error below
    }

    // include a truncated sanitized snippet to help debugging (avoid huge logs)
    const snippet = (cleaned || respText || '').slice(0, 2000);
    throw new Error(`Failed to parse claims JSON from LLM response. Raw (truncated):\n${snippet}\n\nParse error: ${(parseErr as Error).message}`);
  }
}

export async function generateRdfFromClaims(topic: string, claims: any[], source: string): Promise<{ jsonld: any; triples: any[] }> {
  // Simple local transformation; could be upgraded to proper RDF lib later.
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'KnowledgeAsset',
    topic,
    source,
    claims: claims.map((c, i) => ({
      '@type': 'Statement',
      '@id': `claim:${i}`,
      subject: c.subject,
      predicate: c.predicate,
      object: c.object,
      text: c.rawText || c.text,
      confidence: c.confidence ?? 0.9,
    })),
    dateCreated: new Date().toISOString(),
  };
  const triples = claims.map((c) => [c.subject, c.predicate, c.object]);
  return { jsonld, triples };
}

export async function summarizeDiscrepancy(claimA: any, claimB: any): Promise<{ type: 'missing' | 'contradiction' | 'bias' | 'unsupported' | 'citation_absent'; summary: string; confidence: number }> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const prompt = `
    Compare the following two claims and determine if there is a discrepancy.
    Claim A: ${JSON.stringify(claimA)}
    Claim B: ${JSON.stringify(claimB)}

    Return a JSON object with:
    - type: one of 'missing', 'contradiction', 'bias', 'unsupported', 'citation_absent'
    - summary: A brief explanation of the discrepancy.
    - confidence: A number between 0 and 1.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: "You are a discrepancy detection assistant." },
                { role: 'user', content: prompt },
            ],
            temperature: 0,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No content from LLM');
        return JSON.parse(content);
    } catch (error) {
        console.error('Discrepancy summary failed:', error);
        throw error;
    }
}

// Embedding support (domain-agnostic semantic similarity)
export async function embedText(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required for embeddings');
  const resp = await axios.post('https://api.openai.com/v1/embeddings', {
    model: EMBED_MODEL,
    input: text
  }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } });
  return resp.data.data[0].embedding as number[];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

export { extractClaims };
