export const APP_NAME = 'Adapt';
export const APP_TAGLINE = 'Master RF Engineering, One Lab at a Time';

export const ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
};

export const ROUTES = {
  LOGIN: '/login',
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_CHALLENGE: '/student/challenge',
  STUDENT_PROGRESS: '/student/progress',
  INSTRUCTOR_DASHBOARD: '/instructor/dashboard',
  INSTRUCTOR_HEATMAP: '/instructor/heatmap',
  INSTRUCTOR_STUDENT: '/instructor/student/:id',
};

export const MODULE_STATUS = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
};

export const DIFFICULTY = {
  BEGINNER: { label: 'Beginner', color: 'text-success-600 bg-success-50', dot: 'bg-success-500' },
  INTERMEDIATE: { label: 'Intermediate', color: 'text-warning-600 bg-warning-50', dot: 'bg-warning-500' },
  ADVANCED: { label: 'Advanced', color: 'text-danger-600 bg-danger-50', dot: 'bg-danger-500' },
};

export const MASTERY_LEVELS = {
  NOVICE: { min: 0, max: 25, label: 'Novice', color: '#94a3b8' },
  DEVELOPING: { min: 25, max: 50, label: 'Developing', color: '#f59e0b' },
  PROFICIENT: { min: 50, max: 75, label: 'Proficient', color: '#3b82f6' },
  ADVANCED: { min: 75, max: 90, label: 'Advanced', color: '#8b5cf6' },
  MASTER: { min: 90, max: 100, label: 'Master', color: '#10b981' },
};

export const XP_THRESHOLDS = [0, 500, 1200, 2500, 4500, 7500, 12000, 18000, 26000, 36000];

export const ACHIEVEMENT_TYPES = {
  STREAK: 'streak',
  XP: 'xp',
  MASTERY: 'mastery',
  SPEED: 'speed',
  PERFECT: 'perfect',
};

export const HEATMAP_COLORS = {
  strong: '#10b981',
  average: '#f59e0b',
  weak: '#f43f5e',
  none: '#e2e8f0',
};
