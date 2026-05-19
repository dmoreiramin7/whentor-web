import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    console.error('Webhook signature error:', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const serviceClient = await createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (userId && session.subscription) {
          await serviceClient.from('profiles').update({
            tier: 'pro',
            stripe_subscription_id: session.subscription as string,
            stripe_price_id: session.metadata?.price_id,
            subscription_status: 'active',
          }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          const isActive = ['active', 'trialing'].includes(sub.status);
          await serviceClient.from('profiles').update({
            tier: isActive ? 'pro' : 'free',
            subscription_status: sub.status,
          }).eq('stripe_subscription_id', sub.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await serviceClient.from('profiles').update({
          tier: 'free',
          stripe_subscription_id: null,
          subscription_status: 'cancelled',
        }).eq('stripe_subscription_id', sub.id);
        break;
      }
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
  }

  return NextResponse.json({ received: true });
}
