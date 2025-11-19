import { extractClaimsFromText } from '../src/lib/server/claimExtractor';

// Mock the LLM client
jest.mock('../src/lib/server/llmClient', () => ({
    extractClaims: jest.fn().mockResolvedValue([
        { subject: 'Earth', predicate: 'orbits', object: 'Sun', rawText: 'The Earth orbits the Sun.', confidence: 0.99 }
    ])
}));

describe('Claim Extractor', () => {
    it('should extract claims from text', async () => {
        const text = "The Earth orbits the Sun.";
        const claims = await extractClaimsFromText(text);

        expect(claims).toHaveLength(1);
        expect(claims[0].subject).toBe('Earth');
        expect(claims[0].predicate).toBe('orbits');
        expect(claims[0].object).toBe('Sun');
    });
});
