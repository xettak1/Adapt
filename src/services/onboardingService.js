import { delay } from '../utils';
import { USE_MOCK } from '../config/api';
import api from './axiosInstance';

const onboardingService = {
  // Placement assessment bank (backend-driven). The OnboardingPage currently
  // runs the adaptive diagnostic from local data; this is available for a
  // fully backend-driven flow.
  getAssessment: async () => {
    if (USE_MOCK) {
      await delay(300);
      return [];
    }
    return api.get('/onboarding/assessment');
  },

  // Persist the onboarding outcome. Returns the server-assigned track/placement.
  submit: async ({ experience, goals, diagnosticScore }) => {
    if (USE_MOCK) {
      await delay(400);
      return { experience, goals, diagnosticScore };
    }
    return api.post('/onboarding', { experience, goals, diagnosticScore });
  },
};

export default onboardingService;
