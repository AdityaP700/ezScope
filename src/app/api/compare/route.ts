import { NextResponse } from 'next/server';
import { runComparisonJob } from '@/server/truthAgent';
import { z } from 'zod';

const compareSchema = z.object({
    topic: z.string(),
    sourceA: z.string(),
    sourceB: z.string(),
    textA: z.string(),
    textB: z.string(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { topic, sourceA, sourceB, textA, textB } = compareSchema.parse(body);

        const jobId = await runComparisonJob(topic, sourceA, sourceB, textA, textB);

        return NextResponse.json({ jobId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
