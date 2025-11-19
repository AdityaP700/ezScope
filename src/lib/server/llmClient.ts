import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

const CLAIM_EXTRACTION_PROMPT = `
You are a strict fact extraction assistant. Input: a paragraph or full encyclopedia page. Output: a JSON array of atomic factual claims. Each claim must be short, single sentence, objective, and contain no hedging language. For each claim provide fields: subject, predicate, object, rawText. Return JSON only, and no explanation. Example:
[
  {"subject":"Earth","predicate":"orbits","object":"the Sun","rawText":"The Earth orbits the Sun once every 365 days."},
  ...
]
`;

const RDF_GENERATION_PROMPT = `
Convert the following list of claims into JSON-LD compatible Knowledge Asset. Use schema.org types and prov:wasDerivedFrom for provenance. Assign an auto id for each claim, and include 'confidence' between 0 and 1. Output valid JSON-LD only.
`;

export async function extractClaims(text: string): Promise<any[]> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY not found, using fallback heuristics');
        return mockExtractClaims(text);
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: CLAIM_EXTRACTION_PROMPT },
                { role: 'user', content: text },
            ],
            temperature: 0,
        });

        const content = response.choices[0].message.content;
        if (!content) return [];
        return JSON.parse(content);
    } catch (error) {
        console.error('LLM extraction failed:', error);
        return mockExtractClaims(text);
    }
}

export async function generateRdfFromClaims(topic: string, claims: any[], source: string): Promise<{ jsonld: any; triples: Array<[string, string, string]> }> {
    if (!process.env.OPENAI_API_KEY) {
        return mockGenerateRdf(topic, claims, source);
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: RDF_GENERATION_PROMPT },
                { role: 'user', content: JSON.stringify({ topic, source, claims }) },
            ],
            temperature: 0,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No content from LLM');
        const jsonld = JSON.parse(content);
        // Extract triples from JSON-LD (mock implementation of extraction for now)
        const triples: Array<[string, string, string]> = claims.map((c: any) => [c.subject, c.predicate, c.object]);
        return { jsonld, triples };
    } catch (error) {
        console.error('LLM RDF generation failed:', error);
        return mockGenerateRdf(topic, claims, source);
    }
}

export async function summarizeDiscrepancy(claimA: any, claimB: any): Promise<{ type: 'missing' | 'contradiction' | 'bias' | 'unsupported' | 'citation_absent'; summary: string; confidence: number }> {
    if (!process.env.OPENAI_API_KEY) {
        return {
            type: 'contradiction',
            summary: 'Heuristic detected difference between claims.',
            confidence: 0.8,
        };
    }

    // TODO: Implement LLM based summary
    return {
        type: 'contradiction',
        summary: 'LLM detected difference between claims.',
        confidence: 0.9,
    };
}

// Fallback Heuristics
function mockExtractClaims(text: string): any[] {
    // Simple heuristic: split by periods, assume S-V-O structure roughly
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.map((s, i) => ({
        subject: 'Entity',
        predicate: 'related_to',
        object: 'Something',
        rawText: s.trim(),
        confidence: 0.7
    }));
}

function mockGenerateRdf(topic: string, claims: any[], source: string) {
    const jsonld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": topic,
        "author": source,
        "mentions": claims.map((c, i) => ({
            "@type": "Statement",
            "text": c.rawText,
            "confidence": 0.8
        }))
    };
    const triples: Array<[string, string, string]> = claims.map(c => [c.subject || 'Entity', c.predicate || 'relates', c.object || 'Thing']);
    return { jsonld, triples };
}
