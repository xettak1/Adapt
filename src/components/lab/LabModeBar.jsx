import { motion } from 'framer-motion';
import { GraduationCap, Compass, Target } from 'lucide-react';

const modes = [
  { id: 'teach', label: 'Teach Me', icon: <GraduationCap size={15} />, desc: 'Guided walkthrough' },
  { id: 'explore', label: 'Free Explore', icon: <Compass size={15} />, desc: 'No restrictions' },
  { id: 'challenge', label: 'Challenge', icon: <Target size={15} />, desc: 'Complete a task' },
];

const LabModeBar = ({ mode, onChange }) => (
  <div className="flex gap-2 p-1 bg-surface-100 rounded-2xl">
    {modes.map((m) => (
      <button
        key={m.id}
        onClick={() => onChange(m.id)}
        className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-sm font-semibold transition-colors ${
          mode === m.id ? 'text-moss-700' : 'text-surface-500 hover:text-surface-700'
        }`}
      >
        {mode === m.id && (
          <motion.div
            layoutId="labModeActive"
            className="absolute inset-0 bg-white rounded-xl shadow-card"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">{m.icon}{m.label}</span>
        <span className="relative z-10 text-xs font-normal text-surface-400 hidden sm:block">{m.desc}</span>
      </button>
    ))}
  </div>
);

export default LabModeBar;
