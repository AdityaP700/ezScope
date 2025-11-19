import { convertToRdf } from '../src/lib/server/rdfConverter';

// Mock the LLM client
jest.mock('../src/lib/server/llmClient', () => ({
    generateRdfFromClaims: jest.fn().mockResolvedValue({
        jsonld: { "@type": "Article", "headline": "Test" },
        triples: [['Earth', 'orbits', 'Sun']]
    })
}));

describe('RDF Converter', () => {
    it('should convert claims to RDF', async () => {
        const claims = [{ id: '1', subject: 'Earth', predicate: 'orbits', object: 'Sun', rawText: 'Test' }];
        const result = await convertToRdf('Test', claims, 'Wiki');

        expect(result.jsonld).toBeDefined();
        expect(result.triples).toHaveLength(1);
    });
});
