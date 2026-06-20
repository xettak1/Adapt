import { motion } from 'framer-motion';
import { Trophy, Flame } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatXP } from '../../utils';
import { staggerContainer, staggerItem } from '../../animations/variants';

const rankColors = ['text-amber-500', 'text-surface-400', 'text-amber-700'];
const rankBg = ['bg-amber-50', 'bg-surface-50', 'bg-amber-50/50'];

const LeaderboardCard = ({ data = [], currentUserId }) => (
  <div className="card p-5">
    <div className="flex items-center gap-2 mb-4">
      <Trophy size={18} className="text-amber-500" />
      <h3 className="section-title">Leaderboard</h3>
    </div>
    <motion.ul variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
      {data.map((entry, i) => (
        <motion.li
          key={entry.rank}
          variants={staggerItem}
          className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
            entry.name === currentUserId ? 'bg-primary-50 border border-primary-100' : 'hover:bg-surface-50'
          }`}
        >
          <span className={`w-6 text-center font-black text-lg ${rankColors[i] || 'text-surface-400'}`}>
            {i < 3 ? ['🥇', '🥈', '🥉'][i] : entry.rank}
          </span>
          <Avatar name={entry.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-800 truncate">{entry.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-purple-600">{formatXP(entry.xp)} XP</span>
              <span className="text-surface-300">·</span>
              <span className="text-xs text-surface-400 flex items-center gap-0.5">
                <Flame size={10} className="text-orange-400" />{entry.streak}d
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-surface-400">Lv.{entry.level}</span>
        </motion.li>
      ))}
    </motion.ul>
  </div>
);

export default LeaderboardCard;
