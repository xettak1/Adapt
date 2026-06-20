import { XP_THRESHOLDS, MASTERY_LEVELS } from '../constants';

export const getLevelFromXP = (xp) => {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

export const getXPProgressInLevel = (xp) => {
  const level = getLevelFromXP(xp);
  const levelStart = XP_THRESHOLDS[level - 1] || 0;
  const levelEnd = XP_THRESHOLDS[level] || XP_THRESHOLDS[level - 1] + 1000;
  const progress = ((xp - levelStart) / (levelEnd - levelStart)) * 100;
  return { progress: Math.min(Math.max(progress, 0), 100), current: xp - levelStart, needed: levelEnd - levelStart };
};

export const getMasteryLevel = (score) => {
  return Object.values(MASTERY_LEVELS).find((l) => score >= l.min && score < l.max) || MASTERY_LEVELS.MASTER;
};

export const formatXP = (xp) => {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
};

export const getHeatmapColor = (score) => {
  if (score === null || score === undefined) return '#e2e8f0';
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#f43f5e';
};

export const getHeatmapTextColor = (score) => {
  if (score === null || score === undefined) return '#94a3b8';
  if (score >= 75) return '#065f46';
  if (score >= 50) return '#78350f';
  return '#881337';
};

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const cn = (...classes) => classes.filter(Boolean).join(' ');
