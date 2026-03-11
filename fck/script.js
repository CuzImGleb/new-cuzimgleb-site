/* ===================================================
   FCK Dashboard – script.js  |  2026 Rewrite
   =================================================== */

// ── Loader ───────────────────────────────────────────
window.addEventListener('load', () => document.body.classList.add('loaded'));

// ── Mobile Menu ──────────────────────────────────────
const menuToggle = document.getElementById('menuToggle');
const navLinks   = document.getElementById('nav-links');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuToggle.classList.toggle('open', open);
  });
}

// ── Nav highlight + smooth scroll ────────────────────
document.querySelectorAll('.topnav-links a[data-targets]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.topnav-links a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    if (navLinks) navLinks.classList.remove('open');
    if (menuToggle) menuToggle.classList.remove('open');

    const targets = link.dataset.targets.split(',');
    targets.forEach((id, i) => {
      const el = document.getElementById(id.trim());
      if (!el) return;
      if (i === 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.remove('highlight-effect');
      void el.offsetWidth;
      el.classList.add('highlight-effect');
    });
  });
});

// ── API URLs ─────────────────────────────────────────
const PROXY1 = 'https://corsproxy.io/?url=';
const PROXY2 = 'https://api.allorigins.win/raw?url=';

async function fetchWithFallback(path) {
  for (const proxy of [PROXY1, PROXY2]) {
    try {
      const res = await fetch(proxy + encodeURIComponent(path));
      if (!res.ok) continue;
      return await res.json();
    } catch { /* try next */ }
  }
  throw new Error('All proxies failed for: ' + path);
}

// ── Tabelle ───────────────────────────────────────────
async function fetchTable() {
  try {
    const data = await fetchWithFallback('https://api.openligadb.de/getbltable/bl2/2025');
    const tbody = document.querySelector('#table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach((team, i) => {
      const place = i + 1;
      const isFCK = team.teamName.toLowerCase().includes('kaiserslautern');
      let cls = isFCK ? 'highlight-fck' : '';
      if (place <= 2)   cls += ' place-green';
      else if (place === 3 || place === 16) cls += ' place-yellow';
      else if (place >= 17) cls += ' place-red';

      const dot = (place <= 2 || place === 3 || place === 16 || place >= 17)
        ? `<span class="place-dot"></span>` : '';

      const tr = document.createElement('tr');
      tr.className = cls.trim();
      tr.innerHTML = `
        <td style="color:var(--muted);font-size:0.75rem">${dot}${place}</td>
        <td><img class="team-logo-small" src="${team.teamIconUrl}" alt="${team.teamName}" loading="lazy"> ${team.teamName}</td>
        <td style="text-align:right;font-weight:700;font-family:'Barlow Condensed',sans-serif;font-size:1rem">${team.points}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Tabelle:', err);
  }
}
fetchTable();

// ── Match Data ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const seasons = ['2024', '2025'];
    const leagues = ['bl2', 'dfb', 'dfbnat2526'];
    const allMatches = [];

    for (const season of seasons) {
      for (const league of leagues) {
        try {
          const data = await fetchWithFallback(
            `https://api.openligadb.de/getmatchdata/${league}/${season}`
          );
          if (Array.isArray(data)) allMatches.push(...data);
        } catch { /* skip */ }
      }
    }

    const relevant = allMatches.filter(m => {
      const t1 = (m.team1?.teamName || '').toLowerCase();
      const t2 = (m.team2?.teamName || '').toLowerCase();
      return t1.includes('kaiserslautern') || t2.includes('kaiserslautern')
          || t1.includes('deutschland')    || t2.includes('deutschland');
    });

    const sorted = [...relevant].sort((a, b) =>
      new Date(a.matchDateTime) - new Date(b.matchDateTime)
    );

    renderNextMatch(relevant);
    renderUpcoming(relevant);
    renderLastMatches(sorted);
    renderSeries(sorted);
    renderSeriesVisual(sorted);
  } catch (err) {
    console.error('Match data:', err);
  }
});

function teamName(match, t) {
  const isIntl = match.leagueShortcut?.toLowerCase() === 'dfbnat2526';
  return isIntl ? t.teamName : (t.shortName || t.teamName);
}

// ── Next Match ────────────────────────────────────────
function renderNextMatch(matches) {
  const next = matches
    .filter(m => !m.matchIsFinished)
    .sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime))[0];

  if (!next) {
    document.getElementById('next-date').textContent = 'Kein nächstes Spiel gefunden.';
    return;
  }

  const fb = 'icons/default.png';
  document.getElementById('next-logo-1').src = next.team1?.teamIconUrl || fb;
  document.getElementById('next-logo-2').src = next.team2?.teamIconUrl || fb;
  document.getElementById('next-name-1').textContent = teamName(next, next.team1);
  document.getElementById('next-name-2').textContent = teamName(next, next.team2);

  const d = new Date(next.matchDateTime);
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  document.getElementById('next-date').textContent =
    `${days[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} Uhr`;
}

// ── Upcoming ──────────────────────────────────────────
function renderUpcoming(matches) {
  const list = document.getElementById('upcoming-list');
  if (!list) return;
  list.innerHTML = '';

  const upcoming = matches
    .filter(m => !m.matchIsFinished)
    .sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime))
    .slice(0, 12);

  if (!upcoming.length) { list.innerHTML = '<div style="color:var(--muted);font-size:0.8rem">Keine kommenden Spiele.</div>'; return; }

  upcoming.forEach(m => {
    const isCup  = m.leagueShortcut?.toLowerCase() === 'dfb';
    const isIntl = m.leagueShortcut?.toLowerCase() === 'dfbnat2526';
    const t1 = teamName(m, m.team1);
    const t2 = teamName(m, m.team2);
    const d  = new Date(m.matchDateTime);
    const fd = d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });
    const fb = 'icons/default.png';

    const div = document.createElement('div');
    div.className = 'match-item' + (isCup ? ' cup' : isIntl ? ' intl' : '');
    div.innerHTML = `
      <div class="logo-wrap"><img src="${m.team1?.teamIconUrl || fb}" alt="${t1}" loading="lazy"></div>
      <span class="teams">${t1} vs ${t2}</span>
      <div class="logo-wrap"><img src="${m.team2?.teamIconUrl || fb}" alt="${t2}" loading="lazy"></div>
      <span class="date-chip">${fd}</span>
    `;
    list.appendChild(div);
  });
}

// ── Last Matches ──────────────────────────────────────
function renderLastMatches(sorted) {
  const list = document.getElementById('last-match-list');
  if (!list) return;
  list.innerHTML = '';

  const last = [...sorted]
    .filter(m => m.matchIsFinished)
    .sort((a, b) => new Date(b.matchDateTime) - new Date(a.matchDateTime))
    .slice(0, 10);

  if (!last.length) { list.innerHTML = '<div style="color:var(--muted);font-size:0.8rem">Keine Ergebnisse.</div>'; return; }

  last.forEach(m => {
    const isCup  = m.leagueShortcut?.toLowerCase() === 'dfb';
    const isIntl = m.leagueShortcut?.toLowerCase() === 'dfbnat2526';
    const t1 = teamName(m, m.team1);
    const t2 = teamName(m, m.team2);
    const result = m.matchResults.find(r => r.resultName === 'Endergebnis') || m.matchResults[0];
    const fb = 'icons/default.png';

    const div = document.createElement('div');
    div.className = 'match-item' + (isCup ? ' cup' : isIntl ? ' intl' : '');
    div.innerHTML = `
      <div class="logo-wrap"><img src="${m.team1?.teamIconUrl || fb}" alt="${t1}" loading="lazy"></div>
      <span class="teams">${t1} vs ${t2}</span>
      <div class="logo-wrap"><img src="${m.team2?.teamIconUrl || fb}" alt="${t2}" loading="lazy"></div>
      <span class="score">${result.pointsTeam1}:${result.pointsTeam2}</span>
    `;
    list.appendChild(div);
  });
}

// ── Series Stats ──────────────────────────────────────
function renderSeries(sorted) {
  let current = 0, longest = 0, longestDate = null;

  sorted.forEach(m => {
    if (!m.matchIsFinished) return;
    if (m.leagueShortcut?.toLowerCase() === 'dfb') return;

    const res = m.matchResults[1];
    if (!res) return;
    const g1 = res.pointsTeam1, g2 = res.pointsTeam2;
    const isFCK1 = m.team1.teamName.toLowerCase().includes('kaiserslautern') || m.team1.shortName?.toLowerCase().includes('kaiserslautern');
    const isFCK2 = m.team2.teamName.toLowerCase().includes('kaiserslautern') || m.team2.shortName?.toLowerCase().includes('kaiserslautern');
    const undefeated = (isFCK1 && g1 >= g2) || (isFCK2 && g2 >= g1);

    if (undefeated) {
      current++;
      if (current > longest) { longest = current; longestDate = new Date(m.matchDateTime).toLocaleDateString('de-DE'); }
    } else {
      current = 0;
    }
  });

  const el = document.getElementById('undefeated-series-count');
  if (el) el.textContent = current;

  const hs = document.getElementById('undefeated-series-highscore');
  if (hs) hs.textContent = longestDate
    ? `Längste Serie: ${longest} Spiele (zuletzt ${longestDate})`
    : 'Noch keine Serie vorhanden.';
}

// ── Series Visual ─────────────────────────────────────
function renderSeriesVisual(sorted) {
  const currentContainer = document.getElementById('undefeated-current-list');
  const longestContainer = document.getElementById('undefeated-longest-list');
  if (!currentContainer || !longestContainer) return;

  let tempSeries = [], longestSeries = [];

  sorted.forEach(m => {
    if (!m.matchIsFinished) return;
    if (m.leagueName?.toLowerCase().includes('dfb') && !m.leagueName?.toLowerCase().includes('bundesliga')) return;

    const isFCK1 = m.team1.teamName.toLowerCase().includes('kaiserslautern') || m.team1.shortName?.toLowerCase().includes('kaiserslautern');
    const isFCK2 = m.team2.teamName.toLowerCase().includes('kaiserslautern') || m.team2.shortName?.toLowerCase().includes('kaiserslautern');
    if (!isFCK1 && !isFCK2) return;

    const res = m.matchResults?.[1];
    if (!res) return;

    const fckGoals = isFCK1 ? res.pointsTeam1 : res.pointsTeam2;
    const oppGoals = isFCK1 ? res.pointsTeam2 : res.pointsTeam1;
    const opponent = isFCK1 ? m.team2 : m.team1;

    if (fckGoals < oppGoals) {
      if (tempSeries.length > longestSeries.length) longestSeries = [...tempSeries];
      tempSeries = [];
      return;
    }

    tempSeries.push({
      type: fckGoals > oppGoals ? 'win' : 'draw',
      date: new Date(m.matchDateTime).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }),
      logo: opponent.teamIconUrl || 'icons/default.png',
      opponent: opponent.teamName,
      result: `${fckGoals}:${oppGoals}`,
      tournament: m.leagueName || m.group?.groupName || '–'
    });
  });

  if (tempSeries.length > longestSeries.length) longestSeries = [...tempSeries];

  buildSeriesDOM(currentContainer, tempSeries);
  buildSeriesDOM(longestContainer, longestSeries);
}

function buildSeriesDOM(container, series) {
  container.innerHTML = '';
  if (!series.length) { container.innerHTML = '<span style="color:var(--muted);font-size:0.75rem">Keine Daten.</span>'; return; }

  series.forEach(game => {
    const item = document.createElement('div');
    item.className = 'series-item';

    const sym = game.type === 'win' ? '&#10003;' : '&#8211;';
    const cls = game.type === 'win' ? 'series-win' : 'series-draw';

    item.innerHTML = `
      <div class="series-circle ${cls}">${sym}</div>
      <img class="opp-logo" src="${game.logo}" alt="${game.opponent}" loading="lazy">
      <div class="series-tooltip">
        <strong>${game.opponent}</strong><br>
        ${game.result} &middot; ${game.date}<br>
        <span style="color:var(--muted)">${game.tournament}</span>
      </div>
    `;

    // Mobile click → modal
    item.addEventListener('click', () => {
      if (window.innerWidth > 768) return;
      document.getElementById('tooltip-modal')?.remove();
      const modal = document.createElement('div');
      modal.id = 'tooltip-modal';
      modal.innerHTML = `
        <div class="tooltip-modal-content">
          <button class="close-tooltip">&times;</button>
          <strong>${game.opponent}</strong><br>
          Ergebnis: ${game.result}<br>
          Datum: ${game.date}<br>
          Wettbewerb: ${game.tournament}
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector('.close-tooltip').addEventListener('click', () => modal.remove());
    });

    container.appendChild(item);
  });
}
