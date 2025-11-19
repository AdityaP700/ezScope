import { extractClaims } from './llmClient';

export interface Claim {
    id?: string;
    subject: string;
    predicate: string;
    object: string;
    rawText: string;
    confidence?: number;
}

export async function extractClaimsFromText(text: string): Promise<Claim[]> {
    const rawClaims = await extractClaims(text);

    return rawClaims.map((c: any, index: number) => ({
        id: `claim-${Date.now()}-${index}`,
        subject: c.subject,
        predicate: c.predicate,
        object: c.object,
        rawText: c.rawText,
        confidence: c.confidence || 0.9
    }));
}
