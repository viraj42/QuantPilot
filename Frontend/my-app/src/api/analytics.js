import { apiRequest } from "./apiClient";

export const getProfileOverview = () =>
  apiRequest("/analytics/profile", "GET", null, true);

export const getDashboardOverview = () =>
  apiRequest("/analytics/dashboard", "GET", null, true);

export const getRecentTopics = () =>
  apiRequest("/analytics/recent-topics", "GET", null, true);

export const getWeakTopics = () =>
  apiRequest("/analytics/weak-topics", "GET", null, true);