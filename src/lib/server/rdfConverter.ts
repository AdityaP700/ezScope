import { generateRdfFromClaims } from './llmClient';
import { Claim } from './claimExtractor';

export async function convertToRdf(topic: string, claims: Claim[], source: string) {
    return await generateRdfFromClaims(topic, claims, source);
}
