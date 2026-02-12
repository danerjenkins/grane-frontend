import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANNOUNCE_SECRET = Deno.env.get('GRANE_ANNOUNCE_SECRET');
const SB_URL = Deno.env.get('GRANE_SUPABASE_URL');
const SB_SERVICE_ROLE = Deno.env.get('GRANE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const PUBLIC_SITE_URL = 'https://granebakery.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-announce-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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
    return jsonResponse(405, { ok: false, error: 'method not allowed' });
  }

  if (!ANNOUNCE_SECRET) {
    return jsonResponse(500, {
      ok: false,
      error: 'Missing GRANE_ANNOUNCE_SECRET',
    });
  }

  const providedSecret = req.headers.get('x-announce-secret');
  if (!providedSecret || providedSecret !== ANNOUNCE_SECRET) {
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

  let body: { bake_day_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON body' });
  }

  if (!body.bake_day_id) {
    return jsonResponse(400, { ok: false, error: 'Missing bake_day_id' });
  }

  const supabase = createClient(SB_URL, SB_SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: bakeDay, error: bakeDayError } = await supabase
    .from('bake_days')
    .select('date, is_published, announcement_sent_at')
    .eq('id', body.bake_day_id)
    .single();

  if (bakeDayError) {
    return jsonResponse(500, {
      ok: false,
      error: `Failed to fetch bake day: ${bakeDayError.message}`,
    });
  }

  if (!bakeDay) {
    return jsonResponse(404, { ok: false, error: 'Bake day not found' });
  }

  if (!bakeDay.is_published) {
    return jsonResponse(409, { ok: false, error: 'not_published' });
  }

  if (bakeDay.announcement_sent_at) {
    return jsonResponse(200, { ok: true, already_sent: true });
  }

  const { data: bakeDayProducts, error: productsError } = await supabase
    .from('bake_day_products')
    .select('available, products(name)')
    .eq('bake_day_id', body.bake_day_id)
    .eq('available', true);

  if (productsError) {
    return jsonResponse(500, {
      ok: false,
      error: `Failed to fetch bake day products: ${productsError.message}`,
    });
  }

  const products = (bakeDayProducts ?? [])
    .map((row) => {
      const product = (row as { products?: { name?: string | null } })?.products ?? null;
      return product?.name ?? null;
    })
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));

  const { data: recipients, error: recipientsError } = await supabase
    .from('users')
    .select('email')
    .eq('notify_new_bake_days', true)
    .not('email', 'is', null);

  if (recipientsError) {
    return jsonResponse(500, {
      ok: false,
      error: `Failed to fetch recipients: ${recipientsError.message}`,
    });
  }

  const recipientCount = (recipients ?? []).filter((row) => Boolean(row.email)).length;

  let emailed = 0;
  let failed = 0;
  const formattedBakeDay = formatBakeDay(bakeDay.date);
  const subject = `New Bake Day posted — ${formattedBakeDay} 🍞`;
  const bakeDaysUrl = `${PUBLIC_SITE_URL}/bake-days`;
  const productsList = products.length
    ? `<ul style="margin: 0 0 18px; padding-left: 18px; color: #2B2620;">
        ${products.map((name) => `<li style="margin: 0 0 6px;">${name}</li>`).join('')}
      </ul>`
    : `<p style="margin: 0 0 18px; color: #5C5248;">We’ll share the lineup soon.</p>`;

  for (const recipient of recipients ?? []) {
    if (!recipient.email) {
      continue;
    }

    const html = `
      <div style="background: #FFFBF5; padding: 28px 16px; color: #2B2620;">
        <div style="max-width: 560px; margin: 0 auto; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
          <h2 style="font-family: Georgia, 'Times New Roman', serif; margin: 0 0 8px;">
            A new Bake Day is live! 🍞
          </h2>
          <div style="height: 1px; background: #E7E0D6; margin: 0 0 18px;"></div>
          <p style="margin: 0 0 14px; color: #5C5248;">
            <strong>Date:</strong> ${formattedBakeDay}
          </p>
          <p style="margin: 0 0 14px; color: #5C5248;">
            Here’s what’s available on that day:
          </p>
          <div style="background: #FFFFFF; border: 1px solid #E7E0D6; border-radius: 14px; padding: 16px 18px; margin: 0 0 18px;">
            ${productsList}
            <p style="margin: 0 0 6px; color: #5C5248;">
              Pickup at 311 E 200 S, Provo, UT 84606
            </p>
            <p style="margin: 0; color: #5C5248;">
              Pickup window: 9:00 AM – 5:00 PM
            </p>
          </div>
          <a
            href="${bakeDaysUrl}"
            style="display: inline-block; background: #2B2620; color: #FFFFFF; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; margin: 0 0 16px;"
          >
            View Bake Days
          </a>
          <p style="margin: 0; font-size: 12px; color: #8B7D6B;">
            You’re receiving this because you opted into Bake Day email alerts in your Grane account.
          </p>
        </div>
      </div>
    `;

    try {
      await sendWithResend({ toEmail: recipient.email, subject, html });
      emailed += 1;
    } catch (err) {
      console.error('Announcement send failed:', recipient.email, err);
      failed += 1;
    }
  }

  if (emailed > 0) {
    const { error: updateError } = await supabase
      .from('bake_days')
      .update({ announcement_sent_at: new Date().toISOString() })
      .eq('id', body.bake_day_id);

    if (updateError) {
      console.error('Failed to update announcement_sent_at:', updateError.message);
    }
  }

  console.log({
    bake_day_id: body.bake_day_id,
    bake_day_date: bakeDay.date,
    products_count: products.length,
    recipients: recipientCount,
    emailed,
    failed,
  });

  return jsonResponse(200, {
    ok: true,
    bake_day_date: bakeDay.date,
    products,
    recipients: recipientCount,
    emailed,
    failed,
  });
});
