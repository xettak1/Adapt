import { useState } from 'react';
import { Chassis, SegmentDisplay, HwButton, Led } from './hardware';
import { measure, formatFreq } from './benchUtils';

const FUNCS = [
  { id: 'dcv', label: 'V⎓', name: 'DC Voltage' },
  { id: 'acv', label: 'V∿', name: 'AC Voltage' },
  { id: 'cur', label: 'A', name: 'Current' },
  { id: 'res', label: 'Ω', name: 'Resistance' },
  { id: 'cont', label: '•))', name: 'Continuity' },
];
const ACCENT = '#fb923c';

const MultimeterHW = ({ bench }) => {
  const [fn, setFn] = useState('dcv');
  const m = measure(bench);

  const read = () => {
    switch (fn) {
      case 'dcv': return { value: m.dcVoltage.toFixed(3), unit: 'V⎓' };
      case 'acv': return { value: m.acVrms.toFixed(3), unit: 'V∿' };
      case 'cur': return { value: (m.current * 1000).toFixed(1), unit: 'mA' };
      case 'res': return { value: bench.faulty ? 'O.L' : '47.0', unit: 'Ω' };
      case 'cont': return { value: m.continuity ? '000.3' : 'O.L', unit: m.continuity ? 'Ω •))' : 'Ω' };
      default: return { value: '0', unit: '' };
    }
  };
  const r = read();
  const active = FUNCS.find((f) => f.id === fn);

  return (
    <Chassis model="HMC-Digital Multimeter" subtitle="6½ digit · True-RMS" accent={ACCENT}
      badges={<Led on color={ACCENT} label={active.name} />}
      screen={
        <div className="py-4 flex flex-col items-center gap-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-surface-400">{active.name}</p>
          <SegmentDisplay value={r.value} unit={r.unit} color={ACCENT} size="lg" ghost="0.000" />
          <p className="text-[10px] font-mono text-surface-500">COM + VΩ probes · bench output node</p>
        </div>
      }
    >
      {/* Rotary function dial as labelled keys */}
      <div className="flex flex-wrap gap-2 justify-center">
        {FUNCS.map((f) => (
          <HwButton key={f.id} active={fn === f.id} onClick={() => setFn(f.id)} accent={ACCENT} className="min-w-[58px]">
            <span className="text-sm">{f.label}</span>
          </HwButton>
        ))}
      </div>
      <p className="text-center text-[11px] text-surface-400 mt-3">
        A multimeter reads one value at a point. Use the oscilloscope to see the waveform <em>shape</em>.
      </p>
    </Chassis>
  );
};

export default MultimeterHW;
