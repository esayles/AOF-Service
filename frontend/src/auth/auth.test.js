import { clearAuthTokens, isAuthenticated, setAuthTokens } from './auth';

describe('auth helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('tracks authentication state from stored tokens', () => {
    expect(isAuthenticated()).toBe(false);

    setAuthTokens({ access: 'access-token', refresh: 'refresh-token' });
    expect(isAuthenticated()).toBe(true);

    clearAuthTokens();
    expect(isAuthenticated()).toBe(false);
  });
});
