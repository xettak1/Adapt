import { delay } from '../utils';
import { labInstruments } from '../data/mockLab';
import { USE_MOCK } from '../config/api';
import api from './axiosInstance';

const simulationService = {
  getInstruments: async () => {
    if (USE_MOCK) {
      await delay(300);
      return labInstruments;
    }
    return api.get('/simulations/instruments');
  },

  startSession: async (instrumentCode, mode) => {
    if (USE_MOCK) return { id: `mock-${Date.now()}`, instrumentCode, mode };
    return api.post('/simulations/sessions', { instrumentCode, mode });
  },

  // Best-effort: record a completed lab challenge (start + complete a CHALLENGE
  // session and unlock its achievement on the backend). Never blocks the UI.
  recordChallenge: async (instrumentCode, achievementCode, score = 100, interactions = 1) => {
    if (USE_MOCK) return { ok: true };
    try {
      const session = await api.post('/simulations/sessions', { instrumentCode, mode: 'challenge' });
      return await api.post('/simulations/sessions/complete', {
        sessionId: session.id,
        score,
        interactions,
        achievementCode,
      });
    } catch {
      return { ok: false };
    }
  },
};

export default simulationService;
