// Stripe API route for PaymentIntent creation
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = 'sk_test_51RePbIDH5IrdUh930PCf0ZbalzZc9ZgXbUX9xDYs7huCpRrnK5w3oGtuRhCFEolNk5BbtfnivxYIBywqZYfniyGk00Z7THoqHZ';
const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    if (!amount || isNaN(amount) || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    // Stripe expects amount in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'usd',
      payment_method_types: ['card'],
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
