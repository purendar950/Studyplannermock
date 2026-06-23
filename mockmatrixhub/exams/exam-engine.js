// exam-engine.js — SSC CGL Mock Page Engine (self-contained / local data)

let EXAM_JSON = null;
let currentFilters = { category: 'PYQ MOCK', tier: null, year: '', type: 'full_mocks', section: '' };

// Local guest profile (no auth backend in this build)
function getLocalProfile() {
    return { username: 'Guest', is_paid: false };
}

// ── Tier Label Formatter ──────────────────────────────────────────────
function formatTierLabel(key) {
    const tierMatch = key.match(/^tier(\d+)$/i);
    if (tierMatch) {
        const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
        const n = parseInt(tierMatch[1], 10);
        return 'Tier ' + (roman[n - 1] || n);
    }
    return key
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// ── Filter Persistence ────────────────────────────────────────────────
function _filterCacheKey() {
    const pathParts = window.location.pathname.split('/');
    const examName = window.location.search
        ? window.location.search.slice(1)
        : pathParts[pathParts.length - 2];
    return `examFilters_${examName}`;
}
function saveFilters() {
    try { sessionStorage.setItem(_filterCacheKey(), JSON.stringify(currentFilters)); } catch (e) {}
}
function loadSavedFilters() {
    try {
        const saved = sessionStorage.getItem(_filterCacheKey());
        if (saved) Object.assign(currentFilters, JSON.parse(saved));
    } catch (e) {}
}

let CLOUD_CHECKLIST = {};

// ── Init ──────────────────────────────────────────────────────────────
async function initExamEngine() {
    loadSavedFilters();

    const pathParts = window.location.pathname.split('/');
    let examName = window.location.search
        ? window.location.search.slice(1)
        : pathParts[pathParts.length - 2];
    if (!examName || examName === 'cgl' || examName === '') examName = 'cgl';

    const syncEl = document.getElementById('grid-sync');
    if (syncEl) syncEl.innerText = "Loading...";

    try {
        const dataUrl = `../data/${examName}-data.json?t=${Date.now()}`;
        const response = await fetch(dataUrl);
        EXAM_JSON = await response.json();

        if (!EXAM_JSON.data['PYQ MOCK'] && EXAM_JSON.data['tier1']) {
            EXAM_JSON.data = { "PYQ MOCK": EXAM_JSON.data };
        }

        const categories = Object.keys(EXAM_JSON.data);
        renderCategoryFilters(categories);

        if (!categories.includes(currentFilters.category)) {
            currentFilters.category = categories[0];
        }

        const categoryData   = EXAM_JSON.data[currentFilters.category];
        const availableTiers = Object.keys(categoryData);

        if (!currentFilters.tier || !availableTiers.includes(currentFilters.tier)) {
            currentFilters.tier = availableTiers[0];
        }

        let years = Object.keys(categoryData[currentFilters.tier] || {});
        if (years.includes("default") || years.length === 0) {
            currentFilters.year = "default";
        } else {
            currentFilters.year = years.sort().reverse()[0];
        }

        setupFilters(years);
        renderMocks();

    } catch (e) {
        console.error("Engine initialization failed", e);
        const g = document.getElementById('grid-sync');
        if (g) g.innerText = "";
        const grid = document.getElementById('quizGrid');
        if (grid) grid.innerHTML = `<div class="text-center p-5 text-muted">Failed to load tests.</div>`;
    }
}

// ── Filters & Rendering ────────────────────────────────────────────────
function setupFilters(years) {
    const tierWrap     = document.getElementById('tier-wrap');
    const availableTiers = Object.keys(EXAM_JSON.data[currentFilters.category] || {});

    if (availableTiers.length > 1) {
        tierWrap.classList.remove('hidden');
        let tierHtml = '';
        availableTiers.forEach(t => {
            tierHtml += `<div class="pill-filter ${t === currentFilters.tier ? 'active' : ''}" onclick="setTier('${t}', this)">${formatTierLabel(t)}</div>`;
        });
        tierWrap.innerHTML = tierHtml;
    } else {
        tierWrap.classList.add('hidden');
        currentFilters.tier = availableTiers[0] || currentFilters.tier;
    }

    const yearScroll = document.getElementById('year-scroll');
    yearScroll.classList.remove('hidden');
    let yearHtml = '';
    years.forEach(y => {
        yearHtml += `<div class="pill-filter ${y === currentFilters.year ? 'active' : ''}" data-year="${y}" onclick="setYear('${y}', this)">${y === 'default' ? 'Tests' : y}</div>`;
    });
    yearScroll.innerHTML = yearHtml;

    const categoryData   = EXAM_JSON.data[currentFilters.category];
    const source         = (categoryData[currentFilters.tier] || {})[currentFilters.year] || {};
    const config         = EXAM_JSON.config[currentFilters.tier] || {};
    const fullCount      = (source.full_mocks   || []).length;
    const sectionsCount  = (config.sections     || []).length;
    const sectionalCount = fullCount * sectionsCount;
    const subjectCount   = (source.subject_wise || []).length;

    const typePills = document.querySelectorAll('#type-filters .pill-filter');
    if (typePills.length >= 3) {
        typePills[0].innerHTML = `Full Mocks (${fullCount})`;
        typePills[1].innerHTML = `Sectionals (${sectionalCount})`;
        typePills[2].innerHTML = `Subject Wise (${subjectCount})`;
        typePills[1].style.display = (sectionsCount === 0) ? 'none' : 'block';
    }

    typePills.forEach(pill => {
        pill.classList.remove('active');
        if (pill.getAttribute('onclick') && pill.getAttribute('onclick').includes(`'${currentFilters.type}'`)) {
            pill.classList.add('active');
        }
    });

    const secWrap = document.getElementById('section-wrap');
    if (currentFilters.type === 'sectional') {
        secWrap.classList.remove('hidden');
        renderSectionPills();
    } else {
        secWrap.classList.add('hidden');
    }
}

function renderMocks() {
    const grid      = document.getElementById('quizGrid');
    const config    = EXAM_JSON.config[currentFilters.tier];
    const source    = EXAM_JSON.data[currentFilters.category][currentFilters.tier][currentFilters.year];
    const searchVal = document.getElementById('mockSearch').value.toLowerCase();

    const profile    = getLocalProfile();
    const isPaidUser = profile ? profile.is_paid  : false;
    const username   = profile ? profile.username : "Guest";

    let html = '';
    let rawList        = source[currentFilters.type] || [];
    let itemsToDisplay = [];

    if (currentFilters.type === 'sectional') {
        const fullMocksForSection = source.full_mocks || [];
        const sectionDef = config.sections.find(s => s.id === currentFilters.section);
        fullMocksForSection.forEach(mock => {
            const cleanSec = sectionDef.backendName.replace(/\s+/g, '').toLowerCase();
            itemsToDisplay.push({
                ...mock,
                id:         `${mock.id}-${cleanSec}`,
                originalId: mock.id,
                title:      `${mock.title} - ${sectionDef.name}`,
                qs:         sectionDef.qs,
                time:       sectionDef.time,
                marks:      sectionDef.marks,
                linkParam:  `id=${mock.id}&section=${encodeURIComponent(sectionDef.backendName)}`
            });
        });
    } else {
        itemsToDisplay = rawList.map(item => ({ ...item, linkParam: `id=${item.id}`, originalId: item.id }));
    }

    itemsToDisplay.forEach(item => {
        if (searchVal && !item.title.toLowerCase().includes(searchVal)) return;

        let isLockedDate = false;
        if (item.releaseDate && item.releaseDate.trim() !== "") {
            const [day, month, year] = item.releaseDate.split('-').map(Number);
            const releaseDateObj = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            isLockedDate = releaseDateObj > today;
        }

        const accessDenied = item.type === 'paid' && !isPaidUser;

        const localResult = localStorage.getItem(`result_${username}_${item.id}`);
        const savedState  = JSON.parse(localStorage.getItem(`state_${username}_${item.id}`) || "{}");
        const isSubmitted = localResult !== null || !!CLOUD_CHECKLIST[item.id];

        let actionHtml = '';
        if (isLockedDate) {
            actionHtml = `<div class="action-btn unlock-btn" style="opacity:0.6;cursor:default;">Available ${item.releaseDate}</div>`;
        } else if (accessDenied) {
            actionHtml = `<a href="#" onclick="alert('This is a premium test. Free tests are marked FREE.');return false;" class="action-btn unlock-btn">&#128274; UNLOCK</a>`;
        } else if (isSubmitted) {
            actionHtml = `
                <div class="btn-grid btn-dual">
                    <a href="${getLink(config)}?${item.linkParam}" class="action-btn analysis-btn">ANALYSIS</a>
                    <button onclick="reattempt('${item.id}', '${getLink(config)}?${item.linkParam}')" class="action-btn reattempt-btn">REATTEMPT</button>
                </div>`;
        } else if (savedState.isPaused) {
            actionHtml = `<a href="${getLink(config)}?${item.linkParam}" class="action-btn resume-btn">&#9654; RESUME</a>`;
        } else {
            actionHtml = `<a href="${getLink(config)}?${item.linkParam}" class="action-btn start-btn">START TEST</a>`;
        }

        html += `
            <div class="mock-card">
                <div class="card-info">
                    <div class="card-title">${item.title} <span class="badge-type ${item.type === 'free' ? 'free-badge' : 'paid-badge'}">${item.type.toUpperCase()}</span></div>
                    <div class="card-meta">${item.qs || 100} Questions &#8226; ${item.marks || 200} Marks &#9201; ${item.time || '60 Min'}</div>
                </div>
                <div class="btn-grid">${actionHtml}</div>
            </div>
        `;
    });

    grid.innerHTML = html || `<div class="text-center p-5 text-muted">&#128640; Tests Coming Soon...</div>`;
    const g = document.getElementById('grid-sync');
    if (g) g.innerText = "";
}

function getLink(config) {
    if (currentFilters.type === 'full_mocks') return "../" + config.full_link;
    if (currentFilters.type === 'sectional')  return "../" + config.sectional_link;
    return "../" + config.subject_link;
}

function setYear(y, el) {
    document.querySelectorAll('#year-scroll .pill-filter').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    currentFilters.year = y;
    saveFilters();
    const years = Object.keys(EXAM_JSON.data[currentFilters.category][currentFilters.tier]);
    setupFilters(years);
    renderMocks();
}

function setTier(t, el) {
    document.querySelectorAll('#tier-wrap .pill-filter').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    currentFilters.tier = t;
    const years = Object.keys(EXAM_JSON.data[currentFilters.category][currentFilters.tier] || {});
    currentFilters.year = years.includes("default") ? "default" : years.sort().reverse()[0];
    saveFilters();
    setupFilters(years);
    renderMocks();
}

function filterType(type, el) {
    document.querySelectorAll('#type-filters .pill-filter').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    currentFilters.type = type;
    saveFilters();
    const secWrap = document.getElementById('section-wrap');
    if (type === 'sectional') {
        secWrap.classList.remove('hidden');
        renderSectionPills();
    } else {
        secWrap.classList.add('hidden');
        renderMocks();
    }
}

function renderSectionPills() {
    const sections      = EXAM_JSON.config[currentFilters.tier].sections;
    const source        = EXAM_JSON.data[currentFilters.category][currentFilters.tier][currentFilters.year];
    const fullMockCount = (source.full_mocks || []).length;

    const validIds = sections.map(s => s.id);
    if (!validIds.includes(currentFilters.section)) {
        currentFilters.section = sections[0].id;
    }

    let html = '';
    sections.forEach(s => {
        html += `<div class="pill-filter ${s.id === currentFilters.section ? 'active' : ''}" onclick="setSection('${s.id}', this)">${s.name} (${fullMockCount})</div>`;
    });
    document.getElementById('section-scroll').innerHTML = html;
    renderMocks();
}

function setSection(id, el) {
    document.querySelectorAll('#section-scroll .pill-filter').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    currentFilters.section = id;
    saveFilters();
    renderMocks();
}

function renderCategoryFilters(categories) {
    const wrap = document.getElementById('category-wrap');
    if (!wrap) return;
    wrap.classList.remove('hidden');
    let html = '';
    categories.forEach(cat => {
        html += `<div class="pill-filter ${cat === currentFilters.category ? 'active' : ''}" onclick="setCategory('${cat}', this)">${cat}</div>`;
    });
    wrap.innerHTML = html;
}

function setCategory(cat, el) {
    currentFilters.category = cat;
    document.querySelectorAll('#category-wrap .pill-filter').forEach(p => p.classList.remove('active'));
    el.classList.add('active');

    const categoryData   = EXAM_JSON.data[cat];
    const availableTiers = Object.keys(categoryData);
    if (!availableTiers.includes(currentFilters.tier)) {
        currentFilters.tier = availableTiers[0];
    }
    const years = Object.keys(categoryData[currentFilters.tier] || {});
    currentFilters.year = years.includes("default") ? "default" : years.sort().reverse()[0];
    saveFilters();
    setupFilters(years);
    renderMocks();
}

function reattempt(id, url) {
    const profile  = getLocalProfile();
    const username = profile ? profile.username : "Guest";
    if (!confirm("Confirm Reattempt? Your previous attempt will be cleared.")) return;
    localStorage.removeItem(`result_${username}_${id}`);
    localStorage.removeItem(`state_${username}_${id}`);
    delete CLOUD_CHECKLIST[id];
    window.location.href = url + "&mode=reattempt";
}

window.addEventListener('pageshow', function () {
    initExamEngine();
});
