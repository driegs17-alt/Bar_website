// ============================================================
// After Hours Athens — script.js
// One script for every page. <body data-page="..."> tells it
// which venues to show: home, bars, restaurants, or music.
// ============================================================

// ---------- 1. Settings ----------
const page = document.body.dataset.page;

// Which venues belong on each page (based on data.json fields)
const hasLiveMusic = (v) => /^yes|dj/i.test(v['Live Music']) || /music/i.test(v['Venue Category']);
const hasPatio = (v) => /^yes/i.test(v['Outdoor Space']);
const PAGE_RULES = {
  home: () => true,
  bars: (v) => /bar|pub|brewery/i.test(v['Venue Category']) && !/diner/i.test(v['Venue Category']),
  restaurants: (v) => /restaurant|gastropub|diner|seafood/i.test(v['Venue Category']),
  music: hasLiveMusic
};

// Sorting system: every venue gets one "style" based on its category.
// The first style whose pattern matches wins, so order matters.
const STYLES = [
  { label: 'Live music venues',         test: /music/i },
  { label: 'Restaurants & gastropubs',  test: /restaurant|diner|seafood|gastropub/i },
  { label: 'Cocktail bars & lounges',   test: /cocktail|rooftop|art bar/i },
  { label: 'Pubs, breweries & coffee',  test: /pub|brewery|coffee/i },
  { label: 'Sports, games & dancing',   test: /sports|arcade|dance/i },
  { label: 'Dives & neighborhood bars', test: /./ }
];
const getStyle = (v) => STYLES.find((s) => s.test.test(v['Venue Category']));

// ---------- 2. Page elements (only exist on guide pages) ----------
const $ = (selector) => document.querySelector(selector);
const results = $('#results'), jumpNav = $('#jumpNav'), resultCount = $('#resultCount');
const searchInput = $('#searchInput'), hoodFilter = $('#hoodFilter'), groupBy = $('#groupBy');
const musicPill = $('#musicPill'), patioPill = $('#patioPill');

let venues = [];

// ---------- 3. Load data ----------
async function loadVenues() {
  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error(`data.json: ${response.status}`);
    venues = (await response.json()).filter(PAGE_RULES[page] || PAGE_RULES.home);

    fillCounts();
    if (results) {
      const hoods = [...new Set(venues.map((v) => v.Neighborhood))].sort();
      hoodFilter.innerHTML = '<option value="">All neighborhoods</option>' + hoods.map((h) => `<option>${h}</option>`).join('');
      render();
    }
  } catch (error) {
    console.error(error);
    if (results) results.innerHTML = '<p class="message">The guide could not load. Please open this project with a local server, such as VS Code Live Server.</p>';
  }
}

// Home page: show how many venues are behind each doorway
async function fillCounts() {
  if (page !== 'home') return;
  document.querySelectorAll('[data-count]').forEach((el) => {
    el.textContent = venues.filter(PAGE_RULES[el.dataset.count]).length;
  });
}

// ---------- 4. Filter, sort, group ----------
function getVisibleVenues() {
  const term = searchInput.value.trim().toLowerCase();
  return venues
    .filter((v) => !term || Object.values(v).join(' ').toLowerCase().includes(term))
    .filter((v) => !hoodFilter.value || v.Neighborhood === hoodFilter.value)
    .filter((v) => musicPill.getAttribute('aria-pressed') !== 'true' || hasLiveMusic(v))
    .filter((v) => patioPill.getAttribute('aria-pressed') !== 'true' || hasPatio(v))
    .sort((a, b) => a['Venue Name'].localeCompare(b['Venue Name']));
}

// Returns [{ label, items }] for the chosen "Group by" option
function groupVenues(list) {
  const mode = groupBy.value;
  if (mode === 'style') {
    return STYLES.map((s) => ({ label: s.label, items: list.filter((v) => getStyle(v) === s) }));
  }
  const key = (v) => (mode === 'hood' ? v.Neighborhood : v['Venue Name'][0].toUpperCase());
  return [...new Set(list.map(key))].sort()
    .map((k) => ({ label: k, items: list.filter((v) => key(v) === k) }));
}

// ---------- 5. Draw the page ----------
const slug = (text) => 'group-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function cardHTML(v) {
  const tags = [hasLiveMusic(v) && 'Live music', hasPatio(v) && 'Patio'].filter(Boolean);
  return `
    <article class="venue-card">
      <div class="venue-meta label">
        <span class="venue-type">${v['Venue Category']}</span>
        <span>${v.Neighborhood}</span>
      </div>
      <h3>${v['Venue Name']}</h3>
      <p class="venue-summary">${v['At a Glance']}</p>
      <dl class="facts">
        <div><dt class="label">Best for</dt><dd>${v['Best For']}</dd></div>
      </dl>
      <ul class="tags">${tags.map((t) => `<li>${t}</li>`).join('')}</ul>
    </article>`;
}

function render() {
  const list = getVisibleVenues();
  const groups = groupVenues(list).filter((g) => g.items.length);
  resultCount.textContent = `${list.length} ${list.length === 1 ? 'place' : 'places'}`;

  // Sticky index: one chip per group, colour-matched to the cards
  jumpNav.innerHTML = groups.map((g) =>
    `<a href="#${slug(g.label)}" >${g.label}<b>${g.items.length}</b></a>`).join('');

  results.innerHTML = groups.length ? groups.map((g) => `
    <section class="group" id="${slug(g.label)}">
      <div class="group-header">
        <h2>${g.label}</h2><span class="label">${g.items.length}</span>
      </div>
      <div class="venue-grid">${g.items.map(cardHTML).join('')}</div>
    </section>`).join('') : '<p class="message">No places match those filters. Try clearing them.</p>';
}

function togglePill(pill) {
  pill.setAttribute('aria-pressed', String(pill.getAttribute('aria-pressed') !== 'true'));
  render();
}

function clearFilters() {
  searchInput.value = hoodFilter.value = '';
  groupBy.value = 'style';
  [musicPill, patioPill].forEach((p) => p.setAttribute('aria-pressed', 'false'));
  render();
}

// ---------- 6. Events & start ----------
if (results) {
  searchInput.addEventListener('input', render);
  hoodFilter.addEventListener('change', render);
  groupBy.addEventListener('change', render);
  musicPill.addEventListener('click', () => togglePill(musicPill));
  patioPill.addEventListener('click', () => togglePill(patioPill));
  $('#clearFilters').addEventListener('click', clearFilters);
}
$('#currentYear').textContent = new Date().getFullYear();
loadVenues();
