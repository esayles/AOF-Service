// Generate a summary of student service logs, including total hours, pending count, recent entries, and the latest entry.

export function getStudentSummary(serviceLogs = []) {
  const normalizedLogs = Array.isArray(serviceLogs) ? serviceLogs : [];

  const filteredLogs = normalizedLogs.filter((log) => {
    const hasStudentRef = Boolean(log.student || log.student_id || log.student_name || log.student_username || log.student_email);
    if (!hasStudentRef) {
      return true;
    }
    return true;
  });
  // Calculate total hours, count of pending approvals, and identify the latest entry based on the date performed.
  const totalHours = filteredLogs
    .filter((log) => !log.declined_by)
    .reduce((sum, log) => sum + Number(log.hours || 0), 0);
  const pendingCount = filteredLogs.filter((log) => {
    const confirmedBy = log.confirmed_by ?? log.approved_by;
    return !confirmedBy && !log.declined_by;
  }).length;
  const recentEntries = [...filteredLogs]
    .sort((a, b) => new Date(b.date_performed || 0) - new Date(a.date_performed || 0))
    .slice(0, 2);
  const latestEntry = recentEntries[0] || null;
  // Return the summary object containing total hours, pending count, recent entries, and the latest entry.
  return {
    totalHours: Number(totalHours.toFixed(2)),
    pendingCount,
    recentEntries,
    latestEntry,
  };
}
