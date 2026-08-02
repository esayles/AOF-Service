// Generate a summary of student service logs, including total hours, pending count, recent entries, and the latest entry.

export function getStudentSummary(serviceLogs = []) {
  const normalizedLogs = Array.isArray(serviceLogs) ? serviceLogs : [];

  const totalHours = normalizedLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0);
  const pendingCount = normalizedLogs.filter((log) => !log.approved_by).length;
  const recentEntries = [...normalizedLogs]
    .sort((a, b) => new Date(b.date_performed || 0) - new Date(a.date_performed || 0))
    .slice(0, 2);
  const latestEntry = recentEntries[0] || null;

  return {
    totalHours: Number(totalHours.toFixed(2)),
    pendingCount,
    recentEntries,
    latestEntry,
  };
}
