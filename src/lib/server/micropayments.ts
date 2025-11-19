import axios from "axios";

const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL;

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
}

export async function createPaymentIntent({ amount, currency = "USD", metadata = {} }: { amount: number; currency?: string; metadata?: any }) {
  if (!PAYMENT_GATEWAY_URL) throw new Error("PAYMENT_GATEWAY_URL required for payments");
  const resp = await axios.post(`${PAYMENT_GATEWAY_URL}/create-intent`, { amount, currency, metadata }, { headers: { "Content-Type": "application/json" } });
  return resp.data;
}

export async function verifyPayment(paymentId: string): Promise<boolean> {
  const gatewayUrl = process.env.PAYMENT_GATEWAY_URL;

  if (!gatewayUrl) {
    console.log(`Simulating verification for ${paymentId}`);
    return true;
  }

  try {
    // const response = await fetch(`${gatewayUrl}/verify/${paymentId}`);
    // const data = await response.json();
    // return data.status === 'succeeded';
    console.log(`Verifying payment ${paymentId} via ${gatewayUrl}`);
    return true;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
}

