export default async function handler(request, context) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY nicht gesetzt in Netlify' } }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const incoming = await request.json();
    const { productName, marketLabel, baseCosts, aiFeePercent, aiFeeFixed, aiVatRate, targetMargin } = incoming;

    // ── Step 1: Web search – max_tokens niedrig halten ──
    const searchResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
        system: 'Suche Preise auf deutschen Shops. Antworte kurz: nur Produktname, Preise und Quellen. Maximal 300 Wörter.',
        messages: [{
          role: 'user',
          content: `Aktuelle Preise für "${productName}" auf idealo.de und amazon.de. Nur Preise und Quellen, kein Fließtext.`
        }]
      }),
    });

    const searchData = await searchResp.json();

    // Nur Text-Blöcke, auf 1500 Zeichen kürzen
    const searchText = (searchData.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .slice(0, 1500);

    // ── Step 2: JSON strukturieren ──
    const structResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'JSON-only. Kein Text, kein Markdown.',
        messages: [{
          role: 'user',
          content: `Preisdaten: ${searchText}

Produkt: "${productName}" | Kosten: €${baseCosts} | Fee: ${aiFeePercent}%+€${aiFeeFixed} | MwSt: ${aiVatRate}% | Zielmarge: ${Math.round(targetMargin*100)}%

JSON mit echten Preisen aus den Daten (0.00 wenn nicht gefunden):
{"product_found":true,"product_name":"NAME","competitors":[{"source":"Amazon.de","price":0.00,"note":""},{"source":"Idealo günstigster","price":0.00,"note":""},{"source":"MediaMarkt","price":0.00,"note":""},{"source":"Saturn","price":0.00,"note":""},{"source":"Otto","price":0.00,"note":""}],"market_min":0.00,"market_max":0.00,"market_avg":0.00,"recommended_evp":0.00,"evp_strategy":"competitive","analysis":"Kurz","risks":"Kurz","trend":"stabil"}`
        }]
      }),
    });

    const structData = await structResp.json();
    return new Response(JSON.stringify(structData), {
      status: 200,
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
