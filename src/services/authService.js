import { delay } from '../utils';
import { mockStudents, mockInstructor } from '../data/mockUsers';
import { USE_MOCK, TOKEN_KEY, REFRESH_KEY, USER_KEY } from '../config/api';
import api from './axiosInstance';
import { adaptUser, adaptStudent } from './adapters';

const persistSession = (user, accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};

// ----------------------------- MOCK -----------------------------
const mockLogin = async (email, password, role) => {
  await delay(1200);
  const demoCredentials = {
    student: { email: 'student@knust.edu.gh', password: 'student123' },
    instructor: { email: 'instructor@knust.edu.gh', password: 'instructor123' },
  };
  const expected = demoCredentials[role];
  if (!expected || email !== expected.email || password !== expected.password) {
    throw new Error('Invalid email or password. Try the demo credentials shown below.');
  }
  const user = role === 'student' ? mockStudents[0] : mockInstructor;
  const token = `mock-jwt-${role}-${Date.now()}`;
  persistSession(user, token, null);
  return { user, token };
};

// ----------------------------- REAL -----------------------------
const realLogin = async (email, password, role) => {
  const res = await api.post('/auth/login', { email, password, role, rememberMe: true });
  // Students: enrich the user object with gamification stats so the store
  // and layouts have xp/level/streak immediately after login.
  let profile = null;
  if (res.user?.role === 'student') {
    try {
      profile = adaptStudent(await api.get('/students/me'));
    } catch {
      profile = null;
    }
  }
  const user = adaptUser(res.user, profile);
  persistSession(user, res.accessToken, res.refreshToken);
  return { user, token: res.accessToken };
};

const authService = {
  login: (email, password, role) =>
    USE_MOCK ? mockLogin(email, password, role) : realLogin(email, password, role),

  register: async ({ firstName, lastName, email, password }) => {
    if (USE_MOCK) {
      await delay(1000);
      const user = { ...mockStudents[0], name: `${firstName} ${lastName}`, email, hasOnboarded: false };
      persistSession(user, `mock-jwt-student-${Date.now()}`, null);
      return { user, token: localStorage.getItem(TOKEN_KEY) };
    }
    const res = await api.post('/auth/register', { firstName, lastName, email, password });
    const user = adaptUser(res.user);
    persistSession(user, res.accessToken, res.refreshToken);
    return { user, token: res.accessToken };
  },

  logout: async () => {
    if (!USE_MOCK) {
      try {
        await api.post('/auth/logout');
      } catch {
        /* ignore network errors on logout */
      }
    } else {
      await delay(300);
    }
    clearSession();
  },

  forgotPassword: async (email) => {
    if (USE_MOCK) {
      await delay(800);
      return { success: true };
    }
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token, newPassword) => {
    if (USE_MOCK) {
      await delay(800);
      return { success: true };
    }
    return api.post('/auth/reset-password', { token, newPassword });
  },

  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

export default authService;
