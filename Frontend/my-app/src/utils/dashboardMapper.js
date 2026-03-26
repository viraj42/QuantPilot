export const mapDashboardData = (data) => {
  if (!data || typeof data !== "object") {
    return {
      metrics: { accuracy: 0, solved: 0, readiness: 0, streak: 0, rank: null },
      lastActivity: "No recent activity",
      sections: [],
      weeklyAttempts: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  return {
    metrics: {
      accuracy: Number(data?.metrics?.accuracy ?? 0),
      solved: Number(data?.metrics?.solved ?? 0),
      readiness: Number(data?.metrics?.readiness ?? 0),
      streak: Number(data?.metrics?.streak ?? 0),
      rank: data?.metrics?.rank ?? null
    },
    lastActivity: data?.lastActivity ?? "Today",
    sections: Array.isArray(data?.sections)
      ? data.sections.map((sec) => ({
          id: sec?.id ?? Math.random(),
          title: sec?.title ?? "Unknown Topic",
          status: sec?.status ?? "Not Started",
          easy: Number(sec?.easy ?? 0),
          med: Number(sec?.med ?? 0),
          hard: Number(sec?.hard ?? 0),
          overall: Number(sec?.overall ?? 0),
          attempts: Number(sec?.attempts ?? 0),
        }))
      : [],
    weeklyAttempts: Array.isArray(data?.weeklyAttempts) && data.weeklyAttempts.length === 7
        ? data.weeklyAttempts.map((n) => Number(n ?? 0))
        : [0, 0, 0, 0, 0, 0, 0],
  };
};