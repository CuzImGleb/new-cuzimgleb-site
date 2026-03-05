exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = JSON.parse(event.body);

  // Convert Anthropic-style messages to OpenAI/Groq format
  const groqBody = {
    model: 'llama-3.1-8b-instant',
    max_tokens: body.max_tokens || 500,
    messages: body.messages
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify(groqBody)
  });

  const data = await response.json();

  // Convert Groq response back to Anthropic-style so the HTML needs no changes
  const converted = {
    content: [{ type: 'text', text: data.choices?.[0]?.message?.content || '' }]
  };

  return {
    statusCode: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(converted)
  };
};