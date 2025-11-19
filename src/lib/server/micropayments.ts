export async function createPaymentIntent(amount: number) {
  console.log(`Creating payment intent for ${amount} tokens`);
  return { id: 'pi_' + Math.random().toString(36).slice(2), clientSecret: 'secret_' };
}

export async function verifyPayment(paymentId: string) {
  console.log(`Verifying payment ${paymentId}`);
  return true;
}
