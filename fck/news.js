/* ===================================================
   FCK Dashboard – news.js  |  2026 Rewrite
   =================================================== */

const RSS_API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://news.google.com/rss/search?q=1.+FC+Kaiserslautern&hl=de&gl=DE&ceid=DE:de')}`;
const GNEWS_API = `https://gnews.io/api/v4/search?q=%221.%20FC%20Kaiserslautern%22&lang=de&country=de&sortby=publishedAt&apikey=3f09132026fd587878b0a048d922c2ee`;

function extractSource(title) {
  const parts = title.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1].trim() : 'Unbekannte Quelle';
}

function newsItemHTML(item, large = false) {
  const date = new Date(item.pubDate).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const imgEl = item.image
    ? `<img class="news-thumb" src="${item.image}" alt="" loading="lazy">`
    : `<div class="news-thumb-placeholder"><i class="fas fa-newspaper"></i></div>`;

  const wrapClass = large ? 'news-page-item' : 'news-item';

  return `
    <div class="${wrapClass}">
      <a href="${item.link}" target="_blank" rel="noopener">
        ${imgEl}
        <div class="news-content">
          <div class="news-title">${item.title}</div>
          <div class="news-meta">${item.source} &middot; ${date}</div>
        </div>
      </a>
    </div>`;
}

// ── Dashboard preview (index.html) ───────────────────
async function loadNews() {
  const container = document.getElementById('news-list2');
  if (!container) return;

  try {
    const res  = await fetch(RSS_API);
    const data = await res.json();

    if (!data?.items?.length) { container.innerHTML = '<div style="color:var(--muted);font-size:0.8rem">Keine News gefunden.</div>'; return; }

    const items = data.items
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 6)
      .map(item => ({
        title:   item.title,
        link:    item.link,
        pubDate: item.pubDate,
        source:  extractSource(item.title),
        image:   item.enclosure?.link || null
      }));

    container.innerHTML = items.map(i => newsItemHTML(i)).join('');
  } catch (err) {
    console.error('News dashboard:', err);
    container.innerHTML = '<div style="color:var(--muted);font-size:0.8rem">Fehler beim Laden der News.</div>';
  }
}

// ── Full News Page (news.html) ────────────────────────
async function loadFullNews() {
  const container = document.getElementById('news-list');
  if (!container) return;

  try {
    const [rssRes, gnewsRes] = await Promise.allSettled([
      fetch(RSS_API).then(r => r.json()),
      fetch(GNEWS_API).then(r => r.json())
    ]);

    const rssItems = rssRes.status === 'fulfilled'
      ? (rssRes.value.items || []).map(item => ({
          title:   item.title,
          link:    item.link,
          pubDate: item.pubDate,
          source:  extractSource(item.title),
          image:   null
        }))
      : [];

    const gnewsItems = gnewsRes.status === 'fulfilled'
      ? (gnewsRes.value.articles || []).map(a => ({
          title:   a.title,
          link:    a.url,
          pubDate: a.publishedAt,
          source:  a.source.name,
          image:   a.image
        }))
      : [];

    const all = [...rssItems, ...gnewsItems]
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 20);

    if (!all.length) { container.innerHTML = '<div style="color:var(--muted);padding:16px">Keine News gefunden.</div>'; return; }

    container.innerHTML = all.map((item, i) => {
      const el = document.createElement('div');
      el.innerHTML = newsItemHTML(item, true);
      const child = el.firstElementChild;
      child.style.animationDelay = `${i * 0.04}s`;
      return child.outerHTML;
    }).join('');

  } catch (err) {
    console.error('Full news:', err);
    container.innerHTML = '<div style="color:var(--muted);padding:16px">Fehler beim Laden der News.</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.endsWith('news.html') || path.endsWith('news')) {
    loadFullNews();
    window.addEventListener('load', () => document.body.classList.add('loaded'));
  } else {
    loadNews();
  }
});
