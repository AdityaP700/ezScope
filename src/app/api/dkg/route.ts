import { NextResponse } from 'next/server';
import { dkgClient } from '@/lib/server/dkgClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing KA id' }, { status: 400 });
    }

    try {
        const ka = await dkgClient.getKnowledgeAsset(id);
        return NextResponse.json(ka);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
}
