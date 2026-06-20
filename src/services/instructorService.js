import { delay } from '../utils';
import { mockStudents } from '../data/mockUsers';
import { mockHeatmapData, mockModules } from '../data/mockModules';
import { mockInstructorStats, mockPerformanceTrends, mockModuleCompletion, mockRecentActivity, mockWorkbenchAnalytics } from '../data/mockInstructor';
import { USE_MOCK } from '../config/api';
import api from './axiosInstance';
import { adaptStudentDetail } from './adapters';

// ----------------------------- MOCK -----------------------------
const mock = {
  getDashboard: async () => {
    await delay(800);
    return {
      stats: mockInstructorStats,
      performanceTrends: mockPerformanceTrends,
      moduleCompletion: mockModuleCompletion,
      recentActivity: mockRecentActivity,
      workbenchAnalytics: mockWorkbenchAnalytics,
    };
  },
  getHeatmapData: async () => {
    await delay(700);
    return { modules: mockModules.map((m) => m.title), data: mockHeatmapData };
  },
  getStudentDetail: async (studentId) => {
    await delay(700);
    return mockStudents.find((s) => s.id === studentId) || mockStudents[0];
  },
  saveInstructorNote: async (studentId, note) => {
    await delay(500);
    return { success: true, studentId, note, savedAt: new Date().toISOString() };
  },
};

// ----------------------------- REAL -----------------------------
const real = {
  getDashboard: () => api.get('/instructor/dashboard'),
  getHeatmapData: () => api.get('/instructor/heatmap'),
  getStudentDetail: (studentId) => api.get(`/instructor/students/${studentId}`).then(adaptStudentDetail),
  saveInstructorNote: (studentId, note) => api.post(`/instructor/students/${studentId}/notes`, { note }),
};

const instructorService = {
  getDashboard: () => (USE_MOCK ? mock.getDashboard() : real.getDashboard()),
  getHeatmapData: () => (USE_MOCK ? mock.getHeatmapData() : real.getHeatmapData()),
  getStudentDetail: (studentId) => (USE_MOCK ? mock.getStudentDetail(studentId) : real.getStudentDetail(studentId)),
  saveInstructorNote: (studentId, note) =>
    USE_MOCK ? mock.saveInstructorNote(studentId, note) : real.saveInstructorNote(studentId, note),
  getAllStudents: async () => {
    await delay(600);
    return mockStudents;
  },
};

export default instructorService;
