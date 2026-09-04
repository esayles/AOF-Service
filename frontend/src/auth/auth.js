//Change at some point 
import { API_URL } from "../API";

// Creates an object to store tokens entered into localStorage. 
export const AUTH_KEYS = {
  access: 'access',
  refresh: 'refresh',
  role: 'role',
};

// Sets/updates the access and refresh tokens in localStorage.
export function setAuthTokens(tokens, user = {}) {
  if (tokens?.access) {
    localStorage.setItem(AUTH_KEYS.access, tokens.access);
  }
  if (tokens?.refresh) {
    localStorage.setItem(AUTH_KEYS.refresh, tokens.refresh);
  }
  if (user?.role) {
    localStorage.setItem(AUTH_KEYS.role, user.role);
  } else {
    localStorage.removeItem(AUTH_KEYS.role);
  }
}

// Removes the access and refresh tokens from localStorage: to log the user out.
export function clearAuthTokens() {
  localStorage.removeItem(AUTH_KEYS.access);
  localStorage.removeItem(AUTH_KEYS.refresh);
  localStorage.removeItem(AUTH_KEYS.role);
}

//Checks if user is logged in.
export function isAuthenticated() {
  return Boolean(localStorage.getItem(AUTH_KEYS.access));
}

// Return the stored refresh token.
export function getRefreshToken() {
  return localStorage.getItem(AUTH_KEYS.refresh);
}


// Attempt to exchange the refresh token for a new access token.
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  // If there is no refresh token, the user cannot refresh their session.
  if (!refreshToken) {
    clearAuthTokens();
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    // Refresh token is expired or invalid.
    if (!response.ok) {
      clearAuthTokens();
      return false;
    }

    const data = await response.json();

    // Save the new access token.
    if (data.access) {
      localStorage.setItem(AUTH_KEYS.access, data.access);
      return true;
    }

    clearAuthTokens();
    return false;
  } catch (error) {
    console.error("Unable to refresh access token:", error);
    return false;
  }
}

// Retrieves the user's role from localStorage, defaulting to 'student' if not set.
export function getUserRole() {
  return localStorage.getItem(AUTH_KEYS.role) || 'student';
}

// Checks if the user has a faculty or admin role.
export function isFacultyOrAdmin() {
  return getUserRole() === 'faculty' || getUserRole() === 'admin';
}

export function isAdmin() {
  return getUserRole() === 'admin';
}

// This is a UI convenience only; Django enforces the role for every faculty
// endpoint as well.
export function canAccessFacultyApproval() {
  return isFacultyOrAdmin();
}

// Returns access token for efficient calls.
export function getAccessToken() {
  return localStorage.getItem(AUTH_KEYS.access);
}

//Temp for testing
window.testRefresh = refreshAccessToken;