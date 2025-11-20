// --- START OF FILE claimExtractor.ts ---

import { extractClaims } from './llmClient';

export interface Claim {
    id?: string;
    subject: string;
    predicate: string;
    object: string;
    rawText: string;
    confidence?: number;
}

function chunkText(text: string, targetLen = 2000, maxChunks = 6): string[] {
    // 1. Standard paragraph split
    let paragraphs = text.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);

    // 2. If we have huge paragraphs (common in Wiki plain text), split them by sentences
    const refinedParagraphs: string[] = [];
    for (const p of paragraphs) {
        if (p.length > targetLen) {
            // split by period followed by space, roughly preserving sentences
            const sentences = p.match( /[^.!?]+[.!?]+["']?|.+$/g ) || [p];
            refinedParagraphs.push(...sentences);
        } else {
            refinedParagraphs.push(p);
        }
    }
    paragraphs = refinedParagraphs;

    const chunks: string[] = [];
    let current = '';

    for (const p of paragraphs) {
        // If adding this paragraph exceeds target, push current and start new
        if ((current.length + p.length) > targetLen) {
            if (current) chunks.push(current);
            current = p;
            if (chunks.length >= maxChunks) break;
        } else {
            current = current ? current + '\n\n' + p : p;
        }
    }
    if (current && chunks.length <= maxChunks) chunks.push(current);

    return chunks;
}

export async function extractClaimsFromText(text: string, topic?: string, jobId?: string): Promise<Claim[]> {
    // Chunk size reduced to 2000 to ensure reliable LLM processing
    const chunks = chunkText(text, 2000, 8);

    console.log(`[TruthAgent] Processing ${text.length} chars in ${chunks.length} chunks...`);

    const aggregated: any[] = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const part = await extractClaims(chunk, topic);
            if (Array.isArray(part)) {
                aggregated.push(...part);
            }
        } catch (e) {
            console.warn(`Chunk ${i} failed`, e);
        }
    }

    const runSuffix = jobId ? jobId.replace(/[:]/g, '-') : Math.random().toString(36).slice(2,8);

    let claims: Claim[] = aggregated.map((c: any, index: number) => ({
        id: `claim-${runSuffix}-${index}`,
        subject: c.subject,
        predicate: c.predicate,
        object: c.object,
        rawText: c.rawText || c.text,
        confidence: c.confidence || 0.9
    }));

    // Deduplicate based on text content
    const seen = new Set<string>();
    claims = claims.filter(c => {
        const key = (c.rawText || '').toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // --- CRITICAL FIX: REMOVED AGGRESSIVE TOPIC FILTERING ---
    // The previous filter was deleting claims that didn't match keywords exactly.
    // We now trust the LLM prompt (which already includes the TOPIC) to be relevant.

    // Just filter generic meta-junk
    const GENERIC_PATTERNS = [
        /subject of .* interest/i,
        /article discusses/i,
        /refer to:/i,
        /^\s*\[.*\]\s*$/ // citations like [12]
    ];

    claims = claims.filter(c => {
        const t = (c.rawText || '').trim();
        return t.length > 10 && !GENERIC_PATTERNS.some(rx => rx.test(t));
    });

    console.log(`[TruthAgent] Extracted ${claims.length} valid claims.`);
    return claims;
}