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

    // ── Step 1: Web search for REAL current prices ──
    const searchResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'Du bist ein Preisrecherche-Assistent für deutsche Online-Shops. Suche immer auf Idealo.de, Amazon.de, MediaMarkt.de und Saturn.de nach aktuellen Preisen.',
        messages: [{
          role: 'user',
          content: `Suche aktuelle Verkaufspreise für "${productName}" auf deutschen Online-Shops. Suche auf idealo.de, amazon.de, mediamarkt.de und saturn.de. Nenne konkrete Preise mit Quelle.`
        }]
      }),
    });

    const searchData = await searchResp.json();
    const searchText = (searchData.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    // ── Step 2: Structure into JSON ──
    const structResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: 'Du bist ein JSON-only Assistent. Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Text, kein Markdown.',
        messages: [{
          role: 'user',
          content: `Suchergebnisse für "${productName}":
${searchText}

Meine Kalkulation: Netto-Kosten €${baseCosts}, Fee ${aiFeePercent}%+€${aiFeeFixed}, MwSt ${aiVatRate}%, Zielmarge ${Math.round(targetMargin*100)}%

Erstelle JSON mit den echten gefundenen Preisen. Falls ein Shop nicht gefunden: Preis weglassen (0.00).
{"product_found":true,"product_name":"VOLLER NAME","competitors":[{"source":"Amazon.de","price":0.00,"note":""},{"source":"Idealo günstigster","price":0.00,"note":"Bestpreis"},{"source":"MediaMarkt","price":0.00,"note":""},{"source":"Saturn","price":0.00,"note":""},{"source":"Otto","price":0.00,"note":""}],"market_min":0.00,"market_max":0.00,"market_avg":0.00,"recommended_evp":0.00,"evp_strategy":"competitive","analysis":"Marktlage in 2-3 Sätzen","risks":"Risiken in 1-2 Sätzen","trend":"stabil"}`
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
