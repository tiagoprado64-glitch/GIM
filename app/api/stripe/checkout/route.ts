import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'FitFlow Pro - Plano Mensal',
              description: 'Acesso total a IA, treinos ilimitados e relatórios avançados.',
            },
            unit_amount: 1990, // R$ 19,90
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/profile`,
      customer_email: email,
      metadata: { userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
