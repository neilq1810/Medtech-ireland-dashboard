// ── SCORING ───────────────────────────────────────────────────────────────────
function proximityScore(company) {
  const km = company.distanceKm;
  if (km <= 50)  return 5;
  if (km <= 80)  return 4.5;
  if (km <= 110) return 4;
  if (km <= 150) return 3;
  if (km <= 200) return 2;
  if (km <= 250) return 1.5;
  return 1;
}

function computeScore(company) {
  const prox  = proximityScore(company);
  const deg   = company.degreeRelevanceScore;
  const grad  = company.gradWillingnessScore;
  const viab  = company.viabilityScore;
  const career= company.careerDevScore;
  const raw = (deg * 0.30) + (grad * 0.25) + (prox * 0.20) + (viab * 0.15) + (career * 0.10);
  return Math.round(raw * 10) / 10;
}

// Pre-compute scores
COMPANIES.forEach(c => { c._score = computeScore(c); c._proxScore = proximityScore(c); });

// ── STATE ─────────────────────────────────────────────────────────────────────
const state = {
  typeFilter: 'all',
  hubFilter: 'all',
  sortBy: 'score',
  mapInitialised: false,
  selectedHubId: null,
};

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const companyGrid   = document.getElementById('company-grid');
const resultCount   = document.getElementById('result-count');
const panelOverlay  = document.getElementById('panel-overlay');
const detailPanel   = document.getElementById('detail-panel');
const panelBody     = document.getElementById('panel-body');

// ── FILTERS & SORTING ─────────────────────────────────────────────────────────
function getFilteredSorted() {
  let list = [...COMPANIES];
  if (state.typeFilter !== 'all') list = list.filter(c => c.type === state.typeFilter);
  if (state.hubFilter  !== 'all') list = list.filter(c => c.hub  === state.hubFilter);
  list.sort((a, b) => {
    switch (state.sortBy) {
      case 'score':    return b._score - a._score;
      case 'distance': return a.distanceKm - b.distanceKm;
      case 'degree':   return b.degreeRelevanceScore - a.degreeRelevanceScore;
      case 'grad':     return b.gradWillingnessScore - a.gradWillingnessScore;
      default:         return b._score - a._score;
    }
  });
  return list;
}

// ── TYPE LABELS & ICONS ───────────────────────────────────────────────────────
const TYPE_LABELS = { pharma:'Pharma', biotech:'Biotech', medtech:'MedTech', cro:'CRO', cdmo:'CDMO' };
const TYPE_COLORS = { pharma:'#1565c0', biotech:'#00796b', medtech:'#c62828', cro:'#e65100', cdmo:'#6a1b9a' };

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const SVG = {
  pin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  car: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
  train: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm5.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm.5-7h-5V6h5v4z"/></svg>`,
  ext: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
};

// ── TRANSPORT LABEL ───────────────────────────────────────────────────────────
function transportLabel(score) {
  if (score >= 5) return '🚆 Excellent';
  if (score >= 4) return '🚆 Good';
  if (score >= 3) return '🚌 Moderate';
  if (score >= 2) return '🚗 Car best';
  return '🚗 Drive';
}

// ── RENDER CARDS ──────────────────────────────────────────────────────────────
function renderCards() {
  const list = getFilteredSorted();
  resultCount.textContent = `${list.length} compan${list.length === 1 ? 'y' : 'ies'}`;

  if (list.length === 0) {
    companyGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No companies match your filters</h3>
        <p>Try removing some filters to see more results.</p>
        <button class="empty-btn" onclick="resetFilters()">Clear Filters</button>
      </div>`;
    return;
  }

  companyGrid.innerHTML = list.map(c => {
    const score = c._score;
    const scoreClass = score >= 4 ? 'score-high' : score >= 3 ? 'score-mid' : 'score-low';
    const proxScore  = c._proxScore;
    const pct = v => Math.round((v/5)*100);

    return `
    <div class="company-card" data-id="${c.id}" data-type="${c.type}" onclick="openDetail('${c.id}')">
      <div class="card-header">
        <div class="card-title-area">
          <div class="card-name">${c.name}</div>
          <div class="card-location">${SVG.pin} ${c.location}</div>
          <span class="type-badge ${c.type}">${TYPE_LABELS[c.type]}</span>
        </div>
        <div class="score-badge ${scoreClass}">
          ${score.toFixed(1)}
          <span class="score-label">Score</span>
        </div>
      </div>
      <div class="card-tagline">${c.tagline}</div>
      <div class="metric-bars">
        <div class="metric-bar-row">
          <span class="metric-bar-label">Degree relevance</span>
          <div class="metric-bar-track"><div class="metric-bar-fill deg" style="width:${pct(c.degreeRelevanceScore)}%"></div></div>
          <span class="metric-bar-val">${c.degreeRelevanceScore}/5</span>
        </div>
        <div class="metric-bar-row">
          <span class="metric-bar-label">Grad willingness</span>
          <div class="metric-bar-track"><div class="metric-bar-fill grad" style="width:${pct(c.gradWillingnessScore)}%"></div></div>
          <span class="metric-bar-val">${c.gradWillingnessScore}/5</span>
        </div>
        <div class="metric-bar-row">
          <span class="metric-bar-label">Proximity</span>
          <div class="metric-bar-track"><div class="metric-bar-fill prox" style="width:${pct(proxScore)}%"></div></div>
          <span class="metric-bar-val">${proxScore}/5</span>
        </div>
        <div class="metric-bar-row">
          <span class="metric-bar-label">Company viability</span>
          <div class="metric-bar-track"><div class="metric-bar-fill viab" style="width:${pct(c.viabilityScore)}%"></div></div>
          <span class="metric-bar-val">${c.viabilityScore}/5</span>
        </div>
      </div>
      <div class="card-footer">
        <span class="distance-pill">${SVG.car} ${c.distanceKm} km &nbsp;·&nbsp; ${c.driveMinutes} min drive</span>
        <span class="transport-pill">${transportLabel(c.transportScore)}</span>
        <button class="view-btn" onclick="event.stopPropagation();openDetail('${c.id}')">Details →</button>
      </div>
    </div>`;
  }).join('');
}

// ── DETAIL PANEL ──────────────────────────────────────────────────────────────
let radarChart = null;

function openDetail(id) {
  const c = COMPANIES.find(x => x.id === id);
  if (!c) return;
  const score = c._score;
  const proxScore = c._proxScore;
  const scoreClass = score >= 4 ? 'score-high' : score >= 3 ? 'score-mid' : 'score-low';

  // Build paragraphs from description (split on double newline)
  const descParagraphs = c.description.split('\n\n').map(p => `<p>${p}</p>`).join('');

  panelBody.innerHTML = `
    <div class="panel-section">
      <div class="panel-section-title">Score Breakdown</div>
      <div class="chart-container">
        <canvas id="radar-chart" width="300" height="300"></canvas>
      </div>
      <div class="score-grid" style="margin-top:12px">
        <div class="score-item overall"><div class="score-item-val ${scoreClass.replace('score-','')} ">${score.toFixed(1)}</div><div class="score-item-label">Overall Score</div></div>
        <div class="score-item deg"><div class="score-item-val">${c.degreeRelevanceScore}/5</div><div class="score-item-label">Degree Relevance</div></div>
        <div class="score-item grad"><div class="score-item-val">${c.gradWillingnessScore}/5</div><div class="score-item-label">Grad Willingness</div></div>
        <div class="score-item prox"><div class="score-item-val">${proxScore}/5</div><div class="score-item-label">Proximity Score</div></div>
        <div class="score-item viab"><div class="score-item-val">${c.viabilityScore}/5</div><div class="score-item-label">Company Viability</div></div>
        <div class="score-item transport"><div class="score-item-val">${c.transportScore}/5</div><div class="score-item-label">Public Transport</div></div>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">About the Company</div>
      ${descParagraphs}
      <div class="panel-highlights">
        ${(c.highlights || []).map(h => `<span class="highlight-tag">✓ ${h}</span>`).join('')}
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Why It Suits US861 Biotechnology</div>
      <p>${c.whyItSuitsUS861}</p>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Placement & Graduate Info</div>
      <div class="placement-box">${c.placementInfo}</div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Getting There from Mullingar</div>
      <div class="transport-box">
        <strong>${SVG.car} Drive:</strong> ${c.distanceKm} km · ~${c.driveMinutes} min<br>
        <strong>Public transport:</strong> ${c.transportNote}
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Employees & Sector</div>
      <p><strong>Employees (Irish site):</strong> ${c.employees}<br>
      <strong>Sector:</strong> ${c.sector}</p>
      <a href="${c.website}" target="_blank" rel="noopener" class="website-btn">
        Visit Company Website ${SVG.ext}
      </a>
    </div>
  `;

  // Update panel header
  document.getElementById('panel-company-name').textContent = c.name;
  document.getElementById('panel-location-text').textContent = c.location;
  document.getElementById('panel-type-badge').className = `type-badge ${c.type}`;
  document.getElementById('panel-type-badge').textContent = TYPE_LABELS[c.type];

  // Open panel
  panelOverlay.classList.add('open');
  detailPanel.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Render radar chart
  setTimeout(() => {
    if (radarChart) { radarChart.destroy(); radarChart = null; }
    const ctx = document.getElementById('radar-chart');
    if (!ctx || typeof Chart === 'undefined') return;
    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Degree\nRelevance', 'Grad\nWillingness', 'Proximity', 'Viability', 'Career\nDev', 'Transport'],
        datasets: [{
          label: c.name,
          data: [c.degreeRelevanceScore, c.gradWillingnessScore, proxScore, c.viabilityScore, c.careerDevScore, c.transportScore],
          fill: true,
          backgroundColor: 'rgba(22,155,98,0.15)',
          borderColor: '#169B62',
          pointBackgroundColor: '#169B62',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#169B62',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0, max: 5,
            ticks: { stepSize: 1, display: false },
            grid: { color: '#eaeef5' },
            angleLines: { color: '#eaeef5' },
            pointLabels: { font: { size: 10, weight: '600' }, color: '#4a5568' }
          }
        }
      }
    });
  }, 80);
}

function closeDetail() {
  panelOverlay.classList.remove('open');
  detailPanel.classList.remove('open');
  document.body.style.overflow = '';
  if (radarChart) { radarChart.destroy(); radarChart = null; }
}

panelOverlay.addEventListener('click', closeDetail);
document.getElementById('panel-close').addEventListener('click', closeDetail);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });

// ── FILTER CHIP WIRING ────────────────────────────────────────────────────────
document.querySelectorAll('[data-type-filter]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-type-filter]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    state.typeFilter = el.dataset.typeFilter;
    renderCards();
  });
});

document.querySelectorAll('[data-hub-filter]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-hub-filter]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    state.hubFilter = el.dataset.hubFilter;
    renderCards();
  });
});

document.getElementById('sort-select').addEventListener('change', e => {
  state.sortBy = e.target.value;
  renderCards();
});

function resetFilters() {
  state.typeFilter = 'all';
  state.hubFilter = 'all';
  state.sortBy = 'score';
  document.querySelectorAll('[data-type-filter]').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('[data-hub-filter]').forEach(x => x.classList.remove('active'));
  document.querySelector('[data-type-filter="all"]').classList.add('active');
  document.querySelector('[data-hub-filter="all"]').classList.add('active');
  document.getElementById('sort-select').value = 'score';
  renderCards();
}

// ── TABS ──────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    const viewId = btn.dataset.view + '-view';
    document.getElementById(viewId).classList.add('active');
    if (btn.dataset.view === 'map' && !state.mapInitialised) initMap();
  });
});

// ── MAP ───────────────────────────────────────────────────────────────────────
const MULLINGAR = [53.5228, -7.3494];
const COMPANY_TYPE_COLORS = { pharma: '#1565c0', biotech: '#00796b', medtech: '#c62828', cro: '#e65100', cdmo: '#6a1b9a' };

function initMap() {
  state.mapInitialised = true;
  const map = L.map('map', { zoomControl: true }).setView([53.1, -8.0], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  // Mullingar home marker
  const homeIcon = L.divIcon({
    html: '<div class="home-marker">🏠</div>',
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
  L.marker(MULLINGAR, { icon: homeIcon })
    .addTo(map)
    .bindPopup('<div class="map-popup"><div class="map-popup-name">📍 Mullingar</div><div style="font-size:0.8rem;color:#6b7c9e">Home base — Co. Westmeath</div></div>');

  // Hub circles
  HUBS.filter(h => h.radiusKm > 0).forEach(hub => {
    L.circle([hub.centLat, hub.centLng], {
      radius: hub.radiusKm * 1000,
      color: hub.color,
      fillColor: hub.color,
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '4 4',
    }).addTo(map);
    L.marker([hub.centLat, hub.centLng], {
      icon: L.divIcon({
        html: `<div style="background:${hub.color};color:#fff;padding:3px 8px;border-radius:100px;font-size:0.7rem;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2)">${hub.name}</div>`,
        className: '',
        iconAnchor: [40, 10],
      })
    }).addTo(map);
  });

  // Company markers
  COMPANIES.forEach(c => {
    const col = COMPANY_TYPE_COLORS[c.type] || '#555';
    const score = c._score;
    const markerIcon = L.divIcon({
      html: `<div style="background:${col};color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer">${score.toFixed(1)}</div>`,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    const marker = L.marker([c.lat, c.lng], { icon: markerIcon }).addTo(map);
    marker.bindPopup(`
      <div class="map-popup">
        <div class="map-popup-name">${c.name}</div>
        <div class="map-popup-type" style="color:${col}">${TYPE_LABELS[c.type]} · ${c.location}</div>
        <div class="map-popup-score">Score: <strong>${score.toFixed(1)}/5</strong> · ${c.distanceKm} km from Mullingar</div>
        <button class="map-popup-btn" onclick="switchToExplorer('${c.id}')">View Full Details</button>
      </div>`, { maxWidth: 240 });
  });

  // Resize fix
  setTimeout(() => map.invalidateSize(), 200);
}

function switchToExplorer(companyId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelector('[data-view="explorer"]').classList.add('active');
  document.getElementById('explorer-view').classList.add('active');
  setTimeout(() => openDetail(companyId), 100);
}
window.switchToExplorer = switchToExplorer;

// ── HUB CARDS ─────────────────────────────────────────────────────────────────
function renderHubCards() {
  const container = document.getElementById('hub-cards');
  container.innerHTML = HUBS.map(hub => {
    const companies = COMPANIES.filter(c => c.hub === hub.id);
    return `
    <div class="hub-card" style="--hub-color:${hub.color}" data-hub-id="${hub.id}" onclick="selectHub('${hub.id}')">
      <div class="hub-card-header">
        <span class="hub-card-name">${hub.name}</span>
        <span class="hub-count">${companies.length} compan${companies.length !== 1 ? 'ies' : 'y'}</span>
      </div>
      <div class="hub-tagline">${hub.tagline}</div>
      <div class="hub-employers">
        ${hub.keyEmployers.slice(0,4).map(e => `<span class="hub-employer-tag">${e}</span>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function selectHub(hubId) {
  document.querySelectorAll('.hub-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`[data-hub-id="${hubId}"]`);
  if (card) card.classList.add('selected');

  const hub = HUBS.find(h => h.id === hubId);
  if (!hub) return;
  const companies = COMPANIES.filter(c => c.hub === hubId);
  const hubDetail = document.getElementById('hub-detail');

  const colDots = Array.from({length:5}, (_,i) =>
    `<div class="col-dot ${i < hub.costOfLiving ? 'filled' : 'empty'}"></div>`
  ).join('');

  hubDetail.innerHTML = `
    <h3 style="font-size:1.1rem;font-weight:800;color:#0d1f3c;margin-bottom:6px">${hub.name} Hub</h3>
    <p style="font-size:0.85rem;color:#334155;line-height:1.6;margin-bottom:12px">${hub.description}</p>
    <div style="margin-bottom:10px">
      <div style="font-size:0.75rem;font-weight:700;color:#6b7c9e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Cost of Living</div>
      <div class="col-dots">${colDots}</div>
    </div>
    <div style="margin-bottom:10px">
      <div style="font-size:0.75rem;font-weight:700;color:#6b7c9e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Student & Grad Community</div>
      <p style="font-size:0.82rem;color:#334155;line-height:1.5">${hub.studentCommunity}</p>
    </div>
    <div style="background:#f0f9f5;border-radius:10px;padding:12px;margin-bottom:10px">
      <div style="font-size:0.75rem;font-weight:700;color:#0d6b3e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">💡 Why Relocate Here?</div>
      <p style="font-size:0.82rem;color:#0d3d1e;line-height:1.5">${hub.whyRelocate}</p>
    </div>
    <div style="font-size:0.75rem;font-weight:700;color:#6b7c9e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Companies in this Hub</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${companies.sort((a,b)=>b._score-a._score).map(c => `
        <div onclick="switchToExplorer('${c.id}')" style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#f8faff;border-radius:8px;cursor:pointer;border:1px solid #e0e8f4;transition:background 0.15s"
          onmouseover="this.style.background='#e8f5ec'" onmouseout="this.style.background='#f8faff'">
          <div>
            <div style="font-weight:700;font-size:0.85rem;color:#0d1f3c">${c.name}</div>
            <div style="font-size:0.75rem;color:#6b7c9e">${TYPE_LABELS[c.type]} · ${c.distanceKm} km</div>
          </div>
          <div style="font-weight:800;font-size:0.9rem;color:${c._score>=4?'#0d6b3e':c._score>=3?'#8a5c00':'#8b0000'}">${c._score.toFixed(1)}</div>
        </div>`).join('')}
    </div>
  `;
  hubDetail.classList.add('visible');
  state.selectedHubId = hubId;
}
window.selectHub = selectHub;

// ── RESOURCES ─────────────────────────────────────────────────────────────────
function renderResources() {
  const container = document.getElementById('resources-grid');
  container.innerHTML = JOB_RESOURCES.map(cat => `
    <div class="resource-category">
      <div class="resource-category-title">${cat.category}</div>
      ${cat.links.map(link => `
        <a href="${link.url}" target="_blank" rel="noopener" class="resource-link">
          <span class="resource-link-name">${link.name} ${SVG.ext}</span>
          <span class="resource-link-desc">${link.desc}</span>
        </a>`).join('')}
    </div>`).join('');
}

// ── STATS BAR ─────────────────────────────────────────────────────────────────
function renderStats() {
  const near = COMPANIES.filter(c => c.distanceKm <= 100).length;
  const topScore = Math.max(...COMPANIES.map(c => c._score));
  const totalHubs = HUBS.length;
  document.getElementById('stat-near').textContent = near;
  document.getElementById('stat-score').textContent = topScore.toFixed(1);
  document.getElementById('stat-total').textContent = COMPANIES.length;
  document.getElementById('stat-hubs').textContent = totalHubs;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
renderStats();
renderCards();
renderHubCards();
renderResources();
