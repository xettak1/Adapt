import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const StreakCounter = ({ streak = 0, size = 'md', showLabel = true, className = '' }) => {
  const sizes = {
    sm: { text: 'text-sm', icon: 14, gap: 'gap-1', px: 'px-2.5 py-1' },
    md: { text: 'text-base', icon: 16, gap: 'gap-1.5', px: 'px-3 py-1.5' },
    lg: { text: 'text-lg', icon: 20, gap: 'gap-2', px: 'px-4 py-2' },
  };
  const s = sizes[size];
  const hot = streak >= 7;

  return (
    <motion.div
      className={`inline-flex items-center ${s.gap} ${s.px} rounded-full font-bold ${hot ? 'bg-orange-100 text-orange-600' : 'bg-surface-100 text-surface-500'} ${className}`}
      animate={hot ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Flame size={s.icon} className={hot ? 'text-orange-500' : 'text-surface-400'} />
      <span className={s.text}>{streak}</span>
      {showLabel && <span className={`${s.text} font-medium opacity-70`}>day streak</span>}
    </motion.div>
  );
};

export default StreakCounter;
