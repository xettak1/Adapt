import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import ProgressRing from '../common/ProgressRing';
import { getMasteryLevel } from '../../utils';

const MasteryCard = ({ mastery = 0 }) => {
  const level = getMasteryLevel(mastery);
  const colors = { Novice: '#94a3b8', Developing: '#f59e0b', Proficient: '#3b82f6', Advanced: '#8b5cf6', Master: '#10b981' };
  const color = colors[level.label] || '#3b82f6';

  return (
    <motion.div
      className="card p-5"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="label-text mb-1">Overall Mastery</p>
          <div className="text-3xl font-black text-surface-800 mb-1">{mastery}<span className="text-lg text-surface-400">%</span></div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color, backgroundColor: `${color}18` }}>
            {level.label}
          </span>
        </div>
        <ProgressRing value={mastery} size={70} strokeWidth={5} color={color} bg="#e2e8f0">
          <Brain size={20} style={{ color }} />
        </ProgressRing>
      </div>
    </motion.div>
  );
};

export default MasteryCard;
