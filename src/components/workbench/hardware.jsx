import { useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

/* ============================================================
   Rotary KNOB — drag vertically (or scroll) to turn. Pointer
   indicator sweeps -135°..+135° with a ring of tick marks.
   ============================================================ */
export const Knob = ({
  label, value, min, max, step = (max - min) / 100, onChange,
  size = 64, unit = '', format, color = '#4CAF50', sublabel,
}) => {
  const dragging = useRef(false);
  const start = useRef({ y: 0, v: 0 });
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -135 + pct * 270;

  const clamp = (v) => Math.min(max, Math.max(min, v));
  const quantize = (v) => {
    const snapped = Math.round((v - min) / step) * step + min;
    return clamp(parseFloat(snapped.toFixed(6)));
  };

  const onMove = useCallback((e) => {
    if (!dragging.current) return;
    const dy = start.current.y - e.clientY;
    const range = max - min;
    const next = quantize(start.current.v + (dy / 160) * range);
    onChange(next);
  }, [max, min, onChange, step]);

  const onUp = useCallback(() => {
    dragging.current = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    document.body.style.cursor = '';
  }, [onMove]);

  const onDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    start.current = { y: e.clientY, v: value };
    document.body.style.cursor = 'ns-resize';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  useEffect(() => () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); }, [onMove, onUp]);

  const ticks = 21;
  const r = size / 2;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        className="relative touch-none"
        style={{ width: size, height: size }}
        onPointerDown={onDown}
        onWheel={(e) => onChange(quantize(value + (e.deltaY < 0 ? step : -step) * 4))}
        title="Drag up/down or scroll to adjust"
      >
        {/* tick ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-0">
          {Array.from({ length: ticks }).map((_, i) => {
            const a = (-135 + (i / (ticks - 1)) * 270) * (Math.PI / 180);
            const on = i / (ticks - 1) <= pct;
            const x1 = r + Math.sin(a) * (r - 2);
            const y1 = r - Math.cos(a) * (r - 2);
            const x2 = r + Math.sin(a) * (r - 7);
            const y2 = r - Math.cos(a) * (r - 7);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? color : '#3a4046'} strokeWidth="2" strokeLinecap="round" />;
          })}
        </svg>
        {/* knob body */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 9,
            background: 'radial-gradient(circle at 35% 30%, #4b525a, #23272c 70%, #15181b)',
            boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.6), 0 3px 8px rgba(0,0,0,0.5)',
            cursor: 'ns-resize',
          }}
        >
          {/* pointer */}
          <motion.div
            className="absolute left-1/2 top-1.5 -translate-x-1/2 rounded-full"
            style={{ width: 3, height: size * 0.22, background: color, boxShadow: `0 0 6px ${color}`, transformOrigin: `50% ${size / 2 - 6}px` }}
            animate={{ rotate: angle }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
      </div>
      <div className="text-center leading-tight">
        <p className="text-[10px] font-bold uppercase tracking-wide text-surface-300">{label}</p>
        <p className="text-[11px] font-mono font-semibold" style={{ color }}>
          {format ? format(value) : `${value}${unit}`}
        </p>
        {sublabel && <p className="text-[9px] text-surface-500">{sublabel}</p>}
      </div>
    </div>
  );
};

/* ============================================================
   Segmented LED numeric display (7-seg feel with ghost digits).
   ============================================================ */
export const SegmentDisplay = ({ value, unit = '', color = '#4CAF50', size = 'md', ghost = '88888' }) => {
  const sizes = { sm: 'text-xl', md: 'text-3xl', lg: 'text-5xl' };
  return (
    <div className="relative inline-flex items-baseline rounded-lg px-3 py-1.5 bg-[#0a0d0a] border border-black/60"
      style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)' }}>
      <span className={`absolute left-3 ${sizes[size]} font-mono font-bold tabular-nums select-none`} style={{ color: '#16241a', letterSpacing: '0.05em' }}>{ghost}</span>
      <span className={`relative ${sizes[size]} font-mono font-bold tabular-nums`} style={{ color, textShadow: `0 0 10px ${color}99`, letterSpacing: '0.05em' }}>{value}</span>
      {unit && <span className="relative ml-1.5 text-xs font-mono" style={{ color: `${color}cc` }}>{unit}</span>}
    </div>
  );
};

/* ============================================================
   Status LED.
   ============================================================ */
export const Led = ({ on, color = '#4CAF50', label }) => (
  <span className="inline-flex items-center gap-1.5">
    <motion.span className="w-2 h-2 rounded-full" style={{ background: on ? color : '#2a2f34', boxShadow: on ? `0 0 6px ${color}` : 'none' }}
      animate={on ? { opacity: [1, 0.5, 1] } : {}} transition={{ duration: 1.6, repeat: Infinity }} />
    {label && <span className="text-[9px] font-mono uppercase tracking-wide text-surface-400">{label}</span>}
  </span>
);

/* ============================================================
   Physical push button (with optional active LED).
   ============================================================ */
export const HwButton = ({ children, active, onClick, accent = '#4CAF50', className = '' }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.94, y: 1 }}
    className={`relative px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${className}`}
    style={{
      color: active ? '#0a0d0a' : '#c7ccd1',
      background: active ? accent : 'linear-gradient(#3a4046, #23272c)',
      boxShadow: active ? `0 0 10px ${accent}88, inset 0 1px 1px rgba(255,255,255,0.3)` : 'inset 0 1px 1px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.5)',
    }}
  >
    {children}
  </motion.button>
);

/* ============================================================
   Channel module box (color-coded, e.g. CH1 yellow / CH2 cyan).
   ============================================================ */
export const ChannelBox = ({ label, color, active = true, onToggle, children }) => (
  <div className="rounded-xl p-2.5" style={{ background: 'linear-gradient(#1c2025, #14171a)', border: `1px solid ${active ? color + '88' : '#2a2f34'}` }}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-black tracking-wide px-1.5 py-0.5 rounded" style={{ color: '#0a0d0a', background: active ? color : '#3a4046' }}>{label}</span>
      {onToggle && (
        <button onClick={onToggle} className="text-[9px] font-bold uppercase" style={{ color: active ? color : '#5a6068' }}>
          {active ? 'ON' : 'OFF'}
        </button>
      )}
    </div>
    <div className="flex items-start justify-around gap-2">{children}</div>
  </div>
);

/* ============================================================
   Instrument CHASSIS — brushed-metal frame, brand strip, screen
   bay and a control deck. Gives the R&S-class hardware look.
   ============================================================ */
export const Chassis = ({ model, subtitle, powerOn = true, accent = '#4CAF50', screen, children, badges }) => (
  <div
    className="rounded-3xl overflow-hidden"
    style={{
      background: 'linear-gradient(155deg, #d6dadf 0%, #b9bfc6 18%, #cfd4d9 40%, #aeb4bb 100%)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.7)',
      border: '1px solid rgba(255,255,255,0.5)',
    }}
  >
    {/* Brand strip */}
    <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'linear-gradient(#2a2f34, #1c2025)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm" style={{ background: accent, color: '#0a0d0a' }}>A</div>
        <div className="leading-tight">
          <p className="text-xs font-black text-white tracking-wide">ADAPT <span className="font-medium text-surface-300">· {model}</span></p>
          {subtitle && <p className="text-[9px] text-surface-400 font-mono">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {badges}
        <Led on={powerOn} color={accent} label="PWR" />
      </div>
    </div>

    {/* Screen bay */}
    {screen && (
      <div className="px-3 pt-3">
        <div className="rounded-2xl p-2.5" style={{ background: 'linear-gradient(#0c100c, #060806)', boxShadow: 'inset 0 0 0 2px #2a2f34, inset 0 4px 20px rgba(0,0,0,0.8)' }}>
          {screen}
        </div>
      </div>
    )}

    {/* Control deck */}
    <div className="p-4">{children}</div>
  </div>
);

/* A reusable dark scope/analyzer screen with phosphor grid. */
export const Screen = ({ width = 480, height = 240, divX = 10, divY = 8, children, footer }) => (
  <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
    <defs>
      <radialGradient id="phos" cx="50%" cy="45%" r="75%">
        <stop offset="0%" stopColor="#0e160e" />
        <stop offset="100%" stopColor="#070a07" />
      </radialGradient>
    </defs>
    <rect x="0" y="0" width={width} height={height} fill="url(#phos)" rx="8" />
    {Array.from({ length: divX + 1 }).map((_, i) => (
      <line key={`x${i}`} x1={(i / divX) * width} y1="0" x2={(i / divX) * width} y2={height} stroke="rgba(94,141,78,0.14)" strokeWidth={i === divX / 2 ? 1.4 : 1} />
    ))}
    {Array.from({ length: divY + 1 }).map((_, i) => (
      <line key={`y${i}`} x1="0" y1={(i / divY) * height} x2={width} y2={(i / divY) * height} stroke="rgba(94,141,78,0.14)" strokeWidth={i === divY / 2 ? 1.4 : 1} />
    ))}
    {children}
    {footer}
  </svg>
);
