import { getAccessToken } from './auth/auth';

// Strip any trailing slash so `${API_URL}/api/...` never produces a double
// slash (a double slash triggers a 308 redirect that drops CORS headers).
export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export const getServiceLogs = async () => {
  const response = await fetch(`${API_URL}/api/service-logs/`, {
    headers: getAuthHeaders(),
  });
  return readResponse(response, 'Unable to load service logs.');
};
// Fetches the list of faculty members from the backend API. This function is used to populate the dropdown in the service log form, allowing students to select a teacher for verification.
export const getMyServiceLogs = async () => {
  const response = await fetch(`${API_URL}/api/service-logs/mine/`, {
    headers: getAuthHeaders(),
  });
  return readResponse(response, 'Unable to load your service logs.');
};

export const getFaculty = async () => {
  const response = await fetch(`${API_URL}/api/faculty/`, {
    headers: getAuthHeaders(),
  });
  return readResponse(response, 'Unable to load faculty members.');
};

export const getStudents = async () => {
  const response = await fetch(`${API_URL}/api/students/`, {
    headers: getAuthHeaders(),
  });
  return readResponse(response, 'Unable to load students.');
};

export const createServiceLog = async (logData) => {
  const response = await fetch(`${API_URL}/api/service-logs/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(logData),
  });
  return readResponse(response, 'Unable to submit service hours.');
};

export const updateServiceLog = async (id, logData) => {
  const response = await fetch(`${API_URL}/api/service-logs/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(logData),
  });
  return readResponse(response, 'Unable to update this service log.');
};

// Declining retains the submission in the student's history with a declined status.
export const declineServiceLog = async (id) => {
  const response = await fetch(`${API_URL}/api/service-logs/${id}/decline/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return readResponse(response, 'Unable to decline this submission.');
};

export const getAdminUsers = async () => {
  const response = await fetch(`${API_URL}/api/admin/users/`, {
    headers: getAuthHeaders(),
  });
  return readResponse(response, 'Unable to load users.');
};

export const importAdminUsers = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/admin/users/import/`, {
    method: 'POST',
    headers: getUploadAuthHeaders(),
    body: formData,
  });
  return readResponse(response, 'Unable to import users.');
};

export const updateAdminUserRole = async (id, role) => {
  const response = await fetch(`${API_URL}/api/admin/users/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });
  return readResponse(response, 'Unable to update this user role.');
};

export const deleteAdminUser = async (id) => {
  const response = await fetch(`${API_URL}/api/admin/users/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (response.status === 204) {
    return;
  }
  return readResponse(response, 'Unable to remove this user.');
};

export const getAdminPreferences = async () => {
  const response = await fetch(`${API_URL}/api/admin/preferences/`, {
    headers: getAuthHeaders(),
  });

  return readResponse(response, 'Unable to load admin preferences.');
};
//allows for future additions to the admin testing panel 
export const updateAdminPreferences = async (preferences) => {
  const response = await fetch(`${API_URL}/api/admin/preferences/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(preferences),
  });

  return readResponse(response, 'Unable to update admin preferences.');
};

// Approves a service log by sending a POST request to the backend API. This function is used in the faculty approval page to approve student submissions.
export const approveServiceLog = async (id) => {
  const response = await fetch(`${API_URL}/api/service-logs/${id}/confirm/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  return readResponse(response, 'Unable to approve this submission.');
};

const getAuthHeaders = () => {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Returns authentication headers for file upload requests.
const getUploadAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function readResponse(response, fallbackMessage) {
  const body = await response.text();

  let data;
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    // The backend sent something that is not JSON — nearly always an HTML
    // error page from an unhandled exception. Report the status instead of
    // letting a raw "JSON.parse: unexpected character" reach the user, which
    // hides the fact that the server is the thing that broke.
    throw new Error(
      `${fallbackMessage} The server returned ${response.status} ${response.statusText}` +
      ' instead of data — check the backend logs.'
    );
  }

  if (response.ok) {
    return data;
  }

  const detail = data.detail || Object.values(data).flat().join(' ');
  throw new Error(detail || fallbackMessage);
}
