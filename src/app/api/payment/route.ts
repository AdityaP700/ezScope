import { NextResponse } from 'next/server';
import { createPaymentIntent, verifyPayment } from '@/lib/server/micropayments';

export async function POST(request: Request) {
    try {
        const { amount } = await request.json();
        const intent = await createPaymentIntent(amount || 10);
        return NextResponse.json(intent);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
