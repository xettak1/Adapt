import { delay } from '../utils';
import { mockChallenge } from '../data/mockChallenge';
import { USE_MOCK } from '../config/api';
import api from './axiosInstance';
import { adaptChallenge } from './adapters';

// ----------------------------- MOCK -----------------------------
const mockGetTodaysChallenge = async () => {
  await delay(900);
  return mockChallenge;
};

const mockSubmit = async (challengeId, answers) => {
  await delay(1500);
  const challenge = mockChallenge;
  let totalPoints = 0;
  let earnedPoints = 0;
  const feedback = [];

  for (const task of challenge.tasks) {
    totalPoints += task.points;
    const answer = answers[task.id];

    if (task.type === 'mcq') {
      const correct = answer === task.correctAnswer;
      if (correct) earnedPoints += task.points;
      feedback.push({ taskId: task.id, correct, explanation: task.explanation, pointsEarned: correct ? task.points : 0 });
    } else if (task.type === 'mcq_multi') {
      const correct =
        Array.isArray(answer) &&
        answer.length === task.correctAnswers.length &&
        task.correctAnswers.every((ca) => answer.includes(ca));
      if (correct) earnedPoints += task.points;
      feedback.push({ taskId: task.id, correct, explanation: task.explanation, pointsEarned: correct ? task.points : 0 });
    } else if (task.type === 'arrange') {
      const correct =
        Array.isArray(answer) &&
        answer.length === task.correctOrder.length &&
        task.correctOrder.every((id, i) => answer[i] === id);
      if (correct) earnedPoints += task.points;
      else {
        const partialCorrect = Array.isArray(answer)
          ? answer.filter((id, i) => task.correctOrder[i] === id).length
          : 0;
        const partial = Math.floor((partialCorrect / task.correctOrder.length) * task.points * 0.5);
        earnedPoints += partial;
        feedback.push({ taskId: task.id, correct, partial: true, explanation: task.explanation, pointsEarned: partial });
        continue;
      }
      feedback.push({ taskId: task.id, correct, explanation: task.explanation, pointsEarned: correct ? task.points : 0 });
    }
  }

  const scorePercent = Math.round((earnedPoints / totalPoints) * 100);
  const xpEarned = Math.round((earnedPoints / totalPoints) * challenge.xpReward);
  const passed = scorePercent >= 70;
  const masteryDelta = passed ? Math.round(scorePercent * 0.15) : -Math.round((100 - scorePercent) * 0.05);

  return {
    challengeId,
    score: scorePercent,
    xpEarned,
    passed,
    masteryDelta: Math.max(-5, masteryDelta),
    feedback,
    newMastery: Math.min(100, Math.max(0, 68 + masteryDelta)),
    totalPoints,
    earnedPoints,
  };
};

// ----------------------------- REAL -----------------------------
const challengeService = {
  getTodaysChallenge: () =>
    USE_MOCK ? mockGetTodaysChallenge() : api.get('/challenges/today').then(adaptChallenge),

  submitChallenge: (challengeId, answers, timeSpentSeconds = 0) =>
    USE_MOCK
      ? mockSubmit(challengeId, answers)
      : api.post(`/challenges/${challengeId}/submit`, { answers, timeSpentSeconds }),
};

export default challengeService;
