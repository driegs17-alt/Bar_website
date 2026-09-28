const resultsContainer = document.querySelector('#results');
const searchInput = document.querySelector('#searchInput');
const locationFilter = document.querySelector('#locationFilter');
const typeFilter = document.querySelector('#typeFilter');
const clearFiltersButton = document.querySelector('#clearFilters');
const resultCount = document.querySelector('#resultCount');
const currentYear = document.querySelector('#currentYear');

let venues = [];

async function loadVenues() {
  try {
    const response = await fetch('./data.json');

    if (!response.ok) {
      throw new Error(`Unable to load data.json: ${response.status}`);
    }

    venues = await response.json();
    populateFilters(venues);
    renderVenues(venues);
  } catch (error) {
    console.error(error);
    resultsContainer.setAttribute('aria-busy', 'false');
    resultsContainer.innerHTML = `
      <p class="error-message">
        The venue guide could not load. Please run this project through a local server, such as VS Code Live Server.
      </p>
    `;
    resultCount.textContent = 'Guide unavailable';
  }
}

function populateFilters(data) {
  const locations = [...new Set(data.map((venue) => venue.Location))].sort();
  const types = [...new Set(data.map((venue) => venue.Type))].sort();

  locationFilter.innerHTML = `
    <option value="">All neighborhoods</option>
    ${locations.map((location) => `<option value="${escapeHTML(location)}">${escapeHTML(location)}</option>`).join('')}
  `;

  typeFilter.innerHTML = `
    <option value="">All venue types</option>
    ${types.map((type) => `<option value="${escapeHTML(type)}">${escapeHTML(type)}</option>`).join('')}
  `;
}

function getFilteredVenues() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedLocation = locationFilter.value;
  const selectedType = typeFilter.value;

  return venues.filter((venue) => {
    const searchableText = [
      venue.Name,
      venue.Location,
      venue.Type,
      venue.Vibe,
      venue['Key Feature']
    ].join(' ').toLowerCase();

    return (
      (!searchTerm || searchableText.includes(searchTerm)) &&
      (!selectedLocation || venue.Location === selectedLocation) &&
      (!selectedType || venue.Type === selectedType)
    );
  });
}

function renderVenues(data) {
  resultsContainer.setAttribute('aria-busy', 'false');
  resultCount.textContent = `${data.length} ${data.length === 1 ? 'place' : 'places'} found`;

  if (data.length === 0) {
    resultsContainer.innerHTML = `
      <p class="empty-message">No places match those filters. Try a different search or clear your filters.</p>
    `;
    return;
  }

  resultsContainer.innerHTML = data.map((venue) => `
    <article class="venue-card" data-id="${venue.ID}">
      <span class="venue-location">${escapeHTML(venue.Location)}</span>
      <h3>${escapeHTML(venue.Name)}</h3>
      <p class="venue-type">${escapeHTML(venue.Type)}</p>
      <p class="venue-feature">${escapeHTML(venue.Vibe)} · ${escapeHTML(venue['Key Feature'])}</p>
    </article>
  `).join('');
}

function updateResults() {
  renderVenues(getFilteredVenues());
}

function clearFilters() {
  searchInput.value = '';
  locationFilter.value = '';
  typeFilter.value = '';
  updateResults();
  searchInput.focus();
}

function escapeHTML(value) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

searchInput.addEventListener('input', updateResults);
locationFilter.addEventListener('change', updateResults);
typeFilter.addEventListener('change', updateResults);
clearFiltersButton.addEventListener('click', clearFilters);

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

loadVenues();
