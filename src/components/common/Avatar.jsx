const COLORS = [
  'from-blue-400 to-primary-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
];

const Avatar = ({ name = '', src = null, size = 'md', className = '' }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg', xl: 'w-16 h-16 text-2xl' };
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const colorIndex = name.charCodeAt(0) % COLORS.length;

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ${className}`} />;
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${COLORS[colorIndex]} flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
};

export default Avatar;
