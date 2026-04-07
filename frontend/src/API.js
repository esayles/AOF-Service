const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const getServiceLogs = async () => {
  const response = await fetch(`${API_URL}/api/service-logs/`);
  return response.json();
};

export const createServiceLog = async (logData) => {
  const response = await fetch(`${API_URL}/api/service-logs/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(logData),
  });
  return response.json();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("access");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

