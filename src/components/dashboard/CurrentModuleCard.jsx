import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const CurrentModuleCard = ({ module, studentProgress }) => {
  if (!module) return null;
  const progress = studentProgress?.find((mp) => mp.id === module.id);
  const mastery = progress?.mastery || 0;

  return (
    <motion.div
      className="card p-5 bg-gradient-to-br from-primary-50 to-white border-primary-100"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
          {module.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="label-text text-primary-400 mb-0.5">Current Module</p>
          <h3 className="font-bold text-surface-800 mb-2 truncate">{module.title}</h3>
          <div className="progress-bar mb-1.5">
            <motion.div
              className="progress-fill bg-gradient-to-r from-primary-400 to-primary-600"
              initial={{ width: 0 }}
              animate={{ width: `${mastery}%` }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-400">{mastery}% mastery</span>
            <span className="text-xs text-surface-400">{progress?.completedChallenges || 0}/{module.totalChallenges} tasks</span>
          </div>
        </div>
      </div>
      <Link
        to="/student/challenge"
        className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
      >
        Continue Learning <ArrowRight size={15} />
      </Link>
    </motion.div>
  );
};

export default CurrentModuleCard;
