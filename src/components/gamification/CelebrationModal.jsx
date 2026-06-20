import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, TrendingUp, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { modalVariants, overlayVariants } from '../../animations/variants';

const fireConfetti = () => {
  const fire = (particleRatio, opts) => {
    confetti({ origin: { y: 0.7 }, ...opts, particleCount: Math.floor(200 * particleRatio) });
  };
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};

const CelebrationModal = ({ isOpen, onClose, result }) => {
  useEffect(() => {
    if (isOpen && result?.passed) {
      const timer = setTimeout(fireConfetti, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, result?.passed]);

  if (!result) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-glass-xl"
          >
            <div className={`p-8 text-center ${result.passed ? 'bg-gradient-to-b from-success-50 to-white' : 'bg-gradient-to-b from-danger-50 to-white'}`}>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                className="text-7xl mb-4"
              >
                {result.passed ? '🎉' : '💪'}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-2xl font-black mb-1 ${result.passed ? 'text-success-700' : 'text-surface-800'}`}
              >
                {result.passed ? 'Excellent Work!' : 'Keep Going!'}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-surface-500 text-sm mb-6"
              >
                {result.passed ? "You've demonstrated strong understanding!" : "Review the feedback and try again."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-3 mb-6"
              >
                <div className="bg-white rounded-2xl p-3 shadow-card text-center">
                  <div className={`text-2xl font-black ${result.score >= 70 ? 'text-success-600' : 'text-danger-500'}`}>{result.score}%</div>
                  <div className="text-xs text-surface-400 font-medium mt-0.5">Score</div>
                </div>
                <div className="bg-white rounded-2xl p-3 shadow-card text-center">
                  <div className="text-2xl font-black text-purple-600">+{result.xpEarned}</div>
                  <div className="text-xs text-surface-400 font-medium mt-0.5">XP Earned</div>
                </div>
                <div className="bg-white rounded-2xl p-3 shadow-card text-center">
                  <div className={`text-2xl font-black ${result.masteryDelta >= 0 ? 'text-primary-600' : 'text-danger-500'}`}>
                    {result.masteryDelta >= 0 ? '+' : ''}{result.masteryDelta}%
                  </div>
                  <div className="text-xs text-surface-400 font-medium mt-0.5">Mastery</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3"
              >
                <button onClick={onClose} className="flex-1 btn-secondary text-sm">
                  Review Answers
                </button>
                <button onClick={onClose} className="flex-1 btn-primary text-sm flex items-center justify-center gap-1.5">
                  Continue <ArrowRight size={14} />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationModal;
