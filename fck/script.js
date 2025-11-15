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
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const seasons = ["2024", "2025"];
    const allMatches = [];

    // Alle Saisons laden
    for (const season of seasons) {
      const seasonMatches = await fetchSeasonData(season);
      allMatches.push(...seasonMatches);
    }

    // --- Filter ---
    const filteredMatches = filterRelevantMatches(allMatches);

    const allSortedMatches = [...filteredMatches].sort(
      (a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime)
    );

    // --- Render ---
    updateNextMatch(filteredMatches);
    updateUpcomingMatches(filteredMatches);
    updateLastMatches(allSortedMatches);
    updateUndefeatedSeries(allSortedMatches);
    renderUndefeatedSeriesVisual(allSortedMatches);
  } catch (error) {
    console.error("❌ Fehler beim Laden der Daten:", error);
  }
});


// Daten aus BL2, DFB-Pokal und Länderspielen abrufen
async function fetchSeasonData(season) {
  const leagues = ["bl2", "dfb", "dfbnat2526"];
  const results = [];

  for (const league of leagues) {
    const url = `https://corsproxy.io/?url=https://api.openligadb.de/getmatchdata/${league}/${season}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fehler bei ${league.toUpperCase()}: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) results.push(...data);
    } catch (err) {
      console.warn(`⚠️ ${league.toUpperCase()} konnte nicht geladen werden (${season}):`, err.message);
    }
  }

  return results;
}


// Filtert alle relevanten Spiele (FCK + Deutschland)
function filterRelevantMatches(matches) {
  return matches.filter(match => {
    const team1 = (match.team1?.teamName || "").toLowerCase();
    const team2 = (match.team2?.teamName || "").toLowerCase();

    return (
      team1.includes("kaiserslautern") ||
      team2.includes("kaiserslautern") ||
      team1.includes("deutschland") ||
      team2.includes("deutschland")
    );
  });
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

  const fallbackIcon = "icons/default.png";

  // Logos aktualisieren
    document.querySelector("#next-match-box img[alt='Team 1']").src = nextMatch.team1?.teamIconUrl || fallbackIcon;
    document.querySelector("#next-match-box img[alt='Team 2']").src = nextMatch.team2?.teamIconUrl || fallbackIcon;

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
  const fallbackIcon = "icons/default.png";
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
    const isNational = match.leagueShortcut?.toLowerCase() === "dfbnat2526";

    // Wenn Nationalspiel → immer voller Teamname
    const team1 = isNational ? match.team1.teamName : (match.team1.shortName || match.team1.teamName);
    const team2 = isNational ? match.team2.teamName : (match.team2.shortName || match.team2.teamName);

    const matchDate = new Date(match.matchDateTime);
    const formattedDate = matchDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

    const li = document.createElement("li");
    li.innerHTML = `
      <img class="team-logo-small" src="${match.team1?.teamIconUrl || fallbackIcon}" alt="${team1}">
      <span>${team1} vs ${team2}</span>
      <img class="team-logo-small" src="${match.team2?.teamIconUrl || fallbackIcon}" alt="${team2}">
      <span>${formattedDate}</span>
    `;

    if (match.leagueShortcut?.toLowerCase() === "dfb") {
      li.style.backgroundColor = "#138f30c0"; // grün für Pokal
      li.style.color = "#FFFFFF";
    } else if (isNational) {
      li.style.backgroundColor = "#808080c0"; // grau für Länderspiele
      li.style.color = "#FFFFFF";
    }

    upcomingList.appendChild(li);
  });
}

// Zeigt die letzten 5 Spiele (mit Ergebnis) an
function updateLastMatches(matches) {
  const lastMatchList = document.getElementById("last-match-list");
  const fallbackIcon = "icons/default.png";
  lastMatchList.innerHTML = '';

  const lastMatches = matches
    .filter(match => match.matchIsFinished)
    .sort((a, b) => new Date(b.matchDateTime) - new Date(a.matchDateTime))
    .slice(0, 10);

  if (lastMatches.length === 0) {
    lastMatchList.innerHTML = "<li>Keine vergangenen Spiele gefunden.</li>";
    return;
  }

  lastMatches.forEach(match => {
    const isNational = match.leagueShortcut?.toLowerCase() === "dfbnat2526";
    const team1 = isNational ? match.team1.teamName : (match.team1.shortName || match.team1.teamName);
    const team2 = isNational ? match.team2.teamName : (match.team2.shortName || match.team2.teamName);

    const result = match.matchResults.find(r => r.resultName === "Endergebnis") || match.matchResults[0];
    const team1Goals = result.pointsTeam1;
    const team2Goals = result.pointsTeam2;

    const li = document.createElement("li");
    li.innerHTML = `
      <img class="team-logo-small" src="${match.team1.teamIconUrl || fallbackIcon}" alt="${team1}">
      <span>${team1} ${team1Goals} - ${team2Goals} ${team2}</span>
      <img class="team-logo-small" src="${match.team2.teamIconUrl || fallbackIcon}" alt="${team2}">
    `;

    if (match.leagueShortcut?.toLowerCase() === "dfb") {
      li.style.backgroundColor = "#138f30c0";
      li.style.color = "#FFFFFF";
    } else if (match.leagueShortcut?.toLowerCase() === "dfbnat2526") {
      li.style.backgroundColor = "#808080c0";
      li.style.color = "#FFFFFF";
    }


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

    const matchDate = match.matchDateTime ? new Date(match.matchDateTime).toLocaleDateString("de-DE") : "Datum unbekannt";

    let isUndefeated = (isFCKTeam1 && team1Goals >= team2Goals) || (isFCKTeam2 && team2Goals >= team1Goals);

    if (isUndefeated) {
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

  // UI-Update
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


function renderUndefeatedSeriesVisual(matches) {
  const currentContainer = document.getElementById("undefeated-current-list");
  const longestContainer = document.getElementById("undefeated-longest-list");
  currentContainer.innerHTML = "";
  longestContainer.innerHTML = "";

  matches.sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));

  let currentSeries = [];
  let longestSeries = [];
  let tempSeries = [];

  for (const match of matches) {
    if (match.leagueName?.toLowerCase().includes("dfb")) continue;
    if (!match.matchIsFinished) continue;

    const isFCKTeam1 =
      match.team1.teamName.toLowerCase() === "1. fc kaiserslautern" ||
      match.team1.shortName?.toLowerCase() === "kaiserslautern";
    const isFCKTeam2 =
      match.team2.teamName.toLowerCase() === "1. fc kaiserslautern" ||
      match.team2.shortName?.toLowerCase() === "kaiserslautern";

    if (!isFCKTeam1 && !isFCKTeam2) continue;

    const team1Goals = match.matchResults?.[1]?.pointsTeam1 ?? null;
    const team2Goals = match.matchResults?.[1]?.pointsTeam2 ?? null;

    let fckGoals, opponentGoals, opponent;
    if (isFCKTeam1) {
      fckGoals = team1Goals;
      opponentGoals = team2Goals;
      opponent = match.team2;
    } else {
      fckGoals = team2Goals;
      opponentGoals = team1Goals;
      opponent = match.team1;
    }

    let resultType = null;
    if (fckGoals > opponentGoals) {
      resultType = "win";
    } else if (fckGoals === opponentGoals) {
      resultType = "draw";
    } else {
      if (tempSeries.length > longestSeries.length) longestSeries = [...tempSeries];
      tempSeries = [];
      continue;
    }

    const matchDate = match.matchDateTime
      ? new Date(match.matchDateTime).toLocaleDateString()
      : "Datum unbekannt";

    const logoUrl = opponent.teamIconUrl || "icons/default.png";
    const opponentName = opponent.teamName;

    tempSeries.push({
      type: resultType,
      date: matchDate,
      logo: logoUrl,
      opponent: opponentName,
      result: `${fckGoals}:${opponentGoals}`,
      tournament: match.leagueName || match.group?.groupName || "Unbekannt"
    });
  }

  if (tempSeries.length > longestSeries.length) longestSeries = [...tempSeries];
  currentSeries = [...tempSeries];

function renderSeries(container, series) {
  for (const game of series) {
    const item = document.createElement("div");
    item.classList.add("series-item");
    const symbol = game.type === "win" ? "✔" : "–";
    const circleClass = game.type === "win" ? "series-win" : "series-draw";

    const tooltipText = `
      Gegner: ${game.opponent}<br>
      Ergebnis: ${game.result}<br>
      Turnier: ${game.tournament}
    `;

    item.innerHTML = `
      <div class="match-date">${game.date}</div>
      <img src="${game.logo}" alt="${game.opponent}" 
          style="width:24px;height:24px;border-radius:50%;margin-top:2px;">
      <div class="opponent-name">${game.opponent}</div>
      <div class="series-circle ${circleClass}">${symbol}</div>
      <div class="series-tooltip">${tooltipText}</div>
    `;

    const tooltip = item.querySelector(".series-tooltip");

    // Hilfsfunktion: Tooltip-Position für Desktop anpassen
    function adjustTooltipPosition() {
      tooltip.style.left = "50%";
      tooltip.style.right = "auto";
      tooltip.style.transform = "translateX(-50%)";

      const rect = tooltip.getBoundingClientRect();

      if (rect.left < 0) {
        tooltip.style.left = "0px";
        tooltip.style.transform = "none";
      } else if (rect.right > window.innerWidth) {
        tooltip.style.left = "auto";
        tooltip.style.right = "0px";
        tooltip.style.transform = "none";
      }
    }

    // Desktop: Hover
    item.addEventListener("mouseenter", () => {
      if (window.innerWidth > 768) {
        tooltip.style.display = "block";
        adjustTooltipPosition();
      }
    });

    item.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
      tooltip.style.left = "50%";
      tooltip.style.right = "auto";
      tooltip.style.transform = "translateX(-50%)";
    });

    // Mobile: Klick → Modal
    item.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        const existingModal = document.getElementById("tooltip-modal");
        if (existingModal) existingModal.remove();

        const modal = document.createElement("div");
        modal.id = "tooltip-modal";
        modal.innerHTML = `
          <div class="tooltip-modal-content">
            <button class="close-tooltip">&times;</button>
            <div class="tooltip-text">${tooltipText}</div>
          </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector(".close-tooltip").addEventListener("click", () => {
          modal.remove();
        });
      }
    });

    container.appendChild(item);
  }
}


  renderSeries(currentContainer, currentSeries);
  renderSeries(longestContainer, longestSeries);
}





