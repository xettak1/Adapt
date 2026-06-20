export const mockInstructorStats = {
  totalStudents: 5,
  activeStudents: 4,
  averageMastery: 68.8,
  completionRate: 62,
  weeklyActive: [3, 4, 4, 5, 4, 3, 4],
  challengesCompleted: 47,
};

export const mockPerformanceTrends = [
  { week: 'Week 1', avgScore: 54, completed: 8 },
  { week: 'Week 2', avgScore: 61, completed: 12 },
  { week: 'Week 3', avgScore: 65, completed: 15 },
  { week: 'Week 4', avgScore: 68, completed: 18 },
  { week: 'Week 5', avgScore: 70, completed: 22 },
  { week: 'Week 6', avgScore: 74, completed: 28 },
  { week: 'Week 7', avgScore: 72, completed: 31 },
  { week: 'Week 8', avgScore: 78, completed: 36 },
];

export const mockModuleCompletion = [
  { module: 'Instrument Basics', completion: 80, avgMastery: 83 },
  { module: 'Signal Behavior', completion: 40, avgMastery: 71 },
  { module: 'Triggering', completion: 20, avgMastery: 55 },
  { module: 'RF Measurement', completion: 10, avgMastery: 62 },
  { module: 'Advanced Diag.', completion: 0, avgMastery: 0 },
];

export const mockWorkbenchAnalytics = {
  totalSessions: 128,
  experimentsCompleted: 86,
  avgInteractions: 34,
  errorRate: 12,
  instrumentUsage: [
    { name: 'Oscilloscope', uses: 142 },
    { name: 'RF Generator', uses: 118 },
    { name: 'Multimeter', uses: 64 },
    { name: 'Spectrum', uses: 73 },
    { name: 'VNA', uses: 41 },
    { name: 'Logic', uses: 22 },
  ],
};

export const mockRecentActivity = [
  { id: 1, student: 'Ama Boateng', action: 'Completed Module 3', time: '10 min ago', type: 'module', xp: 980 },
  { id: 2, student: 'Kwame Asante', action: 'Achieved 12-day streak', time: '1 hour ago', type: 'achievement', xp: 0 },
  { id: 3, student: 'Yaw Darko', action: 'Scored 94% on RF Challenge #12', time: '2 hours ago', type: 'challenge', xp: 150 },
  { id: 4, student: 'Abena Osei', action: 'Started Triggering Module', time: '3 hours ago', type: 'module', xp: 0 },
  { id: 5, student: 'Ama Boateng', action: 'Perfect score on S-Parameter Task', time: '5 hours ago', type: 'perfect', xp: 200 },
  { id: 6, student: 'Kofi Mensah', action: 'Completed Daily Challenge', time: '6 hours ago', type: 'challenge', xp: 100 },
  { id: 7, student: 'Yaw Darko', action: 'Unlocked RF Measurement Module', time: '1 day ago', type: 'unlock', xp: 0 },
];
