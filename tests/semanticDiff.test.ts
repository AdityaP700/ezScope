import { compareClaims } from '../src/lib/server/semanticDiff';

// Mock the LLM client
jest.mock('../src/lib/server/llmClient', () => ({
    summarizeDiscrepancy: jest.fn().mockResolvedValue({
        type: 'contradiction',
        summary: 'Mismatch found',
        confidence: 0.9
    })
}));

describe('Semantic Diff', () => {
    it('should identify missing claims', async () => {
        const claimsA = [{ id: '1', subject: 'A', predicate: 'is', object: 'B', rawText: 'A is B' }];
        const claimsB: any[] = [];

        const result = await compareClaims('Topic', claimsA, claimsB);

        expect(result.discrepancies).toHaveLength(1);
        expect(result.discrepancies[0].type).toBe('missing');
    });
});
