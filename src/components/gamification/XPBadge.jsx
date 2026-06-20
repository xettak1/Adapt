import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatXP } from '../../utils';

const XPBadge = ({ xp, size = 'md', animate = false, className = '' }) => {
  const sizes = {
    xs: 'text-xs px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };
  const iconSizes = { xs: 10, sm: 12, md: 14, lg: 16 };

  return (
    <motion.span
      className={`inline-flex items-center rounded-full font-bold bg-purple-100 text-purple-700 ${sizes[size]} ${className}`}
      whileHover={animate ? { scale: 1.05 } : {}}
    >
      <Zap size={iconSizes[size]} className="fill-current" />
      {formatXP(xp)} XP
    </motion.span>
  );
};

export default XPBadge;
