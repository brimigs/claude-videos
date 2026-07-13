const SCORE_WEIGHTS = Object.freeze({
  impact: Object.freeze({
    outage: 90,
    partial_outage: 40,
    degraded: 46,
    limited: 24,
    internal: 8,
  }),
  reportsPerUnit: 2,
  reportsCap: 60,
  revenueDollarsPerUnit: 5000,
  revenueCap: 30,
  ageMinutesPerUnit: 45,
  ageCap: 20,
  activeStatusBonus: 8,
});

const SLA_TARGETS_MINUTES = Object.freeze({
  SEV1: 30,
  SEV2: 120,
  SEV3: 480,
  SEV4: 2880,
});

const SLA_RANK = Object.freeze({
  breached: 3,
  watch: 2,
  healthy: 1,
});

/**
 * Calculate the incident priority score used by the triage queue.
 *
 * @param {object} incident - Incident fixture or API object.
 * @returns {number} Priority score where higher means more urgent.
 */
export function calculateIncidentScore(incident) {
  const impactScore = SCORE_WEIGHTS.impact[incident.customerImpact] ?? 0;
  const reportScore =
    Math.min(Number(incident.reports) || 0, SCORE_WEIGHTS.reportsCap) * SCORE_WEIGHTS.reportsPerUnit;
  const revenueScore = Math.min(
    Math.ceil((Number(incident.revenueAtRisk) || 0) / SCORE_WEIGHTS.revenueDollarsPerUnit),
    SCORE_WEIGHTS.revenueCap,
  );
  const ageScore = Math.min(
    Math.floor((Number(incident.minutesOpen) || 0) / SCORE_WEIGHTS.ageMinutesPerUnit),
    SCORE_WEIGHTS.ageCap,
  );
  const activeStatusBonus = incident.status === 'active' ? SCORE_WEIGHTS.activeStatusBonus : 0;

  return impactScore + reportScore + revenueScore + ageScore + activeStatusBonus;
}

/**
 * Resolve severity from incident data.
 *
 * @param {object} incident - Incident fixture or API object.
 * @returns {'SEV1' | 'SEV2' | 'SEV3' | 'SEV4'} Severity label.
 */
export function getSeverity(incident) {
  if (incident.customerImpact === 'outage') {
    return 'SEV1';
  }

  const score = calculateIncidentScore(incident);

  if (score >= 110) {
    return 'SEV1';
  }

  if (score >= 56) {
    return 'SEV2';
  }

  if (score >= 28) {
    return 'SEV3';
  }

  return 'SEV4';
}

/**
 * Determine whether an incident is inside, near, or outside its response target.
 *
 * @param {object} incident - Incident fixture or API object.
 * @returns {'healthy' | 'watch' | 'breached'} SLA state.
 */
export function getSlaState(incident) {
  const severity = getSeverity(incident);
  const target = SLA_TARGETS_MINUTES[severity];
  const ratio = (Number(incident.minutesOpen) || 0) / target;

  if (ratio >= 1) {
    return 'breached';
  }

  if (ratio >= 0.75) {
    return 'watch';
  }

  return 'healthy';
}

/**
 * Add derived triage fields while preserving the original incident.
 *
 * @param {object} incident - Incident fixture or API object.
 * @returns {object} Incident with score, severity, SLA, and display fields.
 */
export function normalizeIncident(incident) {
  const score = calculateIncidentScore(incident);
  const severity = getSeverity(incident);
  const slaState = getSlaState(incident);

  return {
    ...incident,
    score,
    severity,
    slaState,
    ageLabel: formatMinutes(incident.minutesOpen),
  };
}

/**
 * Filter incidents by team, status, and a text query.
 *
 * @param {object} fields - Filter fields.
 * @param {readonly object[]} fields.incidents - Incidents to filter.
 * @param {string} [fields.team] - Owner team or "all".
 * @param {string} [fields.status] - Status or "all".
 * @param {string} [fields.query] - Search text.
 * @returns {object[]} Filtered incidents.
 */
export function filterIncidents({ incidents, team = 'all', status = 'all', query = '' }) {
  const normalizedQuery = query.trim().toLowerCase();

  return incidents.filter((incident) => {
    const matchesTeam = team === 'all' || incident.ownerTeam === team;
    const matchesStatus = status === 'all' || incident.status === status;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${incident.title} ${incident.service} ${incident.ownerTeam}`.toLowerCase().includes(normalizedQuery);

    return matchesTeam && matchesStatus && matchesQuery;
  });
}

/**
 * Sort incidents in the order responders should inspect them.
 *
 * @param {readonly object[]} incidents - Incidents to sort.
 * @returns {object[]} Normalized and sorted incidents.
 */
export function sortIncidentsForQueue(incidents) {
  return incidents
    .map((incident) => normalizeIncident(incident))
    .toSorted((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (SLA_RANK[right.slaState] !== SLA_RANK[left.slaState]) {
        return SLA_RANK[right.slaState] - SLA_RANK[left.slaState];
      }

      if (right.revenueAtRisk !== left.revenueAtRisk) {
        return right.revenueAtRisk - left.revenueAtRisk;
      }

      return right.minutesOpen - left.minutesOpen;
    });
}

/**
 * Summarize queue health for the dashboard.
 *
 * @param {readonly object[]} incidents - Incidents to summarize.
 * @returns {object} Summary metrics for the UI and API.
 */
export function summarizeIncidents(incidents) {
  const normalized = incidents.map((incident) => normalizeIncident(incident));
  const openIncidents = normalized.filter((incident) => incident.status !== 'mitigated');
  const breached = normalized.filter((incident) => incident.slaState === 'breached');
  const revenueAtRisk = normalized.reduce((total, incident) => total + incident.revenueAtRisk, 0);
  const sev1 = normalized.filter((incident) => incident.severity === 'SEV1');

  return {
    openCount: openIncidents.length,
    breachedCount: breached.length,
    sev1Count: sev1.length,
    revenueAtRisk,
  };
}

function formatMinutes(minutesOpen) {
  const minutes = Number(minutesOpen) || 0;

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours < 24) {
    return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
  }

  const days = Math.floor(hours / 24);
  const leftoverHours = hours % 24;

  return leftoverHours === 0 ? `${days}d` : `${days}d ${leftoverHours}h`;
}
