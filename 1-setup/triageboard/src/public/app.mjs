const state = {
  incidents: [],
  summary: undefined,
  filters: {
    team: 'all',
    status: 'all',
    query: '',
  },
};

const elements = {
  incidentList: document.querySelector('#incidentList'),
  queueCount: document.querySelector('#queueCount'),
  searchInput: document.querySelector('#searchInput'),
  statusFilter: document.querySelector('#statusFilter'),
  summaryGrid: document.querySelector('#summaryGrid'),
  teamFilter: document.querySelector('#teamFilter'),
  updatedAt: document.querySelector('#updatedAt'),
};

async function loadIncidents() {
  try {
    const response = await fetch('/api/incidents');

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const payload = await response.json();
    state.incidents = payload.incidents;
    state.summary = payload.summary;

    elements.updatedAt.textContent = `Updated ${formatTime(payload.updatedAt)}`;
    renderTeamOptions(payload.incidents);
    render();
  } catch (error) {
    renderError(error);
  }
}

function renderTeamOptions(incidents) {
  const teams = [...new Set(incidents.map((incident) => incident.ownerTeam))].toSorted();

  for (const team of teams) {
    const option = document.createElement('option');
    option.value = team;
    option.textContent = team;
    elements.teamFilter.append(option);
  }
}

function render() {
  renderSummary();
  renderIncidents();
}

function renderSummary() {
  elements.summaryGrid.replaceChildren(
    createMetricCard({
      label: 'Open',
      value: state.summary.openCount,
      caption: 'Unmitigated incidents',
    }),
    createMetricCard({
      label: 'SEV1',
      value: state.summary.sev1Count,
      caption: 'Executive response',
    }),
    createMetricCard({
      label: 'SLA Breached',
      value: state.summary.breachedCount,
      caption: 'Past target response',
    }),
    createMetricCard({
      label: 'Revenue Risk',
      value: formatCurrency(state.summary.revenueAtRisk),
      caption: 'Across active queue',
    }),
  );
}

function renderIncidents() {
  const incidents = getVisibleIncidents();
  elements.queueCount.textContent = `${incidents.length} incidents shown`;

  if (incidents.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No incidents match the current filters.';
    elements.incidentList.replaceChildren(empty);
    return;
  }

  elements.incidentList.replaceChildren(...incidents.map((incident) => createIncidentCard(incident)));
}

function getVisibleIncidents() {
  const query = state.filters.query.trim().toLowerCase();

  return state.incidents.filter((incident) => {
    const matchesTeam = state.filters.team === 'all' || incident.ownerTeam === state.filters.team;
    const matchesStatus = state.filters.status === 'all' || incident.status === state.filters.status;
    const matchesQuery =
      query.length === 0 ||
      `${incident.title} ${incident.service} ${incident.ownerTeam}`.toLowerCase().includes(query);

    return matchesTeam && matchesStatus && matchesQuery;
  });
}

function createMetricCard({ label, value, caption }) {
  const card = document.createElement('article');
  card.className = 'summary-card';

  const labelElement = document.createElement('div');
  labelElement.className = 'metric-label';
  labelElement.textContent = label;

  const valueElement = document.createElement('div');
  valueElement.className = 'metric-value';
  valueElement.textContent = String(value);

  const captionElement = document.createElement('div');
  captionElement.className = 'metric-caption';
  captionElement.textContent = caption;

  card.append(labelElement, valueElement, captionElement);
  return card;
}

function createIncidentCard(incident) {
  const card = document.createElement('article');
  card.className = 'incident-card';

  const content = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'incident-title';
  title.textContent = incident.title;

  const meta = document.createElement('div');
  meta.className = 'incident-meta';
  meta.append(
    createMetaItem(incident.id),
    createMetaItem(incident.service),
    createMetaItem(incident.ownerTeam),
    createMetaItem(`${incident.ageLabel} open`),
    createMetaItem(formatCurrency(incident.revenueAtRisk)),
  );

  content.append(title, meta);

  const badges = document.createElement('div');
  badges.className = 'badge-row';
  badges.append(
    createBadge(incident.severity, `severity-${incident.severity}`),
    createBadge(incident.slaState, `sla-${incident.slaState}`),
    createBadge(incident.status, 'status'),
  );

  const scoreLine = document.createElement('div');
  scoreLine.className = 'score-line';
  scoreLine.setAttribute('aria-label', `Priority score ${incident.score}`);

  const scoreBar = document.createElement('div');
  scoreBar.className = 'score-bar';
  scoreBar.style.width = `${Math.min(incident.score, 140) / 1.4}%`;
  scoreLine.append(scoreBar);

  card.append(content, badges, scoreLine);
  return card;
}

function createMetaItem(text) {
  const item = document.createElement('span');
  item.textContent = text;
  return item;
}

function createBadge(text, tone) {
  const badge = document.createElement('span');
  badge.className = `badge ${tone}`;
  badge.textContent = text;
  return badge;
}

function renderError(error) {
  const panel = document.createElement('div');
  panel.className = 'error-state';
  panel.textContent = error instanceof Error ? error.message : 'Unable to load incidents.';
  elements.incidentList.replaceChildren(panel);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: value >= 100000 ? 'compact' : 'standard',
    style: 'currency',
  }).format(value);
}

function formatTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

elements.teamFilter.addEventListener('change', (event) => {
  state.filters.team = event.target.value;
  renderIncidents();
});

elements.statusFilter.addEventListener('change', (event) => {
  state.filters.status = event.target.value;
  renderIncidents();
});

elements.searchInput.addEventListener('input', (event) => {
  state.filters.query = event.target.value;
  renderIncidents();
});

await loadIncidents();
