import { NextResponse } from 'next/server';
import { runComparisonJob } from '@/server/truthAgent';
import { fetchWikipediaContent, fetchGrokipediaContent } from '@/lib/server/contentFetcher';
import { z } from 'zod';

const compareSchema = z.object({
    topic: z.string(),
    sourceA: z.string().optional(),
    sourceB: z.string().optional(),
    textA: z.string().optional(),
    textB: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { topic, sourceA = 'Wikipedia', sourceB = 'Grokipedia', textA: providedTextA, textB: providedTextB } = compareSchema.parse(body);

        // Fetch content if not provided
        const textA = providedTextA || await fetchWikipediaContent(topic);
        const textB = providedTextB || await fetchGrokipediaContent(topic);

        const jobId = await runComparisonJob(topic, sourceA, sourceB, textA, textB);

        return NextResponse.json({ jobId });
    } catch (error: any) {
        console.error('Compare API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

