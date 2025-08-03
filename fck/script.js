// Sidebar Optimierung:

document.querySelectorAll(".sidebar nav a").forEach(link => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");

    // 🔁 Active-Klasse aktualisieren
    document.querySelectorAll(".sidebar nav a").forEach(a => a.classList.remove("active"));
    link.classList.add("active");

    // ⛔ Nur interne Navigation behandeln
    if (href.startsWith("#")) {
      e.preventDefault();

      const text = link.textContent.trim();
      let targetIds = [];
      if (text.includes("Tabelle")) targetIds = ["tabelle-box"];
      else if (text.includes("Spiele")) targetIds = ["next-match-box", "upcoming-match-box", "last-matches"];
      else if (text.includes("Serien")) targetIds = ["undefeated-series"];
      else if (text.includes("Info")) targetIds = ["footer"];

      targetIds.forEach((id, index) => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove("highlight-effect");
          void el.offsetWidth;
          el.classList.add("highlight-effect");

          if (index === 0) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      });
    }
  });
});

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});


// URLs für die API-Abfrage – mit zwei verschiedenen Proxy-Diensten, falls einer nicht funktioniert
const urls = [
  'https://corsproxy.io/?url=https://api.openligadb.de/getbltable/bl2/2025',
  'https://api.allorigins.win/raw?url=https://api.openligadb.de/getbltable/bl2/2025'
];

// Tabelle der 2. Bundesliga abrufen und anzeigen
async function fetchTable() {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue; // Wenn Request fehlschlägt, nächste URL versuchen
      const data = await res.json();

      const tbody = document.querySelector("#table tbody");
      tbody.innerHTML = ""; // Alte Tabelleninhalte entfernen

      // Für jedes Team eine Tabellenzeile erstellen
      data.forEach((team, i) => {
        const row = document.createElement("tr");

        const place = i + 1;
        let className = "";

        // Spezielle Hervorhebung für Kaiserslautern
        if (team.teamName.toLowerCase().includes("kaiserslautern")) {
          className += " highlight-fck";
        }

        // Farbmarkierungen je nach Tabellenplatz
        if (place === 1 || place === 2) {
          className += " place-green";
        } else if (place === 3 || place === 16) {
          className += " place-yellow";
        } else if (place >= 17) {
          className += " place-red";
        }

        row.className = className.trim();

        row.innerHTML = `
          <td>${place}.</td>
          <td><img class="team-logo-small" src="${team.teamIconUrl}" alt="${team.teamName}"> ${team.teamName}</td>
          <td>${team.points}</td>
        `;
        tbody.appendChild(row);
      });
      break; // Bei erfolgreichem Laden abbrechen
    } catch (e) {
      console.error("Fehler beim Laden von:", url, e);
    }
  }
}
fetchTable();

// Nach dem Laden der Seite Daten abrufen und verarbeiten
document.addEventListener("DOMContentLoaded", function () {
  const season2024 = "2024";
  const season2025 = "2025";

  // Spiele aus beiden Saisons abrufen
  Promise.all([
    fetchSeasonData(season2024),
    fetchSeasonData(season2025)
  ])
    .then(([matches2024, matches2025]) => {
      // Nur FCK-Spiele extrahieren
      const fckMatches2024 = filterFCKMatches(matches2024);
      const fckMatches2025 = filterFCKMatches(matches2025);
      const allFckMatches = [...fckMatches2024, ...fckMatches2025]
        .sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));

      // Funktionen zur Anzeige aufrufen
      updateNextMatch(fckMatches2025);
      updateUpcomingMatches(fckMatches2025);
      updateLastMatches(allFckMatches);
      updateUndefeatedSeries(allFckMatches);
    })
    .catch(error => console.error("Fehler beim Laden der Daten:", error));
});

// Daten aus BL2 und DFB-Pokal abrufen
function fetchSeasonData(season) {
  const urlBL2 = `https://corsproxy.io/?url=https://www.openligadb.de/api/getmatchdata/bl2/${season}`;
  const urlDFB = `https://corsproxy.io/?url=https://api.openligadb.de/getmatchdata/dfb/${season}`;

  return Promise.all([
    fetch(urlBL2).then(res => res.json()).catch(() => []),
    fetch(urlDFB).then(res => res.json()).catch(() => [])
  ]).then(([bl2, dfb]) => [...bl2, ...dfb]); // Zusammenführen der Spiele
}

// Filtert alle Spiele mit Beteiligung vom FCK
function filterFCKMatches(matches) {
  return matches.filter(match =>
    match.team1.teamName.toLowerCase().includes("kaiserslautern") ||
    match.team2.teamName.toLowerCase().includes("kaiserslautern")
  );
}

// Zeigt das nächste FCK-Spiel an
function updateNextMatch(matches) {
  const nextMatch = matches
    .filter(match => !match.matchIsFinished)
    .sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime))[0];

  if (!nextMatch) {
    document.querySelector("#next-match-box .match-date").textContent = "Kein nächstes Spiel gefunden.";
    return;
  }

  // Logos aktualisieren
  document.querySelector("#next-match-box img[alt='Team 1']").src = nextMatch.team1.teamIconUrl;
  document.querySelector("#next-match-box img[alt='Team 2']").src = nextMatch.team2.teamIconUrl;

  // Datum & Uhrzeit formatieren
  const matchDate = new Date(nextMatch.matchDateTime);
  const daysOfWeek = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const dayName = daysOfWeek[matchDate.getDay()];
  const day = String(matchDate.getDate()).padStart(2, '0');
  const month = String(matchDate.getMonth() + 1).padStart(2, '0');
  const year = matchDate.getFullYear();
  const hours = String(matchDate.getHours()).padStart(2, '0');
  const minutes = String(matchDate.getMinutes()).padStart(2, '0');
  const formattedDateTime = `${dayName} am ${day}.${month}.${year} um ${hours}:${minutes}`;

  document.querySelector("#next-match-box .match-date").textContent = formattedDateTime;
}

// Zeigt die nächsten 10 Spiele an
function updateUpcomingMatches(matches) {
  const upcomingList = document.getElementById("upcoming-list");
  upcomingList.innerHTML = '';

  const upcomingMatches = matches
    .filter(match => !match.matchIsFinished)
    .sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime))
    .slice(0, 14);

  if (upcomingMatches.length === 0) {
    upcomingList.innerHTML = "<li>Keine kommenden Spiele gefunden.</li>";
    return;
  }

  upcomingMatches.forEach(match => {
    const team1 = match.team1.shortName || match.team1.teamName;
    const team2 = match.team2.shortName || match.team2.teamName;
    const matchDate = new Date(match.matchDateTime);
    const formattedDate = matchDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

    const li = document.createElement("li");
    li.innerHTML = `
      <img class="team-logo-small" src="${match.team1.teamIconUrl}" alt="${team1}">
      <span>${team1} vs ${team2}</span>
      <img class="team-logo-small" src="${match.team2.teamIconUrl}" alt="${team2}">
      <span>${formattedDate}</span>
    `;

    if (match.leagueShortcut?.toLowerCase() === "dfb") {
      li.style.backgroundColor = "#138f30c0";
      li.style.color = "#FFFFFF";
    }

    upcomingList.appendChild(li);
  });
}

// Zeigt die letzten 5 Spiele (mit Ergebnis) an
function updateLastMatches(matches) {
  const lastMatchList = document.getElementById("last-match-list");
  lastMatchList.innerHTML = '';

  const lastMatches = matches
    .filter(match => match.matchIsFinished)
    .sort((a, b) => new Date(b.matchDateTime) - new Date(a.matchDateTime))
    .slice(0, 5);

  if (lastMatches.length === 0) {
    lastMatchList.innerHTML = "<li>Keine vergangenen Spiele gefunden.</li>";
    return;
  }

  lastMatches.forEach(match => {
    const team1 = match.team1.shortName || match.team1.teamName;
    const team2 = match.team2.shortName || match.team2.teamName;
    const result = match.matchResults.find(r => r.resultName === "Endergebnis") || match.matchResults[0];
    const team1Goals = result.pointsTeam1;
    const team2Goals = result.pointsTeam2;

    const li = document.createElement("li");
    li.innerHTML = `
      <img class="team-logo-small" src="${match.team1.teamIconUrl}" alt="${team1}">
      <span>${team1} ${team1Goals} - ${team2Goals} ${team2}</span>
      <img class="team-logo-small" src="${match.team2.teamIconUrl}" alt="${team2}">
    `;
    lastMatchList.appendChild(li);
  });
}

// Analyse der aktuellen und längsten Serie ohne Niederlage
function updateUndefeatedSeries(matches) {

  matches.sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));

  let currentSeries = 0;
  let longestSeries = 0;
  let isSeriesActive = true;
  let currentSeriesEndDate = null;
  let longestSeriesEndDate = null;

  for (const match of matches) {
    if (match.leagueShortcut?.toLowerCase() === "dfb") continue;
    if (!match.matchIsFinished) continue;

    const team1Goals = match.matchResults[1].pointsTeam1;
    const team2Goals = match.matchResults[1].pointsTeam2;

    const isFCKTeam1 = match.team1.teamName.toLowerCase() === "1. fc kaiserslautern" || match.team1.shortName?.toLowerCase() === "kaiserslautern";
    const isFCKTeam2 = match.team2.teamName.toLowerCase() === "1. fc kaiserslautern" || match.team2.shortName?.toLowerCase() === "kaiserslautern";

    const matchDate = match.matchDateTime ? new Date(match.matchDateTime).toLocaleDateString() : "Datum unbekannt";

    // Ungeschlagen = Sieg oder Unentschieden
    if ((isFCKTeam1 && team1Goals >= team2Goals) || (isFCKTeam2 && team2Goals >= team1Goals)) {
      if (!isSeriesActive) {
        currentSeries = 1;
        isSeriesActive = true;
      } else {
        currentSeries++;
      }
      currentSeriesEndDate = matchDate;

      if (currentSeries > longestSeries) {
        longestSeries = currentSeries;
        longestSeriesEndDate = currentSeriesEndDate;
      }
    } else {
      currentSeries = 0;
      isSeriesActive = false;
    }
  }

  const unstoppableElement = document.getElementById("undefeated-series-count");
  if (unstoppableElement) {
    unstoppableElement.textContent = currentSeries;
  }

  const highscoreElement = document.getElementById("undefeated-series-highscore");
  if (highscoreElement) {
    if (longestSeriesEndDate) {
      highscoreElement.textContent = `Die längste Serie war ${longestSeries} Spiele am ${longestSeriesEndDate}`;
    } else {
      highscoreElement.textContent = `Keine längste Serie vorhanden.`;
    }
  }

  return { currentSeries, longestSeries };
}

