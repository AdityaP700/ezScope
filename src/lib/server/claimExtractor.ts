import { extractClaims } from './llmClient';

export interface Claim {
    id?: string;
    subject: string;
    predicate: string;
    object: string;
    rawText: string;
    confidence?: number;
}

function chunkText(text: string, targetLen = 3500, maxChunks = 6): string[] {
    const paragraphs = text.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);
    const chunks: string[] = [];
    let current = '';
    for (const p of paragraphs) {
        if ((current + '\n\n' + p).length > targetLen) {
            if (current) chunks.push(current);
            current = p;
            if (chunks.length >= maxChunks - 1) break;
        } else {
            current = current ? current + '\n\n' + p : p;
        }
    }
    if (current && chunks.length < maxChunks) chunks.push(current);
    if (!chunks.length && text.length > 0) {
        for (let i = 0; i < Math.min(maxChunks, Math.ceil(text.length / targetLen)); i++) {
            const start = i * targetLen;
            chunks.push(text.slice(start, start + targetLen));
        }
    }
    return chunks;
}

export async function extractClaimsFromText(text: string, topic?: string, jobId?: string): Promise<Claim[]> {
    const chunks = chunkText(text, 2500, 8);
    const aggregated: any[] = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const part = await extractClaims(chunk, topic);
            if (Array.isArray(part)) {
                if (part.length > 0) {
                    console.log(`extractClaimsFromText: chunk ${i+1}/${chunks.length} -> ${part.length} claims`);
                }
                aggregated.push(...part);
            } else {
                console.warn(`extractClaimsFromText: chunk ${i+1}/${chunks.length} returned non-array`);
            }
        } catch (e) {
            console.warn('extractClaimsFromText: chunk failed', (e as any)?.message);
        }
    }
    const rawClaims = aggregated;

    const runSuffix = jobId ? jobId.replace(/[:]/g, '-') : Math.random().toString(36).slice(2,8);
    let claims: Claim[] = rawClaims.map((c: any, index: number) => ({
        id: `claim-${runSuffix}-${index}`,
        subject: c.subject,
        predicate: c.predicate,
        object: c.object,
        rawText: c.rawText || c.text,
        confidence: c.confidence || 0.9
    }));

    // Deduplicate
    const seen = new Set<string>();
    claims = claims.filter(c => {
        const key = [String(c.subject||'').toLowerCase().trim(), String(c.predicate||'').toLowerCase().trim(), String(c.object||'').toLowerCase().trim(), String(c.rawText||'').toLowerCase().trim()].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Remove generic boilerplate/meta claims regardless of topic filtering
    const GENERIC_PATTERNS: RegExp[] = [
        /subject of (?:significant )?interest/i,
        /topic of (?:considerable|ongoing) (?:debate|interest|discussion)/i,
        /is a (?:television|tv|film|movie|series)/i,
        /this article (?:discusses|covers)/i,
        /may refer to:/i
    ];
    claims = claims.filter(c => {
        const t = (c.rawText || '').trim();
        return t.length > 0 && !GENERIC_PATTERNS.some(rx => rx.test(t));
    });

    if (topic) {
        const topicLc = topic.toLowerCase();
        const rawTokens = topicLc.match(/[a-z]{4,}/g) || [];
        const STOPWORDS = new Set(['this','that','with','from','about','which','shall','where','there','their','these','those','would','could','should','into','being','have','been','without','under','over']);
        const keywords = Array.from(new Set(rawTokens.filter(w => !STOPWORDS.has(w))));
        const keep = (t: string) => keywords.some(k => t.toLowerCase().includes(k));
        const filtered = claims.filter(c => keep(c.rawText) || keep(c.subject) || keep(c.object));
        // Only adopt filtered if at least 2 claims remain to avoid silent depletion
        if (filtered.length >= 2) {
            claims = filtered;
        }
    }

    return claims;
}
