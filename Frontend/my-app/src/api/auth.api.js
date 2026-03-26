import { apiRequest } from "./apiClient";

export const loginUser = (data) =>
  apiRequest("/auth/login", "POST", data);

export const registerUser = (data) =>
  apiRequest("/auth/register", "POST", data);

export const logoutUser = () =>
  apiRequest("/auth/logout", "POST", null, true);
