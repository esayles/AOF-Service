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
