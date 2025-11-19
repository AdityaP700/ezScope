import { extractClaimsFromText } from '../lib/server/claimExtractor';
import { convertToRdf } from '../lib/server/rdfConverter';
import { compareClaims } from '../lib/server/semanticDiff';
import { dkgClient } from '../lib/server/dkgClient';
import { createJob, updateJob } from '../lib/server/jobQueue';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function runComparisonJob(topic: string, sourceA: string, sourceB: string, textA: string, textB: string) {
    const jobId = createJob();

    // Run in background
    (async () => {
        try {
            updateJob(jobId, 'processing');

            // 1. Extract Claims
            const claimsA = await extractClaimsFromText(textA);
            const claimsB = await extractClaimsFromText(textB);

            // 2. Convert to RDF & Publish to DKG (Mock)
            const rdfA = await convertToRdf(topic, claimsA, sourceA);
            const rdfB = await convertToRdf(topic, claimsB, sourceB);

            const kaA = await dkgClient.publishKnowledgeAsset(rdfA.jsonld);
            const kaB = await dkgClient.publishKnowledgeAsset(rdfB.jsonld);

            // 3. Semantic Diff
            const comparison = await compareClaims(topic, claimsA, claimsB);

            // 4. Generate Community Notes
            const notes = [];
            for (const diff of comparison.discrepancies) {
                const note = await prisma.communityNote.create({
                    data: {
                        topic,
                        finding: diff.type,
                        evidence: JSON.stringify([kaA.kaId, kaB.kaId]),
                        confidence: diff.confidence,
                        stakedValue: '0',
                        reputationScore: 0
                    }
                });
                notes.push(note);
            }

            updateJob(jobId, 'completed', { comparison, notes, kaA, kaB });

        } catch (error: any) {
            console.error('Job failed:', error);
            updateJob(jobId, 'failed', undefined, error.message);
        }
    })();

    return jobId;
}
