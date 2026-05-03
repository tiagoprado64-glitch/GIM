import Stripe from 'stripe';

let stripePromise: Stripe | null = null;

export const getStripeClient = () => {
  if (!stripePromise) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is missing');
    }
    stripePromise = new Stripe(key, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  return stripePromise;
};
