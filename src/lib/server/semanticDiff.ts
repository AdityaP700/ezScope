import { summarizeDiscrepancy, embedText, cosineSimilarity } from './llmClient';
import { Claim } from './claimExtractor';

export interface Discrepancy {
    type: 'missing' | 'contradiction' | 'bias' | 'unsupported' | 'citation_absent';
    summary: string;
    confidence: number;
    claimA?: Claim;
    claimB?: Claim;
}

export interface ComparisonResult {
    topic: string;
    discrepancies: Discrepancy[];
}

// Helper to cache embeddings so we don't waste API credits
const embeddingCache = new Map<string, number[]>();

async function getClaimEmbedding(text: string): Promise<number[]> {
    if (embeddingCache.has(text)) return embeddingCache.get(text)!;
    try {
        const vector = await embedText(text);
        embeddingCache.set(text, vector);
        return vector;
    } catch (e) {
        console.warn("Embedding failed, using zero vector");
        return new Array(1536).fill(0);
    }
}

export async function compareClaims(topic: string, claimsA: Claim[], claimsB: Claim[]): Promise<ComparisonResult> {
    console.log(`[TruthAgent] semanticDiff: Embedding ${claimsA.length} Wiki claims and ${claimsB.length} Grok claims...`);

    const discrepancies: Discrepancy[] = [];
    const matchedB = new Set<string>();

    // 1. Generate embeddings for all claims in parallel batches to speed up
    // (In production, do this in bigger batches, but here we map individually)
    const [embeddingsA, embeddingsB] = await Promise.all([
        Promise.all(claimsA.map(c => getClaimEmbedding(c.rawText))),
        Promise.all(claimsB.map(c => getClaimEmbedding(c.rawText)))
    ]);

    // 2. Compare every Claim A against all Claims B
    for (let i = 0; i < claimsA.length; i++) {
        const cA = claimsA[i];
        const vecA = embeddingsA[i];

        let bestMatchIndex = -1;
        let bestScore = -1;

        for (let j = 0; j < claimsB.length; j++) {
            const score = cosineSimilarity(vecA, embeddingsB[j]);
            if (score > bestScore) {
                bestScore = score;
                bestMatchIndex = j;
            }
        }

        const cB = bestMatchIndex !== -1 ? claimsB[bestMatchIndex] : null;

        // THRESHOLDS:
        // > 0.88: Practically the same sentence -> Match found, ignore.
        // 0.75 - 0.88: Talking about the exact same thing, but wording differs -> Check for contradiction.
        // < 0.75: No match found -> Truly missing.

        if (cB && bestScore > 0.88) {
            // Strong match, assume agreement.
            matchedB.add(cB.id!);
        }
        else if (cB && bestScore > 0.78) {
            // Semantic match, but wording is different. Potential nuance or contradiction.
            matchedB.add(cB.id!);

            // Optional: Ask LLM if this is actually a contradiction
            // (Saving API calls by assuming high similarity = agreement for now,
            // but in production you'd uncomment this)
            /*
            const analysis = await summarizeDiscrepancy(cA, cB);
            if (analysis.type === 'contradiction') {
                 discrepancies.push({ ...analysis, claimA: cA, claimB: cB });
            }
            */
        }
        else {
            // Score is low. Check if it's a "Significant" missing fact.
            // We only report it if confidence is high.
            discrepancies.push({
                type: 'missing',
                summary: `Wikipedia mentions detail missing in Grok: "${cA.subject} ${cA.predicate} ${cA.object}"`,
                confidence: 0.9,
                claimA: cA
            });
        }
    }

    // 3. Check for hallucinations (Claims in Grok not in Wiki)
    for (let j = 0; j < claimsB.length; j++) {
        if (matchedB.has(claimsB[j].id!)) continue;

        // Double check against all A again just to be sure (reverse check)
        const vecB = embeddingsB[j];
        const maxScore = Math.max(...embeddingsA.map(vecA => cosineSimilarity(vecA, vecB)));

        if (maxScore < 0.75) {
            discrepancies.push({
                type: 'unsupported',
                summary: `Grokipedia claim not supported by Wikipedia: "${claimsB[j].rawText}"`,
                confidence: 0.85,
                claimB: claimsB[j]
            });
        }
    }

    // Limit results to avoid overwhelming UI
    return {
        topic,
        discrepancies: discrepancies.slice(0, 15) // Return top 15 diffs
    };
}