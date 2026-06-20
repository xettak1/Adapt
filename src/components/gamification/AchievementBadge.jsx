import { motion } from 'framer-motion';
import Tooltip from '../common/Tooltip';

const rarityStyles = {
  common: 'bg-surface-100 border-surface-200',
  rare: 'bg-blue-50 border-blue-200',
  epic: 'bg-purple-50 border-purple-200 shadow-glow-xp',
  legendary: 'bg-amber-50 border-amber-200 shadow-md',
};

const AchievementBadge = ({ achievement, size = 'md', unlocked = true, animate = false }) => {
  const sizes = { sm: 'w-10 h-10 text-xl', md: 'w-12 h-12 text-2xl', lg: 'w-16 h-16 text-3xl' };
  const rarity = rarityStyles[achievement.rarity] || rarityStyles.common;

  return (
    <Tooltip content={`${achievement.title}: ${achievement.description}`}>
      <motion.div
        className={`${sizes[size]} rounded-2xl border-2 flex items-center justify-center cursor-default select-none
          ${unlocked ? rarity : 'bg-surface-100 border-surface-200 opacity-40 grayscale'}`}
        whileHover={animate && unlocked ? { scale: 1.1, rotate: 5 } : {}}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <span>{achievement.icon}</span>
      </motion.div>
    </Tooltip>
  );
};

export default AchievementBadge;
