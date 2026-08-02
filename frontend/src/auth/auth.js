

// Creates an object to store tokens entered into localStorage. 
export const AUTH_KEYS = {
  access: 'access',
  refresh: 'refresh',
};

// Sets/updates the access and refresh tokens in localStorage.
export function setAuthTokens(tokens) {
  if (tokens?.access) {
    localStorage.setItem(AUTH_KEYS.access, tokens.access);
  }
  if (tokens?.refresh) {
    localStorage.setItem(AUTH_KEYS.refresh, tokens.refresh);
  }
}

// Removes the access and refresh tokens from localStorage: to log the user out.
export function clearAuthTokens() {
  localStorage.removeItem(AUTH_KEYS.access);
  localStorage.removeItem(AUTH_KEYS.refresh);
}

//Checks if user is logged in.
export function isAuthenticated() {
  return Boolean(localStorage.getItem(AUTH_KEYS.access));
}

// Returns access token for efficient calls.
export function getAccessToken() {
  return localStorage.getItem(AUTH_KEYS.access);
}
