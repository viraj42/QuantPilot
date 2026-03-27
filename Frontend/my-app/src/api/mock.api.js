import { apiRequest } from "./apiClient";

/**
 * Fetch available companies for mock tests
 */
export const getCompanies = () => 
  apiRequest("/mock/companies", "GET", null, true);

/**
 * Generate a new mock attempt for a specific company
 */
export const generateMock = (companyId) => 
  apiRequest("/mock/generate", "POST", { companyId }, true);

/**
 * Fetch user's previous mock attempts
 */
export const getMockHistory = () => 
  apiRequest("/mock/history", "GET", null, true);

/**
 * Initialize/Resume the mock and get the synchronized timer
 */
export const startMock = (id) => 
  apiRequest(`/mock/${id}/start`, "GET", null, true);

/**
 * Submit the final answers
 */
export const submitMock = (id, answers) => 
  apiRequest(`/mock/${id}/submit`, "POST", { answers }, true);

export const getMockResult = (id) => 
  apiRequest(`/mock/${id}/result`, "GET", null, true);