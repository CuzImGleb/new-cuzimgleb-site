export async function handler() {
  const API_KEY = '3f09132026fd587878b0a048d922c2ee';
  const url = `https://gnews.io/api/v4/search?q=%221.%20FC%20Kaiserslautern%22&lang=de&country=de&sortby=publishedAt&apikey=${API_KEY}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
