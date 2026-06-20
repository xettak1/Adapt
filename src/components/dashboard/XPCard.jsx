import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import ProgressRing from '../common/ProgressRing';
import { getXPProgressInLevel, getLevelFromXP, formatXP } from '../../utils';

const XPCard = ({ xp = 0 }) => {
  const level = getLevelFromXP(xp);
  const { progress, current, needed } = getXPProgressInLevel(xp);

  return (
    <motion.div
      className="card p-5 bg-gradient-to-br from-purple-50 to-white border-purple-100"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="label-text text-purple-400 mb-1">Total XP</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-purple-700">{formatXP(xp)}</span>
            <span className="text-sm font-bold text-purple-400">XP</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={12} className="text-success-500" />
            <span className="text-xs text-surface-400">{current} / {needed} to next level</span>
          </div>
        </div>
        <ProgressRing value={progress} size={64} strokeWidth={5} color="#a855f7" bg="#f3e8ff">
          <span className="text-xs font-black text-purple-700">L{level}</span>
        </ProgressRing>
      </div>
      <div className="mt-3 progress-bar">
        <motion.div
          className="progress-fill bg-gradient-to-r from-purple-400 to-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

export default XPCard;
