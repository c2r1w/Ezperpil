// Stripe Checkout API route
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Custom Payment' },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/stripe-test?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/stripe-test?canceled=true`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
