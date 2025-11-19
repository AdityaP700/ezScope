import { summarizeDiscrepancy } from './llmClient';
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

export async function compareClaims(topic: string, claimsA: Claim[], claimsB: Claim[]): Promise<ComparisonResult> {
    const discrepancies: Discrepancy[] = [];

    // Simple O(N*M) comparison for now - in production use vector embeddings to find nearest neighbors
    // Here we just assume if subject and object are somewhat similar, they are comparable

    const matchedB = new Set<string>();

    for (const cA of claimsA) {
        let bestMatch: Claim | null = null;
        let bestScore = 0;

        for (const cB of claimsB) {
            if (matchedB.has(cB.id!)) continue;

            const score = calculateSimilarity(cA, cB);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = cB;
            }
        }

        if (bestMatch && bestScore > 0.6) {
            matchedB.add(bestMatch.id!);
            // Check for contradiction
            if (bestScore < 0.9) { // High similarity but not exact might imply nuance difference
                const summary = await summarizeDiscrepancy(cA, bestMatch);
                if (summary.type !== 'missing') { // 'missing' from summarizeDiscrepancy usually means no conflict, but here we use it as 'no discrepancy found'
                    discrepancies.push({
                        ...summary,
                        claimA: cA,
                        claimB: bestMatch
                    });
                }
            }
        } else {
            // Missing in B
            discrepancies.push({
                type: 'missing',
                summary: `Claim in source A not found in source B: "${cA.rawText}"`,
                confidence: 0.9,
                claimA: cA
            });
        }
    }

    // Check for claims in B missing in A
    for (const cB of claimsB) {
        if (!matchedB.has(cB.id!)) {
            discrepancies.push({
                type: 'missing',
                summary: `Claim in source B not found in source A: "${cB.rawText}"`,
                confidence: 0.9,
                claimB: cB
            });
        }
    }

    return { topic, discrepancies };
}

function calculateSimilarity(a: Claim, b: Claim): number {
    // Mock similarity: check word overlap
    const wordsA = new Set(a.rawText.toLowerCase().split(/\W+/));
    const wordsB = new Set(b.rawText.toLowerCase().split(/\W+/));
    const intersection = new Set(Array.from(wordsA).filter(x => wordsB.has(x)));
    return (2 * intersection.size) / (wordsA.size + wordsB.size);
}
