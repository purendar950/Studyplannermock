// exam-engine.js — CGL browser driven by studyplanner data (CGL_TESTS from /assets/js/data.js)

let currentFilters = { tier: 'tier1', type: 'full_mocks' };

const TYPE_MAP = { full_mocks: 'full', sectional: 'sectional', subject_wise: 'subject' };

function getLocalProfile() { return { username: 'Guest', is_paid: true }; }

function _catalogue() {
  // Build { tier1:{full:[],sectional:[],subject:[]}, tier2:{...} } from CGL_TESTS
  const cat = {};
  (typeof CGL_TESTS !== 'undefined' ? CGL_TESTS : []).forEach(t => {
    if (!cat[t.tier]) cat[t.tier] = { full: [], sectional: [], subject: [] };
    (cat[t.tier][t.category] || (cat[t.tier][t.category] = [])).push(t);
  });
  return cat;
}

function initExamEngine() {
  const cat = _catalogue();
  const tiers = Object.keys(cat);
  if (!tiers.includes(currentFilters.tier)) currentFilters.tier = tiers[0] || 'tier1';
  renderTierPills(tiers);
  setupTypeCounts();
  renderMocks();
}

function renderTierPills(tiers) {
  const wrap = document.getElementById('tier-wrap');
  if (!wrap) return;
  const label = { tier1: 'Tier I', tier2: 'Tier II' };
  wrap.innerHTML = tiers.map(t =>
    `<div class="pill-filter ${t === currentFilters.tier ? 'active' : ''}" onclick="setTier('${t}', this)">${label[t] || t}</div>`
  ).join('');
}

function setupTypeCounts() {
  const cat = _catalogue();
  const tierData = cat[currentFilters.tier] || { full: [], sectional: [], subject: [] };
  const pills = document.querySelectorAll('#type-filters .pill-filter');
  if (pills.length >= 3) {
    pills[0].innerHTML = `Full Mocks (${(tierData.full || []).length})`;
    pills[1].innerHTML = `Sectionals (${(tierData.sectional || []).length})`;
    pills[2].innerHTML = `Subject Wise (${(tierData.subject || []).length})`;
  }
  pills.forEach(p => {
    p.classList.remove('active');
    const oc = p.getAttribute('onclick') || '';
    if (oc.includes(`'${currentFilters.type}'`)) p.classList.add('active');
  });
}

function setTier(t, el) {
  currentFilters.tier = t;
  document.querySelectorAll('#tier-wrap .pill-filter').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  setupTypeCounts();
  renderMocks();
}

function filterType(type, el) {
  currentFilters.type = type;
  document.querySelectorAll('#type-filters .pill-filter').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  renderMocks();
}

function renderMocks() {
  const grid = document.getElementById('quizGrid');
  if (!grid) return;
  const cat = _catalogue();
  const tierData = cat[currentFilters.tier] || {};
  const list = tierData[TYPE_MAP[currentFilters.type]] || [];
  const searchVal = (document.getElementById('mockSearch').value || '').toLowerCase();
  const username = 'Guest';

  let html = '';
  list.forEach(item => {
    if (searchVal && !item.title.toLowerCase().includes(searchVal)) return;

    const isFree = item.free !== false;
    const link = `../test.html?id=${encodeURIComponent(item.id)}`;
    const result = localStorage.getItem(`result_${username}_${item.id}`);
    const savedState = JSON.parse(localStorage.getItem(`state_${username}_${item.id}`) || '{}');
    const isSubmitted = result !== null;

    let actionHtml;
    if (isSubmitted) {
      actionHtml = `
        <a href="${link}" class="action-btn analysis-btn">ANALYSIS</a>
        <button onclick="reattempt('${item.id}', '${link}')" class="action-btn reattempt-btn">REATTEMPT</button>`;
    } else if (savedState.isPaused) {
      actionHtml = `<a href="${link}" class="action-btn resume-btn">&#9654; RESUME</a>`;
    } else {
      actionHtml = `<a href="${link}" class="action-btn start-btn">START TEST</a>`;
    }

    const newBadge = item.isNew ? `<span class="badge-type" style="background:#ef4444;color:#fff;">NEW</span>` : '';
    html += `
      <div class="mock-card">
        <div class="card-info">
          <div class="card-title">${item.title}
            <span class="badge-type ${isFree ? 'free-badge' : 'paid-badge'}">${isFree ? 'FREE' : 'PAID'}</span> ${newBadge}
          </div>
          <div class="card-meta">${item.questions} Questions &#8226; ${item.marks} Marks &#9201; ${item.minutes} Min &#8226; ${item.level || 'Moderate'}</div>
        </div>
        <div class="btn-grid">${actionHtml}</div>
      </div>`;
  });

  grid.innerHTML = html || `<div class="text-center p-5 text-muted">&#128640; No tests in this category yet.</div>`;
  const sync = document.getElementById('grid-sync');
  if (sync) sync.innerText = '';
}

function reattempt(id, url) {
  if (!confirm('Confirm Reattempt? Your previous attempt will be cleared.')) return;
  localStorage.removeItem(`result_Guest_${id}`);
  localStorage.removeItem(`state_Guest_${id}`);
  window.location.href = url + '&mode=reattempt';
}

window.addEventListener('pageshow', initExamEngine);
