import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const icons = {
  success: <CheckCircle size={16} className="text-success-500" />,
  error: <AlertCircle size={16} className="text-danger-500" />,
  info: <Info size={16} className="text-primary-500" />,
};

const ToastItem = ({ id, type = 'info', message, title }) => {
  const removeNotification = useAppStore((s) => s.removeNotification);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-start gap-3 bg-white border border-surface-100 rounded-2xl px-4 py-3 shadow-glass-lg max-w-sm w-full"
    >
      <span className="mt-0.5 flex-shrink-0">{icons[type]}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-surface-800">{title}</p>}
        <p className="text-sm text-surface-500">{message}</p>
      </div>
      <button onClick={() => removeNotification(id)} className="text-surface-300 hover:text-surface-500 transition-colors flex-shrink-0">
        <X size={14} />
      </button>
    </motion.div>
  );
};

const ToastContainer = () => {
  const notifications = useAppStore((s) => s.notifications);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <ToastItem key={n.id} {...n} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
