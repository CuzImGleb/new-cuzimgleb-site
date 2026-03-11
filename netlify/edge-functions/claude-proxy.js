export default async function handler(request, context) {
  // Only allow POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // CORS headers – allow your Netlify domain and local file access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY nicht gesetzt in Netlify' } }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const body = await request.text();

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: corsHeaders,
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: `Proxy-Fehler: ${err.message}` } }),
      { status: 502, headers: corsHeaders }
    );
  }
}

export const config = { path: '/api/claude' };
