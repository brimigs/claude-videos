import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { INCIDENTS } from '../src/data/incidents.mjs';
import {
  calculateIncidentScore,
  filterIncidents,
  getSeverity,
  getSlaState,
  sortIncidentsForQueue,
  summarizeIncidents,
} from '../src/triage/rules.mjs';

describe('triage rules', () => {
  it('should always classify outages as SEV1', () => {
    const severity = getSeverity({
      customerImpact: 'outage',
      minutesOpen: 2,
      reports: 1,
      revenueAtRisk: 0,
      status: 'watching',
    });

    assert.equal(severity, 'SEV1');
  });

  it('should weight partial_outage between outage and degraded, not below degraded', () => {
    const base = { minutesOpen: 30, reports: 5, revenueAtRisk: 10000, status: 'active' };

    const outageScore = calculateIncidentScore({ ...base, customerImpact: 'outage' });
    const partialOutageScore = calculateIncidentScore({ ...base, customerImpact: 'partial_outage' });
    const degradedScore = calculateIncidentScore({ ...base, customerImpact: 'degraded' });

    assert.equal(partialOutageScore < outageScore, true);
    assert.equal(partialOutageScore > degradedScore, true);
  });

  it('should not force SEV1 for partial_outage without a high enough score', () => {
    const severity = getSeverity({
      customerImpact: 'partial_outage',
      minutesOpen: 2,
      reports: 1,
      revenueAtRisk: 0,
      status: 'watching',
    });

    assert.notEqual(severity, 'SEV1');
  });

  it('should mark incidents as breached after the severity target', () => {
    const state = getSlaState({
      customerImpact: 'degraded',
      minutesOpen: 130,
      reports: 10,
      revenueAtRisk: 42000,
      status: 'active',
    });

    assert.equal(state, 'breached');
  });

  it('should sort the highest-risk incident first', () => {
    const queue = sortIncidentsForQueue(INCIDENTS);

    assert.equal(queue[0].id, 'inc-1047');
    assert.equal(queue[0].severity, 'SEV1');
    assert.equal(queue[0].slaState, 'breached');
  });

  it('should filter by team, status, and query', () => {
    const results = filterIncidents({
      incidents: INCIDENTS,
      query: 'invoice',
      status: 'investigating',
      team: 'Revenue',
    });

    assert.deepEqual(
      results.map((incident) => incident.id),
      ['inc-1046'],
    );
  });

  it('should summarize queue health', () => {
    const summary = summarizeIncidents(INCIDENTS);

    assert.equal(summary.openCount, 7);
    assert.equal(summary.sev1Count, 1);
    assert.equal(summary.breachedCount > 0, true);
    assert.equal(summary.revenueAtRisk, 328000);
  });
});
