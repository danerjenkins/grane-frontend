import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REMINDER_SECRET = Deno.env.get('GRANE_REMINDER_SECRET');
const SB_URL = Deno.env.get('GRANE_SUPABASE_URL');
const SB_SERVICE_ROLE = Deno.env.get('GRANE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-reminder-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getDenverTomorrowYmd() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Failed to compute current Denver date');
  }

  const todayYmd = `${year}-${month}-${day}`;
  const tomorrow = new Date(`${todayYmd}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const tomorrowYear = String(tomorrow.getUTCFullYear());
  const tomorrowMonth = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
  const tomorrowDay = String(tomorrow.getUTCDate()).padStart(2, '0');

  return `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
}

function getDenverTodayYmd() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Failed to compute current Denver date');
  }

  return `${year}-${month}-${day}`;
}

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
    .map((line) => `<p style="margin: 0 0 6px; font-size: 14px; color: #2B1F16;">${line}</p>`)
    .join('');

  return `
    <div style="background: #FFFCF7; border: 1px solid #EFE7DD; border-radius: 14px; padding: 14px; margin: 0 0 16px;">
      <p style="margin: 0 0 10px; font-family: Georgia, 'Times New Roman', serif; font-weight: 700; color: #2B1F16;">
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

async function fetchOrderSummaryLines(supabase: ReturnType<typeof createClient>, orderId: string) {
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('quantity, product_id, products(name)')
    .eq('order_id', orderId);

  if (orderItemsError) {
    console.warn('Order summary lookup failed:', orderItemsError.message);
    return [];
  }

  if (!orderItems || orderItems.length === 0) {
    return [];
  }

  const directLines = orderItems
    .map((item) => {
      const productName = (item as { products?: { name?: string | null } })?.products?.name ?? null;
      if (!productName) return null;
      return `${productName} ×${item.quantity}`;
    })
    .filter((line): line is string => Boolean(line));

  if (directLines.length) {
    return directLines.sort((a, b) => a.localeCompare(b));
  }

  const productIds = Array.from(
    new Set(orderItems.map((item) => item.product_id).filter((id): id is string => Boolean(id)))
  );

  if (!productIds.length) {
    return [];
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .in('id', productIds);

  if (productsError) {
    console.warn('Order summary product lookup failed:', productsError.message);
    return [];
  }

  if (!products || products.length === 0) {
    return [];
  }

  const nameById = new Map(products.map((product) => [product.id, product.name]));

  return orderItems
    .map((item) => {
      const name = nameById.get(item.product_id ?? '') ?? null;
      if (!name) return null;
      return `${name} ×${item.quantity}`;
    })
    .filter((line): line is string => Boolean(line))
    .sort((a, b) => a.localeCompare(b));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'method not allowed' });
  }

  if (!REMINDER_SECRET) {
    return jsonResponse(500, {
      ok: false,
      error: 'Missing GRANE_REMINDER_SECRET',
    });
  }

  const providedSecret = req.headers.get('x-reminder-secret');
  if (!providedSecret || providedSecret !== REMINDER_SECRET) {
    return jsonResponse(401, { ok: false, error: 'unauthorized' });
  }

  if (!SB_URL || !SB_SERVICE_ROLE) {
    return jsonResponse(500, {
      ok: false,
      error: 'Missing GRANE_SUPABASE_URL or GRANE_SERVICE_ROLE_KEY',
    });
  }

  if (!RESEND_API_KEY) {
    return jsonResponse(500, {
      ok: false,
      error: 'Missing RESEND_API_KEY',
    });
  }

  const supabase = createClient(SB_URL, SB_SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const testToday = Deno.env.get('GRANE_REMINDER_TEST_TODAY') === 'true';
  const targetDate = testToday ? getDenverTodayYmd() : getDenverTomorrowYmd();

  const { data, error } = await supabase
    .from('orders')
    .select('id, pickup_reminder_sent_at, stripe_status, bake_days (date), users (email)')
    .eq('bake_days.date', targetDate)
    .is('pickup_reminder_sent_at', null)
    .eq('stripe_status', 'paid');

  if (error) {
    return jsonResponse(500, {
      ok: false,
      error: `Failed to query orders: ${error.message}`,
    });
  }

  let skipped = 0;
  const normalized = (data ?? []).reduce(
    (acc: { order_id: string; bake_day_date: string; customer_email: string }[], row) => {
      const bakeDay = Array.isArray(row.bake_days) ? row.bake_days[0] : row.bake_days;
      const user = Array.isArray(row.users) ? row.users[0] : row.users;
      const bakeDayDate = bakeDay?.date ?? null;
      const email = user?.email ?? null;

      if (!email) {
        console.warn('Skipping order without user email:', row.id);
        skipped += 1;
        return acc;
      }

      if (!bakeDayDate) {
        console.warn('Skipping order without bake day date:', row.id);
        skipped += 1;
        return acc;
      }

      if (row.pickup_reminder_sent_at) {
        console.warn('Skipping order with reminder already sent:', row.id);
        skipped += 1;
        return acc;
      }

      acc.push({
        order_id: row.id,
        bake_day_date: bakeDayDate,
        customer_email: email,
      });
      return acc;
    },
    []
  );

  let emailed = 0;
  let failed = 0;

  for (const order of normalized) {
    try {
      const formattedBakeDay = formatBakeDay(order.bake_day_date);
      const subject = `Reminder: Grane pickup is tomorrow (${formattedBakeDay}) 🍞`;
      const firstName = order.customer_email.split('@')[0]?.split('.')[0] ?? '';
      const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
      const orderRef = order.order_id.slice(0, 8).toUpperCase();
      const orderRefLine = orderRef
        ? `<p style="margin: 0 0 16px; color: #5C5248; font-size: 14px;">
            Your order reference: <strong style="letter-spacing: 0.6px;">${orderRef}</strong>
          </p>`
        : '';
      const summaryLines = await fetchOrderSummaryLines(supabase, order.order_id);
      const orderSummarySection = buildOrderSummarySection(summaryLines);
      const html = `
        <div style="background: #FBF7F0; padding: 24px 12px; color: #2B2620;">
          <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E7E0D6; border-radius: 16px; padding: 24px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
            <h1 style="font-family: Georgia, 'Times New Roman', serif; margin: 0 0 8px; font-size: 24px; font-weight: 700; line-height: 1.2;">
              Pickup reminder for tomorrow 🍞
            </h1>
            <p style="margin: 0 0 16px; color: #5B4B3A; font-size: 14px; line-height: 1.5;">
              Just a quick reminder that your Grane pickup is tomorrow.
            </p>
            <div style="border-top: 1px solid #EFE7DD; margin: 16px 0;"></div>
            <p style="margin: 0 0 12px; color: #2B2620; font-size: 14px;">${greeting}</p>
            <div style="border: 1px solid #EFE7DD; border-radius: 14px; padding: 14px; background: #FFFFFF; margin: 0 0 16px;">
              <p style="margin: 0 0 8px; font-weight: 700; color: #2B1F16;">Pickup details</p>
              <p style="margin: 0 0 6px; color: #5C5248;">
                <strong>Date:</strong> ${formattedBakeDay}
              </p>
              <p style="margin: 0 0 6px; color: #5C5248;">
                <strong>Time:</strong> ⏰ Anytime between 9:00 AM – 5:00 PM
              </p>
              <p style="margin: 0; color: #5C5248;">
                <strong>Pickup Location:</strong><br />
                311 E 200 S<br />
                Provo, UT 84606
              </p>
            </div>
            ${orderSummarySection}
            ${orderRefLine}
            <p style="margin: 0 0 16px; color: #5C5248; font-size: 14px;">
              Questions? Reply to this email or contact support@granebakery.com.
            </p>
            <p style="margin: 0; color: #2B2620;">— Dane</p>
            <p style="margin: 0; color: #2B2620;">Grane</p>
          </div>
        </div>
      `;

      await sendWithResend({
        toEmail: order.customer_email,
        subject,
        html,
      });

      const { error: updateError } = await supabase
        .from('orders')
        .update({ pickup_reminder_sent_at: new Date().toISOString() })
        .eq('id', order.order_id);

      if (updateError) {
        console.error('Failed to update pickup_reminder_sent_at:', updateError.message);
        failed += 1;
        continue;
      }

      emailed += 1;
    } catch (err) {
      console.error('Failed to send reminder:', err);
      failed += 1;
    }
  }

  const found = normalized.length;
  console.log({ targetDate, test_today: testToday, found, emailed, skipped, failed });

  return jsonResponse(200, {
    ok: true,
    targetDate,
    test_today: testToday,
    found,
    emailed,
    skipped,
    failed,
  });
});
