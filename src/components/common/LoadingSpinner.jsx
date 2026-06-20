import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', color = 'text-primary-600', fullScreen = false }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <motion.div
      className={`${sizes[size]} border-2 border-current border-t-transparent rounded-full ${color}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-surface-500 text-sm font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
};

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-50">
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="w-12 h-12 border-3 border-primary-200 border-t-primary-600 rounded-full"
        style={{ borderWidth: 3 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-surface-400 text-sm font-medium">Loading Adapt...</p>
    </div>
  </div>
);

export default LoadingSpinner;
