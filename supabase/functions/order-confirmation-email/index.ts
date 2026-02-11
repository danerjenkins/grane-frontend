/// <reference lib="deno.ns" />

import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(to: string) {
  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

  const payload = {
    from: "Grane <onboarding@resend.dev>", // free dev sender for testing
    to: [to],
    subject: "Grane test email ✅",
    html: `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
        <h2>Test email succeeded ✅</h2>
        <p>If you got this, Supabase Edge Functions → Resend is working.</p>
        <p><strong>Pickup window:</strong> Saturdays, 9:00 AM – 5:00 PM</p>
      </div>
    `,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // For now, allow GET with a query param:
  // /order-confirmation-email?to=you@example.com
  const url = new URL(req.url);
  const to = url.searchParams.get("to");

  if (!to) {
    return new Response(
      "Missing ?to= email query param",
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const result = await sendEmail(to);
    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
