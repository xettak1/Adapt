import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Zap, BookOpen, LogOut, Menu, X, Sparkles, Cpu } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import Avatar from '../components/common/Avatar';
import LevelBadge from '../components/gamification/LevelBadge';
import { formatXP } from '../utils';

const navItems = [
  { to: '/student/learn', icon: <Sparkles size={18} />, label: "Today's Session" },
  { to: '/student/workbench', icon: <Cpu size={18} />, label: 'Workbench' },
  { to: '/student/challenge', icon: <Zap size={18} />, label: 'Daily Challenge' },
  { to: '/student/progress', icon: <BookOpen size={18} />, label: 'Progress' },
  { to: '/student/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
];

const NavLink = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const active = location.pathname === to || (to === '/student/workbench' && location.pathname.startsWith('/student/workbench'));
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
        active
          ? 'bg-primary-600 text-white shadow-glow'
          : 'text-surface-500 hover:text-surface-800 hover:bg-surface-100'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
};

const StudentLayout = ({ children }) => {
  const user = useAppStore((s) => s.user);
  const xp = useAppStore((s) => s.xp);
  const level = useAppStore((s) => s.level);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-surface-100 fixed left-0 top-0 h-full z-30">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 border-b border-surface-100">
          <Link to="/student/dashboard">
            <h1 className="brand-text text-3xl text-primary-600">Adapt</h1>
            <p className="text-xs text-surface-400 font-medium mt-0.5">RF Lab Learning</p>
          </Link>
        </div>

        {/* User profile */}
        <div className="px-4 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name || 'Student'} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-surface-800 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <LevelBadge level={level} size="xs" />
                <span className="text-xs text-purple-600 font-bold">{formatXP(xp)} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all duration-150"
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-surface-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/student/dashboard">
            <h1 className="brand-text text-2xl text-primary-600">Adapt</h1>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-purple-100">
              <Zap size={12} className="text-purple-600 fill-current" />
              <span className="text-xs font-bold text-purple-700">{formatXP(xp)}</span>
            </div>
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-surface-100 text-surface-600">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-surface-900/40 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 h-full w-64 bg-white z-50 md:hidden shadow-glass-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-100">
                <h1 className="brand-text text-2xl text-primary-600">Adapt</h1>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400">
                  <X size={18} />
                </button>
              </div>
              <div className="px-4 py-4 border-b border-surface-100">
                <div className="flex items-center gap-3">
                  <Avatar name={user?.name || 'Student'} size="md" />
                  <div>
                    <p className="text-sm font-bold text-surface-800">{user?.name}</p>
                    <span className="text-xs font-bold text-purple-600">{formatXP(xp)} XP · Level {level}</span>
                  </div>
                </div>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />
                ))}
              </nav>
              <div className="px-3 pb-6 border-t border-surface-100 pt-3">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all">
                  <LogOut size={18} /> Log Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;
