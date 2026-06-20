import { Star } from 'lucide-react';

const levelColors = [
  '', 'from-slate-400 to-slate-600', 'from-emerald-400 to-teal-500',
  'from-blue-400 to-primary-600', 'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-500', 'from-pink-400 to-rose-500',
  'from-yellow-400 to-amber-500', 'from-cyan-400 to-sky-500',
  'from-fuchsia-400 to-pink-600', 'from-red-500 to-rose-600',
];

const LevelBadge = ({ level = 1, size = 'md', showLabel = false, className = '' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  };
  const gradient = levelColors[Math.min(level, levelColors.length - 1)];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes[size]} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white shadow-md flex-shrink-0`}>
        {level}
      </div>
      {showLabel && <span className="text-sm font-semibold text-surface-600">Level {level}</span>}
    </div>
  );
};

export default LevelBadge;
