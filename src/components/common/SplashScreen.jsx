import { motion } from 'framer-motion';

const LETTERS = ['A', 'd', 'a', 'p', 't'];

const SplashScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Soft ambient glow */}
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(94,141,78,0.10) 40%, transparent 70%)' }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.2, 1], opacity: [0, 0.9, 0.6] }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />

      {/* Pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-primary-200"
          style={{ width: 160, height: 160 }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 2.4], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
        />
      ))}

      {/* Logo mark */}
      <motion.div
        className="relative z-10 mb-6"
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.2 }}
      >
        <motion.div
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-moss-600 flex items-center justify-center shadow-glow"
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* RF waveform mark */}
          <motion.svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <motion.path
              d="M4 22 Q10 6 16 22 T28 22 T40 22"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeInOut' }}
            />
          </motion.svg>
        </motion.div>
      </motion.div>

      {/* Letter reveal */}
      <div className="relative z-10 flex items-center">
        {LETTERS.map((letter, i) => (
          <motion.span
            key={i}
            className="brand-text text-5xl text-surface-900"
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, delay: 0.7 + i * 0.08, ease: 'easeOut' }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Tagline */}
      <motion.p
        className="relative z-10 mt-3 text-sm text-surface-400 font-medium tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        RF Engineering, Mastered.
      </motion.p>

      {/* Loading shimmer bar */}
      <motion.div
        className="relative z-10 mt-8 w-32 h-1 rounded-full bg-surface-100 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-moss-600"
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 1.4, delay: 1.6, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
