import { cn } from '../../utils';

const variants = {
  default: 'bg-surface-100 text-surface-600',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
  danger: 'bg-danger-100 text-danger-600',
  xp: 'bg-purple-100 text-purple-700',
  streak: 'bg-orange-100 text-orange-700',
  ghost: 'border border-surface-200 text-surface-500',
};

const sizes = {
  xs: 'text-xs px-2 py-0.5',
  sm: 'text-xs px-2.5 py-1',
  md: 'text-sm px-3 py-1',
};

const Badge = ({ children, variant = 'default', size = 'sm', className = '', dot = false, dotColor = '' }) => (
  <span className={cn('inline-flex items-center gap-1.5 rounded-full font-semibold', variants[variant], sizes[size], className)}>
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColor || 'bg-current')} />}
    {children}
  </span>
);

export default Badge;
