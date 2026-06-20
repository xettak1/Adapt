import { motion } from 'framer-motion';

/* A premium slider control with label + value readout */
export const LabSlider = ({ label, value, min, max, step = 1, unit = '', onChange, highlight = false, format }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={`p-3 rounded-2xl transition-all ${highlight ? 'bg-moss-50 ring-2 ring-moss-300' : 'bg-surface-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-bold text-moss-700 font-mono">{format ? format(value) : `${value}${unit}`}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-moss-600 cursor-pointer"
        />
      </div>
    </div>
  );
};

/* A rotary knob control */
export const LabKnob = ({ label, value, min, max, unit = '', onChange, highlight = false }) => {
  const pct = (value - min) / (max - min);
  const angle = -135 + pct * 270;

  const handleWheel = (e) => {
    const delta = e.deltaY < 0 ? 1 : -1;
    const step = (max - min) / 50;
    onChange(Math.min(max, Math.max(min, value + delta * step)));
  };

  return (
    <div className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${highlight ? 'bg-moss-50 ring-2 ring-moss-300' : ''}`}>
      <motion.div
        className="lab-knob w-16 h-16"
        onWheel={handleWheel}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute w-1 h-5 bg-moss-700 rounded-full top-1.5"
          style={{ rotate: angle, originY: '170%' }}
          animate={{ rotate: angle }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      </motion.div>
      <span className="text-xs font-semibold text-surface-500 text-center">{label}</span>
      <span className="text-xs font-bold text-moss-700 font-mono">{value.toFixed(unit === 'Hz' ? 0 : 1)}{unit}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={(max - min) / 100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 accent-moss-600 cursor-pointer"
      />
    </div>
  );
};

/* Power toggle button */
export const PowerButton = ({ on, onClick }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.92 }}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${
      on ? 'bg-success-500 text-white shadow-glow-success' : 'bg-surface-200 text-surface-500'
    }`}
  >
    <motion.span
      className={`w-2.5 h-2.5 rounded-full ${on ? 'bg-white' : 'bg-surface-400'}`}
      animate={on ? { opacity: [1, 0.4, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    {on ? 'POWER ON' : 'POWER OFF'}
  </motion.button>
);
