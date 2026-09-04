// Simple tests for the summary logic in dashboardUtils.js.

import { getStudentSummary } from './dashboardUtils';

describe('getStudentSummary', () => {
  test('calculates totals and recent entries from service logs', () => {
    const summary = getStudentSummary([
      { id: 1, description: 'Tutoring', hours: 2, date_performed: '2026-08-01', approved_by: null },
      { id: 2, description: 'Food pantry', hours: 3, date_performed: '2026-07-28', approved_by: 5 },
      { id: 3, description: 'Library help', hours: 1.5, date_performed: '2026-07-25', approved_by: null },
    ]);

    expect(summary.totalHours).toBe(6.5);
    expect(summary.pendingCount).toBe(2);
    expect(summary.recentEntries).toHaveLength(2);
    expect(summary.latestEntry?.description).toBe('Tutoring');
  });
});
