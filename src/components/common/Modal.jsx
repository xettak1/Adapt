import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalVariants, overlayVariants } from '../../animations/variants';

const Modal = ({ isOpen, onClose, title, children, size = 'md', showClose = true }) => {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', full: 'max-w-4xl' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full ${sizes[size]} bg-white rounded-3xl shadow-glass-xl overflow-hidden`}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100">
                {title && <h3 className="text-lg font-semibold text-surface-800">{title}</h3>}
                {showClose && (
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors ml-auto">
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
