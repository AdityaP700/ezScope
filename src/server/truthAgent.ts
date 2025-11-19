import { extractClaimsFromText } from '../lib/server/claimExtractor';
import { compareClaims } from '../lib/server/semanticDiff';
import { dkgClient } from '../lib/server/dkgClient';
import { createJob, updateJob } from '../lib/server/jobQueue';
import {
    createWikipediaAssetJsonLd,
    createGrokipediaAssetJsonLd,
    createCommunityNoteAssetJsonLd
} from '../lib/server/knowledgeAssets';

export async function runComparisonJob(topic: string, sourceA: string, sourceB: string, textA: string, textB: string) {
    const jobId = createJob();

    // Run in background
    (async () => {
        try {
            updateJob(jobId, 'processing');

            // 1. Extract Claims
            const claimsA = await extractClaimsFromText(textA);
            const claimsB = await extractClaimsFromText(textB);

            // 2. Convert to JSON-LD & Publish to DKG (KA1 & KA2)
            // KA1: Wikipedia
            const jsonLdA = createWikipediaAssetJsonLd(topic, claimsA, sourceA);
            const kaA = await dkgClient.publishKnowledgeAsset(jsonLdA);
            console.log(`Published KA1 (Wikipedia): ${kaA.ual}`);

            // KA2: Grokipedia
            const jsonLdB = createGrokipediaAssetJsonLd(topic, claimsB, sourceB);
            const kaB = await dkgClient.publishKnowledgeAsset(jsonLdB);
            console.log(`Published KA2 (Grokipedia): ${kaB.ual}`);

            // 3. Semantic Diff
            const comparison = await compareClaims(topic, claimsA, claimsB);

            // 4. Generate Community Notes (KA3) & Publish to DKG
            const notes = [];
            for (const diff of comparison.discrepancies) {
                const noteJsonLd = createCommunityNoteAssetJsonLd(
                    topic,
                    diff.type,
                    diff.summary,
                    [kaA.ual, kaB.ual],
                    diff.confidence,
                    '0' // Initial staked value
                );

                const kaNote = await dkgClient.publishKnowledgeAsset(noteJsonLd);
                console.log(`Published KA3 (Community Note): ${kaNote.ual}`);

                notes.push({
                    ...diff,
                    ual: kaNote.ual,
                    kaId: kaNote.kaId,
                    evidence: [kaA.ual, kaB.ual],
                    stakedValue: '0'
                });
            }

            updateJob(jobId, 'completed', { comparison, notes, kaA, kaB });

        } catch (error: any) {
            console.error('Job failed:', error);
            updateJob(jobId, 'failed', undefined, error.message);
        }
    })();

    return jobId;
}

