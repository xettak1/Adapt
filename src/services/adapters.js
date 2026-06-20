// Adapters: convert backend DTOs into the exact shapes the existing
// components/pages already expect. This keeps the UI untouched whether
// it runs on mock data or the live backend.

const colorLightFor = (color = '') => {
  // Derive a soft background/text token from the module gradient string.
  const match = color.match(/(emerald|teal|blue|primary|violet|purple|amber|orange|rose|pink|moss)/);
  const base = match ? match[1] : 'surface';
  return { colorLight: `bg-${base}-50`, colorText: `text-${base}-700` };
};

/** Backend ModuleProgressDto -> rich module shape used across the app. */
export const adaptModule = (m) => {
  if (!m) return null;
  const { colorLight, colorText } = colorLightFor(m.color);
  return {
    id: m.moduleId,
    code: m.code,
    name: m.name,
    title: m.name,
    description: m.description,
    icon: m.icon,
    color: m.color,
    colorLight,
    colorText,
    position: m.position,
    mastery: m.mastery ?? 0,
    xp: m.xpEarned ?? 0,
    xpEarned: m.xpEarned ?? 0,
    status: m.status,
    completedChallenges: m.completedChallenges ?? 0,
    totalChallenges: m.totalChallenges ?? 0,
    masteryRequired: m.masteryRequired ?? 80,
    estimatedHours: m.estimatedHours ?? 8,
    topics: m.topics || [],
    prerequisites: [], // backend omits; safe default for UI guards
    completedAt: m.status === 'completed' ? '' : null,
  };
};

/** Backend StudentDto -> frontend `student` shape. */
export const adaptStudent = (s) => {
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    xp: s.xp ?? 0,
    level: s.level ?? 1,
    streak: s.currentStreak ?? 0,
    longestStreak: s.longestStreak ?? 0,
    overallMastery: s.overallMastery ?? 0,
    totalDaysActive: s.totalDaysActive ?? 0,
    currentTrack: s.currentTrack,
    currentModule: s.currentModule,
    hasOnboarded: s.hasOnboarded,
    achievements: s.achievements || [],
    moduleProgress: (s.moduleProgress || []).map(adaptModule),
  };
};

/** Backend auth UserDto (+ optional profile stats) -> frontend user. */
export const adaptUser = (u, profile = null) => {
  if (!u) return null;
  const base = {
    id: u.id,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    title: u.title,
    department: u.department,
    hasOnboarded: u.hasOnboarded,
  };
  if (profile) {
    base.xp = profile.xp;
    base.level = profile.level;
    base.streak = profile.streak;
    base.overallMastery = profile.overallMastery;
    base.currentTrack = profile.currentTrack;
    base.currentModule = profile.currentModule;
    base.hasOnboarded = profile.hasOnboarded ?? u.hasOnboarded;
    base.moduleProgress = profile.moduleProgress;
  }
  return base;
};

/** Backend ChallengeDto -> frontend challenge (adds safe empty answer keys). */
export const adaptChallenge = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    moduleName: c.moduleName,
    difficulty: c.difficulty,
    xpReward: c.xpReward,
    estimatedDuration: c.estimatedDuration,
    scenario: c.scenario,
    miniLecture: c.miniLecture,
    history: c.history,
    funFact: c.funFact,
    tasks: (c.tasks || []).map((t) => ({
      id: t.id,
      type: t.type,
      question: t.question,
      points: t.points,
      options: t.options || [],
      blocks: t.blocks || [],
      // Correct answers are intentionally NOT sent by the backend; provide
      // empty defaults so submitted-state UI guards never throw.
      correctAnswer: undefined,
      correctAnswers: [],
      correctOrder: [],
    })),
  };
};

/** Backend StudentDetailDto -> frontend student-detail shape. */
export const adaptStudentDetail = (s) => {
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    xp: s.xp ?? 0,
    level: s.level ?? 1,
    streak: s.currentStreak ?? 0,
    overallMastery: s.overallMastery ?? 0,
    totalDaysActive: s.totalDaysActive ?? 0,
    currentTrack: s.currentTrack,
    joinDate: s.joinDate || '—',
    performanceHistory: s.performanceHistory || [],
    moduleProgress: (s.moduleProgress || []).map(adaptModule),
    weakSkills: s.weakSkills || [],
    errorHistory: [],
    achievements: s.achievements || [],
    instructorNotes: s.instructorNotes || '',
  };
};
