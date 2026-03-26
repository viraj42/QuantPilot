import { apiRequest } from "./apiClient";

/* ---------- Dashboard ---------- */

export const getSession = () =>
  apiRequest("/session/home", "GET", null, true);

export const getRecentTopics = () =>
  apiRequest("/analytics/recent-topics", "GET", null, true);

export const getWeakTopics = () =>
  apiRequest("/analytics/weak-topics", "GET", null, true);

export const getSectionTopics = (sectionId) =>
  apiRequest(`/session/section/${sectionId}`, "GET", null, true);

export const getLevelRoadmap = (topicId) =>
  apiRequest(`/session/levels/${topicId}`, "GET", null, true);


/* ---------- Practice Session ---------- */

export const startPracticeSession = (topicId, level) =>
  apiRequest(
    "/session/start",
    "POST",
    { topicId, level },
    true
  );


/* ---------- Submit Session ---------- */

export const submitPracticeSession = (topicId, level, answers) =>
  apiRequest(
    "/session/submit",
    "POST",
    { topicId, level, answers },
    true
  );


/* ---------- Review Session ---------- */

export const getPracticeReview = (sessionId) =>
  apiRequest(
    `/review/${sessionId}/review`,
    "GET",
    null,
    true
  );