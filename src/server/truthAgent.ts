import { createJob, updateJob } from '@/lib/server/jobQueue';
import { extractClaimsFromText } from '@/lib/server/claimExtractor';
import { convertToRdf } from '@/lib/server/rdfConverter';
import { compareClaims } from '@/lib/server/semanticDiff';
import { publishKnowledgeAsset, isDkgConfigured } from '@/lib/server/dkgClient';
import { generateKnowledgeAssets } from '@/lib/server/assetGenerator';

interface ComparisonJobResult {
    topic: string;
    sourceA: string;
    sourceB: string;
    claimsA: any[];
    claimsB: any[];
    discrepancies: any[];
    assets?: { sourceA?: any; sourceB?: any; notes?: any[] };
}

export async function runComparisonJob(
    topic: string,
    sourceA: string,
    sourceB: string,
    textA: string | null,
    textB: string | null
) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing; cannot run comparison job');

    // create job record immediately
    const jobId = await createJob({ status: 'processing', topic, sourceA, sourceB });
    console.log('[TruthAgent] created job', jobId);

    // start background processing (do not await) so caller receives jobId immediately
    (async () => {
        try {
            console.log('[TruthAgent] Source lengths', {
                topic,
                sourceA,
                sourceB,
                textALen: textA ? textA.length : 0,
                textBLen: textB ? textB.length : 0,
                textASample: textA?.slice(0, 200),
                textBSample: textB?.slice(0, 200)
            });

            // ensure we have text placeholders
            const wikiText = textA || '';
            const grokText = textB || '';

            // extract claims (pass jobId so claim IDs are traceable)
            const claimsA = await extractClaimsFromText(wikiText, topic, jobId);
            const claimsB = await extractClaimsFromText(grokText, topic, jobId);

            // convert to RDF/JSON-LD (if used)
            const rdfA = await convertToRdf(topic, claimsA, sourceA);
            const rdfB = await convertToRdf(topic, claimsB, sourceB);

            // semantic diff / comparison
            const comparison = await compareClaims(topic, claimsA, claimsB);

            // Generate JSON-LD Knowledge Assets from claims + discrepancies
            const assets = generateKnowledgeAssets(topic, claimsA, claimsB, comparison.discrepancies || [],jobId);

            // Optionally publish to DKG if configured. Store publish responses separately
            const published: any = {};
            if (isDkgConfigured()) {
                try {
                    published.wikipedia = await publishKnowledgeAsset(assets.wikipediaKA);
                } catch (pubErr) {
                    console.warn('[TruthAgent] publish wikipediaKA failed', (pubErr as any)?.message);
                }
                try {
                    published.grokipedia = await publishKnowledgeAsset(assets.grokipediaKA);
                } catch (pubErr) {
                    console.warn('[TruthAgent] publish grokipediaKA failed', (pubErr as any)?.message);
                }
                try {
                    published.communityNote = await publishKnowledgeAsset(assets.communityNoteKA);
                } catch (pubErr) {
                    console.warn('[TruthAgent] publish communityNoteKA failed', (pubErr as any)?.message);
                }
            }

            // update job as completed with result
            await updateJob(jobId, {
                status: 'completed',
                result: {
                    topic,
                    sourceA,
                    sourceB,
                    claimsA,
                    claimsB,
                    discrepancies: comparison.discrepancies ?? comparison,
                    assets: assets,
                    published: published
                }
            });

            console.log('[TruthAgent] job completed', jobId);
        } catch (e: any) {
            console.error('[TruthAgent] job error', jobId, e);
            await updateJob(jobId, { status: 'error', error: (e && e.message) ? e.message : String(e) });
        }
    })();

    // return jobId immediately so caller can poll /api/job
    return jobId;
}

