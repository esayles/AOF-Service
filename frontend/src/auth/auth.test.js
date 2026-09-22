import { clearAuthTokens, getUserId, getUserRole, isAdmin, isAuthenticated, isFacultyAdmin, isFacultyOrAdmin, setAuthTokens, setUserRole } from './auth';

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
    setAuthTokens({ access: 'access-token' }, { id: 42, role: 'faculty' });
    expect(getUserRole()).toBe('faculty');
    expect(getUserId()).toBe('42');

    setAuthTokens({ access: 'new-access-token' });
    expect(getUserRole()).toBe('student');
  });

  test('updates the stored role after an administrator changes roles', () => {
    setAuthTokens({ access: 'access-token' }, { id: 42, role: 'faculty_admin' });
    setUserRole('student_admin');
    expect(getUserRole()).toBe('student_admin');
    expect(getUserId()).toBe('42');
  });

  test('identifies application administrators', () => {
    setAuthTokens({ access: 'access-token' }, { role: 'student_admin' });
    expect(isAdmin()).toBe(true);

    setAuthTokens({ access: 'access-token' }, { role: 'faculty_admin' });
    expect(isAdmin()).toBe(true);
  });

  test('gives faculty approval access only to faculty-like roles', () => {
    setAuthTokens({ access: 'access-token' }, { role: 'student_admin' });
    expect(isFacultyOrAdmin()).toBe(false);

    setAuthTokens({ access: 'access-token' }, { role: 'faculty_admin' });
    expect(isFacultyOrAdmin()).toBe(true);
  });

  test('identifies faculty admins for role-specific navigation', () => {
    setAuthTokens({ access: 'access-token' }, { role: 'faculty_admin' });
    expect(isFacultyAdmin()).toBe(true);

    setAuthTokens({ access: 'access-token' }, { role: 'student_admin' });
    expect(isFacultyAdmin()).toBe(false);
  });
});
