const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiRequest = async (
  url,
  method = "GET",
  body = null,
  isAuth = false
) => {
  const headers = {
    "Content-Type": "application/json",
    ...(isAuth ? getAuthHeader() : {}),
  };

  const response = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
};