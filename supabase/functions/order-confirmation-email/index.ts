/// <reference lib="deno.ns" />

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SB_URL = Deno.env.get('GRANE_SUPABASE_URL');
const SB_SERVICE_ROLE = Deno.env.get('GRANE_SERVICE_ROLE_KEY');

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

function buildOrderSummarySection(summaryLines: string[]) {
  if (!summaryLines.length) return '';

  const itemsHtml = summaryLines
    .map((line) => `<p style="margin: 0 0 8px; color: #2B2620;">${line}</p>`)
    .join('');

  return `
    <div style="background: #FFFFFF; border: 1px solid #E7E0D6; border-radius: 14px; padding: 16px 18px; margin: 0 0 18px;">
      <p style="margin: 0 0 10px; font-family: Georgia, 'Times New Roman', serif;">
        🧾 Order Summary
      </p>
      ${itemsHtml}
    </div>
  `;
}

async function sendWithResend({
  toEmail,
  subject,
  html,
}: {
  toEmail: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');

  const payload = {
    from: 'Grane Support <onboarding@resend.dev>',
    to: [toEmail],
    subject,
    html,
    reply_to: 'support@granebakery.com',
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

    let orderSummaryLines: string[] = [];

    if (payload.order_id) {
      if (!SB_URL || !SB_SERVICE_ROLE) {
        console.warn(
          'Missing GRANE_SUPABASE_URL or GRANE_SERVICE_ROLE_KEY; skipping order summary'
        );
      } else {
        try {
          const supabase = createClient(SB_URL, SB_SERVICE_ROLE, {
            auth: { persistSession: false },
          });

          const { data: orderItems, error: orderItemsError } = await supabase
            .from('order_items')
            .select('quantity, product_id, products(name)')
            .eq('order_id', payload.order_id);

          if (orderItemsError) {
            console.warn('Order summary lookup failed:', orderItemsError.message);
          } else if (orderItems && orderItems.length > 0) {
            const directLines = orderItems
              .map((item) => {
                const productName =
                  (item as { products?: { name?: string | null } })?.products?.name ?? null;
                if (!productName) return null;
                return `${productName} ×${item.quantity}`;
              })
              .filter((line): line is string => Boolean(line));

            if (directLines.length) {
              orderSummaryLines = directLines.sort((a, b) => a.localeCompare(b));
            } else {
              const productIds = Array.from(
                new Set(
                  orderItems
                    .map((item) => item.product_id)
                    .filter((id): id is string => Boolean(id))
                )
              );

              if (productIds.length) {
                const { data: products, error: productsError } = await supabase
                  .from('products')
                  .select('id, name')
                  .in('id', productIds);

                if (productsError) {
                  console.warn('Order summary product lookup failed:', productsError.message);
                } else if (products && products.length > 0) {
                  const nameById = new Map(products.map((product) => [product.id, product.name]));

                  orderSummaryLines = orderItems
                    .map((item) => {
                      const name = nameById.get(item.product_id ?? '') ?? null;
                      if (!name) return null;
                      return `${name} ×${item.quantity}`;
                    })
                    .filter((line): line is string => Boolean(line))
                    .sort((a, b) => a.localeCompare(b));
                }
              }
            }
          }
        } catch (err) {
          console.warn('Order summary fetch error:', err);
        }
      }
    }

    console.log('order_summary_count', orderSummaryLines.length);

    if (payload.email) {
      const formattedBakeDay = formatBakeDay(payload.bake_day_date);
      const subject = `Your Grane order is confirmed — pickup ${formattedBakeDay} 🍞`;
      const firstName = payload.name?.trim().split(/\s+/)[0] ?? '';
      const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
      const orderRef = payload.order_id?.slice(0, 8).toUpperCase();
      const orderRefLine = orderRef
        ? `<p style="margin: 0 0 16px; color: #5C5248;">
            Your order reference: <strong style="letter-spacing: 0.6px;">${orderRef}</strong>
          </p>`
        : '';
      const orderSummarySection = buildOrderSummarySection(orderSummaryLines);
      const html = `
        <div style="background: #FFFBF5; padding: 28px 16px; color: #2B2620;">
          <div style="max-width: 560px; margin: 0 auto; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
            <h2 style="font-family: Georgia, 'Times New Roman', serif; margin: 0 0 8px;">
              Your Grane order is confirmed 🍞
            </h2>
            <div style="height: 1px; background: #E7E0D6; margin: 0 0 18px;"></div>
            <p style="margin: 0 0 10px; color: #2B2620;">${greeting}</p>
            <p style="margin: 0 0 18px; color: #5C5248;">
              Thanks so much for your order! Your bread will be freshly baked and ready for pickup on:
            </p>
            <div style="background: #FFFFFF; border: 1px solid #E7E0D6; border-radius: 14px; padding: 16px 18px; margin: 0 0 18px;">
              <p style="margin: 0 0 10px; font-family: Georgia, 'Times New Roman', serif;">
                📍 Pickup Details
              </p>
              <p style="margin: 0 0 8px;">
                <strong>Date:</strong> ${formattedBakeDay}
              </p>
              <p style="margin: 0 0 8px;">
                <strong>Time:</strong> ⏰ Anytime between 9:00 AM – 5:00 PM
              </p>
              <p style="margin: 0;">
                <strong>Pickup Location:</strong><br />
                311 E 200 S<br />
                Provo, UT 84606
              </p>
            </div>
            ${orderSummarySection}
            ${orderRefLine}
            <p style="margin: 0 0 14px; color: #5C5248;">
              Just stop by anytime during the pickup window — no appointment needed. I’ll have your order ready.
            </p>
            <p style="margin: 0 0 20px; color: #5C5248;">
              Questions? Reply to this email or contact support@granebakery.com.
            </p>
            <p style="margin: 0; color: #2B2620;">— Dane</p>
            <p style="margin: 0; color: #2B2620;">Grane</p>
          </div>
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
