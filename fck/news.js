const rssUrl = "https://news.google.com/rss/search?q=1.+FC+Kaiserslautern&hl=de&gl=DE&ceid=DE:de";
const rssApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
const gnewsApiUrl = "https://gnews.io/api/v4/search?q=%221.%20FC%20Kaiserslautern%22&lang=de&country=de&sortby=publishedAt&apikey=3f09132026fd587878b0a048d922c2ee";

function extractSourceFromTitle(title) {
  const parts = title.split(" - ");
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return "Unbekannte Quelle";
}

if (window.location.pathname.endsWith("news.html")) {
  // Nur auf news.html ausführen
  Promise.all([
    fetch(rssApiUrl).then(res => res.json()),
    fetch(gnewsApiUrl).then(res => res.json())
  ])
    .then(([rssData, gnewsData]) => {
      const newsList = document.getElementById("news-list");
      newsList.innerHTML = "";

      const rssItems = (rssData.items || []).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: new Date(item.pubDate),
        source: extractSourceFromTitle(item.title),
        image: null
      }));

      const gnewsItems = (gnewsData.articles || []).map(article => ({
        title: article.title,
        link: article.url,
        pubDate: new Date(article.publishedAt),
        source: article.source.name,
        image: article.image
      }));

      const allItems = [...rssItems, ...gnewsItems].sort((a, b) => b.pubDate - a.pubDate);

      allItems.slice(0, 15).forEach((item, i) => {
        const li = document.createElement("li");
        li.style.setProperty("--i", i);

        const formattedDate = item.pubDate.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

        li.innerHTML = `
          <a href="${item.link}" target="_blank" rel="noopener" style="display: flex; align-items: center; text-decoration: none; color: inherit;">
            ${item.image ? `<img src="${item.image}" alt="Thumbnail" style="width: 80px; height: 80px; object-fit: cover; margin-right: 10px; border-radius: 6px;">` : ""}
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: bold;">${item.title}</span>
              <small style="color: #888;">Quelle: ${item.source} | ${formattedDate}</small>
            </div>
          </a>
        `;
        newsList.appendChild(li);
      });
    })
    .catch(err => {
      document.getElementById("news-list").innerHTML = "<li>Fehler beim Laden der News.</li>";
      console.error("Fehler beim Abrufen der News:", err);
    });
}

async function loadNews() {
  const newsList = document.getElementById("news-list2");
  newsList.innerHTML = "<li>Lade News...</li>";

  const rssUrl = "https://news.google.com/rss/search?q=1.+FC+Kaiserslautern&hl=de&gl=DE&ceid=DE:de";
  const rssApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  try {
    const res = await fetch(rssApiUrl);
    const data = await res.json();

    if (data && data.items && data.items.length > 0) {
      newsList.innerHTML = "";

      data.items.slice(0, 5).forEach(item => {
        // Datum formatieren
        const date = new Date(item.pubDate);
        const formattedDate = date.toLocaleDateString("de-DE", {
          day: "2-digit", month: "2-digit", year: "numeric"
        });

        // Quelle extrahieren
        const source = extractSourceFromTitle(item.title) || "Unbekannte Quelle";

        const li = document.createElement("li");
        li.style.listStyle = "none";
        li.style.marginBottom = "10px";

        li.innerHTML = `
        <a href="${item.link}" target="_blank" rel="noopener" 
           style="display: flex; align-items: center; text-decoration: none; color: inherit;">
            ${item.enclosure && item.enclosure.link 
              ? `<img src="${item.enclosure.link}" alt="Thumbnail" 
                     style="width: 80px; height: 80px; object-fit: cover; margin-right: 10px; border-radius: 6px;">` 
              : ""}
            <div style="display: flex; flex-direction: column;">
                <span style="font-weight: bold;">${item.title}</span>
                <small style="color: #888;">Quelle: ${source} | ${formattedDate}</small>
            </div>
        </a>
        `;
        newsList.appendChild(li);
      });
    } else {
      newsList.innerHTML = "<li>Keine News gefunden</li>";
    }
  } catch (error) {
    console.error(error);
    newsList.innerHTML = "<li>Fehler beim Laden der News</li>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNews();
});


