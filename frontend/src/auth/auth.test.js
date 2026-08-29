import { clearAuthTokens, getUserRole, isAdmin, isAuthenticated, setAuthTokens } from './auth';

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

  test('stores the role returned by the authenticated user', () => {
    setAuthTokens({ access: 'access-token' }, { role: 'faculty' });
    expect(getUserRole()).toBe('faculty');

    setAuthTokens({ access: 'new-access-token' });
    expect(getUserRole()).toBe('student');
  });

  test('identifies application administrators', () => {
    setAuthTokens({ access: 'access-token' }, { role: 'admin' });
    expect(isAdmin()).toBe(true);
  });
});
