import { delay } from '../utils';
import { mockStudents } from '../data/mockUsers';
import { mockModules, mockAchievements, mockLeaderboard } from '../data/mockModules';
import { USE_MOCK } from '../config/api';
import api from './axiosInstance';
import { adaptStudent, adaptModule } from './adapters';

// ----------------------------- MOCK -----------------------------
const mock = {
  getDashboard: async (studentId) => {
    await delay(800);
    const student = mockStudents.find((s) => s.id === studentId) || mockStudents[0];
    return {
      student,
      currentModule: mockModules.find(
        (m) => m.id === student.moduleProgress.find((mp) => mp.status === 'in_progress')?.id
      ),
      recentAchievements: mockAchievements.filter((a) => student.achievements.includes(a.id)).slice(0, 3),
      leaderboard: mockLeaderboard,
      weeklyChallengeDone: true,
    };
  },
  getModuleProgress: async (studentId) => {
    await delay(600);
    const student = mockStudents.find((s) => s.id === studentId) || mockStudents[0];
    return mockModules.map((mod) => {
      const progress = student.moduleProgress.find((mp) => mp.id === mod.id);
      return { ...mod, ...(progress || {}) };
    });
  },
  getAchievements: async (studentId) => {
    await delay(400);
    const student = mockStudents.find((s) => s.id === studentId) || mockStudents[0];
    return mockAchievements.map((a) => ({ ...a, unlocked: student.achievements.includes(a.id) }));
  },
  getLeaderboard: async () => {
    await delay(500);
    return mockLeaderboard;
  },
};

// ----------------------------- REAL -----------------------------
const real = {
  getDashboard: async () => {
    const res = await api.get('/students/me/dashboard');
    return {
      student: adaptStudent(res.student),
      currentModule: adaptModule(res.currentModule),
      recentAchievements: res.recentAchievements || [],
      leaderboard: res.leaderboard || [],
      weeklyChallengeDone: res.weeklyChallengeDone ?? true,
    };
  },
  getModuleProgress: async () => (await api.get('/students/me/progress')).map(adaptModule),
  getAchievements: async () => api.get('/students/me/achievements'),
  getLeaderboard: async () => api.get('/students/leaderboard'),
};

const studentService = {
  getDashboard: (studentId) => (USE_MOCK ? mock.getDashboard(studentId) : real.getDashboard()),
  getModuleProgress: (studentId) => (USE_MOCK ? mock.getModuleProgress(studentId) : real.getModuleProgress()),
  getAchievements: (studentId) => (USE_MOCK ? mock.getAchievements(studentId) : real.getAchievements()),
  getLeaderboard: () => (USE_MOCK ? mock.getLeaderboard() : real.getLeaderboard()),

  // Instructor-side helpers remain mock-backed (students cannot query peers).
  getStudentById: async (id) => {
    await delay(600);
    return mockStudents.find((s) => s.id === id) || mockStudents[0];
  },
  getAllStudents: async () => {
    await delay(700);
    return mockStudents;
  },
};

export default studentService;
