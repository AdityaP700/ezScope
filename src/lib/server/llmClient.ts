import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
        throw new Error('OPENAI_API_KEY is not set');
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
        throw error;
    }
}

export async function generateRdfFromClaims(topic: string, claims: any[], source: string): Promise<{ jsonld: any; triples: Array<[string, string, string]> }> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
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
        // Extract triples from JSON-LD (simplified extraction)
        const triples: Array<[string, string, string]> = claims.map((c: any) => [c.subject, c.predicate, c.object]);
        return { jsonld, triples };
    } catch (error) {
        console.error('LLM RDF generation failed:', error);
        throw error;
    }
}

export async function summarizeDiscrepancy(claimA: any, claimB: any): Promise<{ type: 'missing' | 'contradiction' | 'bias' | 'unsupported' | 'citation_absent'; summary: string; confidence: number }> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const prompt = `
    Compare the following two claims and determine if there is a discrepancy.
    Claim A: ${JSON.stringify(claimA)}
    Claim B: ${JSON.stringify(claimB)}
    
    Return a JSON object with:
    - type: one of 'missing', 'contradiction', 'bias', 'unsupported', 'citation_absent'
    - summary: A brief explanation of the discrepancy.
    - confidence: A number between 0 and 1.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: "You are a discrepancy detection assistant." },
                { role: 'user', content: prompt },
            ],
            temperature: 0,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No content from LLM');
        return JSON.parse(content);
    } catch (error) {
        console.error('Discrepancy summary failed:', error);
        throw error;
    }
}
