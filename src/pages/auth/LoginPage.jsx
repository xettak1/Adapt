import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, BookOpen, Zap, ArrowRight, Wifi, Radio, Activity } from 'lucide-react';
import authService from '../../services/authService';
import useAppStore from '../../store/useAppStore';
import { ROLES } from '../../constants';
import { slideUp, staggerContainer, staggerItem } from '../../animations/variants';

const RFIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-mesh opacity-60" />

    {/* Animated RF rings */}
    {[1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="absolute rounded-full border-2 border-primary-300/30"
        style={{ width: 80 + i * 80, height: 80 + i * 80 }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
      />
    ))}

    {/* Center antenna icon */}
    <motion.div
      className="relative z-10 w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-glow"
      animate={{ y: [-4, 4, -4] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Radio size={48} className="text-white" />
    </motion.div>

    {/* Floating stat cards */}
    {[
      { icon: <Zap size={14} className="text-purple-600" />, label: 'XP System', value: 'Adaptive', pos: 'top-16 left-8', delay: 0 },
      { icon: <Activity size={14} className="text-emerald-600" />, label: 'Labs', value: '12 Modules', pos: 'bottom-20 right-8', delay: 0.5 },
      { icon: <Wifi size={14} className="text-blue-600" />, label: 'RF Coverage', value: '5 Tracks', pos: 'top-24 right-6', delay: 1 },
    ].map((card) => (
      <motion.div
        key={card.label}
        className={`absolute ${card.pos} glass rounded-2xl px-3 py-2 shadow-glass`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: card.delay, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          {card.icon}
          <span className="text-xs font-semibold text-surface-800">{card.value}</span>
        </div>
        <p className="text-xs text-surface-400">{card.label}</p>
      </motion.div>
    ))}
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const addNotification = useAppStore((s) => s.addNotification);

  const [role, setRole] = useState(ROLES.STUDENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoCredentials = {
    student: { email: 'student@knust.edu.gh', password: 'student123' },
    instructor: { email: 'instructor@knust.edu.gh', password: 'instructor123' },
  };

  const fillDemo = () => {
    const cred = demoCredentials[role];
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    try {
      const { user, token } = await authService.login(email, password, role);
      login(user, token);
      addNotification({ type: 'success', title: `Welcome back, ${user.name.split(' ')[0]}!`, message: 'Ready to learn?' });
      if (role === ROLES.INSTRUCTOR) {
        navigate('/instructor/dashboard');
      } else {
        // Prefer the backend flag (real mode); fall back to persisted store (mock mode).
        const onboarded = typeof user.hasOnboarded === 'boolean' ? user.hasOnboarded : hasOnboarded;
        navigate(onboarded ? '/student/learn' : '/onboarding');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 relative overflow-hidden">
        <div className="absolute inset-0 hero-pattern opacity-30" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Brand */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="brand-text text-4xl text-white mb-1">Adapt</h1>
            <p className="text-primary-200 text-sm font-medium">RF Engineering Laboratory Platform</p>
          </motion.div>

          {/* Illustration */}
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <RFIllustration />
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: 'Active Students', value: '200+' },
              { label: 'Lab Modules', value: '5' },
              { label: 'Avg. Mastery Gain', value: '+34%' },
            ].map((stat) => (
              <motion.div key={stat.label} variants={staggerItem} className="glass-dark rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-primary-200 mt-1 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-primary-200 text-sm italic mt-6 text-center"
          >
            "The RF laboratory is where theory meets reality — master it here, own it anywhere."
          </motion.p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          className="w-full max-w-md"
          variants={slideUp}
          initial="initial"
          animate="animate"
        >
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="brand-text text-4xl text-primary-600 mb-1">Adapt</h1>
            <p className="text-surface-400 text-sm">RF Engineering Lab Platform</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h2>
            <p className="text-surface-400 text-sm">Sign in to continue your learning journey</p>
          </div>

          {/* Role tabs */}
          <div className="flex gap-2 p-1 bg-surface-100 rounded-xl mb-6">
            {[
              { role: ROLES.STUDENT, label: 'Student', icon: <BookOpen size={15} /> },
              { role: ROLES.INSTRUCTOR, label: 'Instructor', icon: <GraduationCap size={15} /> },
            ].map((tab) => (
              <motion.button
                key={tab.role}
                onClick={() => { setRole(tab.role); setError(''); setEmail(''); setPassword(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  role === tab.role ? 'bg-white text-primary-700 shadow-card' : 'text-surface-500 hover:text-surface-700'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {tab.icon} {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder={`your.email@knust.edu.gh`}
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="input-field pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 text-sm text-danger-600 font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          {/* Demo credential hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-primary-50 border border-primary-100 rounded-2xl"
          >
            <p className="text-xs font-semibold text-primary-700 mb-2">🚀 Demo Credentials</p>
            <div className="text-xs text-primary-600 space-y-1 font-mono">
              <p>{demoCredentials[role].email}</p>
              <p>{demoCredentials[role].password}</p>
            </div>
            <button
              onClick={fillDemo}
              className="mt-2 text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1"
            >
              Fill automatically <ArrowRight size={11} />
            </button>
          </motion.div>

          <p className="text-center text-xs text-surface-400 mt-6">
            KNUST · Electrical & Electronic Engineering Department
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
