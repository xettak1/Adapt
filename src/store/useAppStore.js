import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

const useAppStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      xp: 0,
      level: 1,
      streak: 0,
      overallMastery: 0,

      // Onboarding
      hasOnboarded: false,
      onboarding: {
        experience: null,
        goals: [],
        track: null,
        startingModule: null,
        diagnosticScore: null,
      },

      // Virtual Lab
      labAchievements: [],

      // Workbench analytics (instrument usage, experiment completion, errors)
      workbench: {
        instrumentOpens: {},
        experimentsCompleted: [],
        errors: 0,
        interactions: 0,
        lastInstrument: null,
      },

      notifications: [],
      isLoading: false,

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          xp: user.xp || 0,
          level: user.level || 1,
          streak: user.streak || 0,
          overallMastery: user.overallMastery || 0,
          // Honor the backend's onboarding flag when present (real mode).
          // In mock mode `hasOnboarded` is absent, so the persisted value stands.
          ...(typeof user.hasOnboarded === 'boolean' ? { hasOnboarded: user.hasOnboarded } : {}),
        });
      },

      logout: async () => {
        await authService.logout();
        set({
          user: null, token: null, isAuthenticated: false, xp: 0, level: 1, streak: 0,
          hasOnboarded: false,
          onboarding: { experience: null, goals: [], track: null, startingModule: null, diagnosticScore: null },
          labAchievements: [],
        });
      },

      completeOnboarding: (result) => {
        set({ hasOnboarded: true, onboarding: { ...result } });
      },

      unlockLabAchievement: (achievementId) => {
        set((state) =>
          state.labAchievements.includes(achievementId)
            ? state
            : { labAchievements: [...state.labAchievements, achievementId] }
        );
      },

      addXP: (amount) => {
        const current = get().xp;
        const newXP = current + amount;
        set({ xp: newXP });
        return newXP;
      },

      updateMastery: (newMastery) => set({ overallMastery: newMastery }),

      // --- Workbench analytics ---
      recordInstrumentOpen: (instrumentId) =>
        set((state) => ({
          workbench: {
            ...state.workbench,
            lastInstrument: instrumentId,
            instrumentOpens: {
              ...state.workbench.instrumentOpens,
              [instrumentId]: (state.workbench.instrumentOpens[instrumentId] || 0) + 1,
            },
          },
        })),
      recordExperimentComplete: (experimentId) =>
        set((state) => ({
          workbench: {
            ...state.workbench,
            experimentsCompleted: state.workbench.experimentsCompleted.includes(experimentId)
              ? state.workbench.experimentsCompleted
              : [...state.workbench.experimentsCompleted, experimentId],
          },
        })),
      recordWorkbenchInteraction: () =>
        set((state) => ({ workbench: { ...state.workbench, interactions: state.workbench.interactions + 1 } })),
      recordWorkbenchError: () =>
        set((state) => ({ workbench: { ...state.workbench, errors: state.workbench.errors + 1 } })),

      addNotification: (notification) => {
        const id = Date.now().toString();
        set((state) => ({ notifications: [...state.notifications, { ...notification, id }] }));
        setTimeout(() => get().removeNotification(id), notification.duration || 4000);
      },

      removeNotification: (id) => {
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'adapt-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        hasOnboarded: state.hasOnboarded,
        onboarding: state.onboarding,
        labAchievements: state.labAchievements,
      }),
    }
  )
);

export default useAppStore;
