import { motion } from 'framer-motion';
import { Flame, Calendar } from 'lucide-react';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const StreakCard = ({ streak = 0, weekHistory = [] }) => {
  const today = new Date().getDay();

  return (
    <motion.div
      className="card p-5 bg-gradient-to-br from-orange-50 to-white border-orange-100"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="label-text text-orange-400 mb-1">Daily Streak</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-orange-600">{streak}</span>
            <span className="text-sm font-bold text-orange-400">days</span>
          </div>
        </div>
        <motion.div
          className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center"
          animate={streak >= 7 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame size={24} className="text-orange-500" />
        </motion.div>
      </div>

      <div className="flex gap-1.5 justify-between">
        {DAY_LABELS.map((label, i) => {
          const completed = weekHistory[i];
          const isToday = i === today;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                  completed
                    ? 'bg-orange-400 text-white shadow-sm'
                    : isToday
                    ? 'border-2 border-orange-300 text-orange-400'
                    : 'bg-surface-100 text-surface-300'
                }`}
                initial={completed ? { scale: 0.8 } : {}}
                animate={completed ? { scale: 1 } : {}}
                transition={{ delay: i * 0.05 }}
              >
                {completed ? '🔥' : label}
              </motion.div>
              <span className="text-xs text-surface-300 font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default StreakCard;
