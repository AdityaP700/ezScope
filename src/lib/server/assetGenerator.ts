import { Claim } from './claimExtractor';
import { Discrepancy } from './semanticDiff';

export interface TruthAssets {
    wikipediaKA: any;
    grokipediaKA: any;
    communityNoteKA: any;
}

export function generateKnowledgeAssets(
    topic: string,
    claimsA: Claim[],
    claimsB: Claim[],
    discrepancies: Discrepancy[],
    jobId: string // <--- Added jobId to generate stable IDs
): TruthAssets {
    const timestamp = new Date().toISOString();

    // Base URIs for this specific job execution
    // In production, you might use your domain: https://truthscope.io/graph/...
    const baseUri = `urn:truthscope:job:${jobId}`;

    // 1. Wikipedia Knowledge Asset (The Baseline)
    const wikiAssetId = `${baseUri}:wiki`;
    const wikipediaKA = {
        "@context": "https://schema.org",
        "@id": wikiAssetId,
        "@type": "Article",
        "headline": `Wikipedia Analysis: ${topic}`,
        "about": { "@type": "Thing", "name": topic },
        "author": { "@type": "Organization", "name": "Wikipedia" },
        "dateCreated": timestamp,
        "mentions": claimsA.map((c, i) => ({
            "@type": "Statement",
            "@id": `${wikiAssetId}#claim-${i}`, // Stable Claim ID
            "text": c.rawText,
            "mainEntity": { "@type": "Thing", "name": c.subject },
            "description": `${c.predicate} ${c.object}`
        }))
    };

    // 2. Grokipedia Knowledge Asset (The AI Subject)
    const grokAssetId = `${baseUri}:grok`;
    const grokipediaKA = {
        "@context": "https://schema.org",
        "@id": grokAssetId,
        "@type": "Article",
        "headline": `Grokipedia Generation: ${topic}`,
        "about": { "@type": "Thing", "name": topic },
        "author": { "@type": "Organization", "name": "Grokipedia AI" },
        "dateCreated": timestamp,
        "mentions": claimsB.map((c, i) => ({
            "@type": "Statement",
            "@id": `${grokAssetId}#claim-${i}`, // Stable Claim ID
            "text": c.rawText,
            "mainEntity": { "@type": "Thing", "name": c.subject }
        }))
    };

    // 3. Community Note (The Comparison Result)
    const noteAssetId = `${baseUri}:note`;
    const communityNoteKA = {
        "@context": ["https://schema.org", { "dkg": "http://dkg.origintrail.io/ontology#" }],
        "@id": noteAssetId,
        "@type": "Review",
        "name": `TruthScope Discrepancy Report: ${topic}`,
        "itemReviewed": {
            "@id": grokAssetId, // Links explicitly to the Grok asset above
            "@type": "Article",
            "name": "Grokipedia Content"
        },
        "reviewRating": {
            "@type": "Rating",
            "ratingValue": calculateTrustScore(claimsA.length, discrepancies.length),
            "bestRating": "100",
            "worstRating": "0",
            "description": "Trust Alignment Score based on factual coverage against Wikipedia"
        },
        "author": {
            "@type": "Organization",
            "name": "TruthScope Agent"
        },
        "analysis": discrepancies.map(d => {
            // Try to find the specific Wikipedia claim ID that proves this discrepancy
            // This creates the "Edge" in the Knowledge Graph: Discrepancy -> Evidence
            let evidenceId = null;
            if (d.claimA) {
                // Find index of claimA in original array to reconstruct ID
                const idx = claimsA.findIndex(c => c.id === d.claimA?.id);
                if (idx !== -1) evidenceId = `${wikiAssetId}#claim-${idx}`;
            }

            return {
                "@type": "ClaimReview",
                "reviewAspect": d.type,
                "claimReviewed": d.claimB?.rawText || "Missing Context",
                "reviewBody": d.summary,
                "confidence": d.confidence,
                "dkg:evidence": evidenceId ? { "@id": evidenceId } : undefined
            };
        }),
        "dateCreated": timestamp
    };

    return { wikipediaKA, grokipediaKA, communityNoteKA };
}

function calculateTrustScore(totalBaseline: number, discrepancies: number): number {
    if (totalBaseline === 0) return 0;
    const score = 100 - ((discrepancies / totalBaseline) * 100);
    return Math.max(0, Math.round(score));
}