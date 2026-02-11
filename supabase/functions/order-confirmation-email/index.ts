/// <reference lib="deno.ns" />

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

import { corsHeaders } from '../_shared/cors.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

function formatBakeDay(dateString?: string | null) {
  if (!dateString) return 'your selected bake day';

  const parsedDate = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime())) return 'your selected bake day';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate);
}

async function sendWithResend(
  { toEmail, subject, html }: { toEmail: string; subject: string; html: string }
) {
  if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');

  const payload = {
    from: 'Grane <onboarding@resend.dev>',
    to: [toEmail],
    subject,
    html,
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error (${res.status}): ${text}`);
  }

  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', {
      status: 400,
      headers: corsHeaders,
    });
  }

  const rawBody = await req.text();

  try {
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    if (event.type !== 'checkout.session.completed') {
      return new Response('ignored', { status: 200, headers: corsHeaders });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const payload = {
      session_id: session.id ?? null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      name: session.customer_details?.name ?? null,
      bake_day_date: session.metadata?.bake_day_date ?? null,
      order_id: session.metadata?.order_id ?? null,
    };

    console.log(payload);

    if (payload.email) {
      const formattedBakeDay = formatBakeDay(payload.bake_day_date);
      const subject = `Your Grane order is confirmed 🍞 (${formattedBakeDay})`;
      const html = `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
          <h2>Your Grane order is confirmed 🍞</h2>
          <p><strong>Pickup details</strong></p>
          <p>
            Date: ${formattedBakeDay}<br />
            Time: Anytime between 9:00 AM – 5:00 PM<br />
            Location: Pickup is at my home (address will be provided soon).
          </p>
          <p>Come anytime during the pickup window — no appointment needed.</p>
          <p>— Dane, Grane</p>
        </div>
      `;

      try {
        await sendWithResend({ toEmail: payload.email, subject, html });
      } catch (err) {
        console.error('Resend send error:', err);
      }
    } else {
      console.warn('Missing customer email; skipping Resend send');
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
