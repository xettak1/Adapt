import { motion } from 'framer-motion';
import { CheckCircle, XCircle, TrendingUp, TrendingDown, Lightbulb, Zap } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../animations/variants';

const FeedbackPanel = ({ result, challenge }) => {
  if (!result) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      {/* Score Banner */}
      <motion.div
        variants={staggerItem}
        className={`p-5 rounded-2xl text-center ${result.passed ? 'bg-gradient-to-r from-success-50 to-emerald-50 border border-success-200' : 'bg-gradient-to-r from-danger-50 to-rose-50 border border-danger-200'}`}
      >
        <div className="text-4xl mb-2">{result.passed ? '🎉' : '💪'}</div>
        <div className={`text-3xl font-black mb-1 ${result.passed ? 'text-success-700' : 'text-danger-600'}`}>
          {result.score}%
        </div>
        <p className={`text-sm font-semibold ${result.passed ? 'text-success-600' : 'text-danger-500'}`}>
          {result.passed ? 'Challenge Passed!' : 'Keep Practicing!'}
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="flex items-center gap-1 text-sm font-bold text-purple-600">
            <Zap size={14} className="fill-current" />
            +{result.xpEarned} XP
          </span>
          <span className={`flex items-center gap-1 text-sm font-bold ${result.masteryDelta >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
            {result.masteryDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            Mastery {result.masteryDelta >= 0 ? '+' : ''}{result.masteryDelta}%
          </span>
        </div>
      </motion.div>

      {/* Per-task Feedback */}
      <motion.div variants={staggerItem}>
        <h3 className="section-title mb-3">Detailed Feedback</h3>
        <div className="space-y-3">
          {result.feedback.map((fb, i) => {
            const task = challenge.tasks.find((t) => t.id === fb.taskId);
            return (
              <motion.div
                key={fb.taskId}
                variants={staggerItem}
                className={`p-4 rounded-2xl border ${fb.correct ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}
              >
                <div className="flex items-start gap-3">
                  {fb.correct
                    ? <CheckCircle size={18} className="text-success-500 flex-shrink-0 mt-0.5" />
                    : <XCircle size={18} className="text-danger-500 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-bold text-surface-500 mb-1">Task {i + 1} · {fb.pointsEarned}/{task?.points} pts</p>
                    <div className="flex items-start gap-2">
                      <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-surface-700 leading-relaxed">{fb.explanation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recommendations */}
      {!result.passed && (
        <motion.div variants={staggerItem} className="card p-4">
          <h4 className="text-sm font-bold text-surface-800 mb-2">Improvement Recommendations</h4>
          <ul className="space-y-2">
            {['Review the mini lecture above and re-read key points', 'Try the challenge again after 30 minutes', 'Visit Module Progress to see related topics'].map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-surface-600">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {rec}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FeedbackPanel;
