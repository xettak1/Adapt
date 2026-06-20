// Shared signal model for the Workbench — one connected system.
// Source instruments (RF/Function Generator, Power Supply) write the bench
// signal; measurement instruments (Oscilloscope, Multimeter, Spectrum, VNA)
// read from it. Changing any source immediately propagates everywhere.

export const initialBench = {
  // --- Function / RF generator output ---
  waveform: 'sine', // sine | square | triangle | sawtooth | pulse
  frequency: 1_000_000, // Hz (1 Hz .. 6 GHz)
  amplitude: 1.0, // Vpp
  offset: 0, // V
  dutyCycle: 50, // % (pulse)
  phase: 0, // deg
  genOn: true,

  // --- Modulation ---
  modType: 'none', // none | am | fm | pm
  modRate: 1000, // Hz (modulating frequency)
  modDepth: 60, // % AM depth
  modIndex: 2.5, // FM/PM modulation index

  // --- Programmable power supply (triple output) ---
  ch1Voltage: 5, // V
  ch1Current: 1, // A limit
  ch1On: false,
  ch2Voltage: 3.3,
  ch2Current: 0.5,
  ch2On: false,
  ch3Voltage: 12,
  ch3Current: 0.5,
  ch3On: false,
  tripleOutput: false, // expose 3rd channel

  // --- Bench condition ---
  noise: 0.08, // 0..1 injected noise
  ch2Scope: false, // show a second (RC-filtered) trace on the scope
  faulty: false, // challenge-mode fault injection

  // --- Connection state ---
  connected: true, // generator wired to the circuit/instruments
};

export const WAVEFORMS = [
  { id: 'sine', label: 'Sine', glyph: '∿' },
  { id: 'square', label: 'Square', glyph: '⊓⊔' },
  { id: 'triangle', label: 'Triangle', glyph: '△' },
  { id: 'sawtooth', label: 'Sawtooth', glyph: '◺' },
  { id: 'pulse', label: 'Pulse', glyph: '⊓_' },
];

export const waveValue = (type, phase, duty = 0.5) => {
  const p = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  switch (type) {
    case 'square':
      return p < Math.PI ? 1 : -1;
    case 'pulse':
      return p < Math.PI * 2 * duty ? 1 : -1;
    case 'triangle':
      return (2 / Math.PI) * Math.asin(Math.sin(p));
    case 'sawtooth':
      return p / Math.PI - 1;
    default:
      return Math.sin(p);
  }
};

const rmsFactor = (type) => {
  switch (type) {
    case 'square':
    case 'pulse':
      return 1;
    case 'triangle':
    case 'sawtooth':
      return 1 / Math.sqrt(3);
    default:
      return 1 / Math.sqrt(2);
  }
};

// Harmonic richness drives the spectrum analyzer + THD feel.
export const harmonicWeight = (type) =>
  type === 'sine' ? 0.04 : type === 'triangle' ? 0.18 : type === 'pulse' ? 0.7 : 0.55;

// What a measurement instrument "sees" given who is driving the bench.
export const measure = (bench) => {
  const live = bench.genOn && bench.connected && !bench.faulty;
  const acVpp = live ? bench.amplitude : 0;
  const acPeak = acVpp / 2;
  const acRms = acPeak * rmsFactor(bench.waveform);
  const supplyDc = (bench.ch1On ? bench.ch1Voltage : 0);
  const dc = supplyDc + (live ? bench.offset : 0);
  const periodNs = bench.frequency > 0 ? 1e9 / bench.frequency : 0;
  const duty = bench.waveform === 'pulse' ? bench.dutyCycle : bench.waveform === 'square' ? 50 : null;
  return {
    live,
    dcVoltage: bench.faulty ? 0 : dc,
    acVrms: acRms,
    acVpp,
    frequency: live ? bench.frequency : 0,
    periodNs,
    dutyCycle: duty,
    riseTimeNs: periodNs ? periodNs * 0.05 : 0,
    fallTimeNs: periodNs ? periodNs * 0.05 : 0,
    current: bench.ch1On ? Math.min(bench.ch1Current, 0.42) : 0,
    continuity: !bench.faulty && bench.connected,
    noisePct: Math.round(bench.noise * 100),
  };
};

export const formatFreq = (hz) => {
  if (!hz) return '0 Hz';
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`;
  return `${hz.toFixed(0)} Hz`;
};

export const formatVolt = (v) => `${v.toFixed(2)} V`;

// Log-scaled frequency control: position 0..1 maps to 1 Hz .. 6 GHz.
export const FREQ_MIN = 1;
export const FREQ_MAX = 6e9;
export const freqToPos = (hz) => Math.log10(Math.max(hz, FREQ_MIN) / FREQ_MIN) / Math.log10(FREQ_MAX / FREQ_MIN);
export const posToFreq = (pos) => FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, Math.min(1, Math.max(0, pos)));

export const MOD_TYPES = [
  { id: 'none', label: 'CW' },
  { id: 'am', label: 'AM' },
  { id: 'fm', label: 'FM' },
  { id: 'pm', label: 'ΦM' },
];

// How many modulating-signal cycles are visible across the scope window.
const MOD_VIS_CYCLES = 1.5;

/**
 * Unified waveform sampler used by the scope. `u` is 0..1 across the screen,
 * `t` is animation time, `cycles` is carrier cycles across the window.
 * Returns a value roughly in [-1.3, 1.3] (AM can overshoot ±1).
 */
export const sample = (bench, u, t, cycles) => {
  const duty = bench.dutyCycle / 100;
  const phaseOff = ((bench.phase || 0) * Math.PI) / 180;
  const carrierPhase = u * Math.PI * 2 * cycles + t * 2 + phaseOff;
  const modPhase = u * Math.PI * 2 * MOD_VIS_CYCLES + t * 1.3;
  const m = Math.sin(modPhase);

  switch (bench.modType) {
    case 'am':
      return (1 + (bench.modDepth / 100) * m) * waveValue(bench.waveform, carrierPhase, duty);
    case 'fm':
      return waveValue(bench.waveform, carrierPhase + bench.modIndex * Math.sin(modPhase), duty);
    case 'pm':
      return waveValue(bench.waveform, carrierPhase + bench.modIndex * m, duty);
    default:
      return waveValue(bench.waveform, carrierPhase, duty);
  }
};

// Spectrum sidebands produced by the modulation, as fractional offsets of the
// carrier bin (relative to span) plus a relative magnitude 0..1.
export const sidebands = (bench) => {
  if (bench.modType === 'none' || !bench.genOn) return [];
  const out = [];
  if (bench.modType === 'am') {
    const a = (bench.modDepth / 100) * 0.5;
    out.push({ ratio: bench.modRate / bench.frequency, mag: a });
    out.push({ ratio: -bench.modRate / bench.frequency, mag: a });
  } else {
    // FM/PM: Bessel-ish set of sidebands scaled by index
    const n = Math.min(4, Math.round(bench.modIndex) + 1);
    for (let k = 1; k <= n; k++) {
      const mag = Math.max(0.05, 0.6 / k) * Math.min(1, bench.modIndex / 3);
      out.push({ ratio: (k * bench.modRate) / bench.frequency, mag });
      out.push({ ratio: (-k * bench.modRate) / bench.frequency, mag });
    }
  }
  return out;
};

// Occupied bandwidth estimate (Carson's rule for FM/PM, 2·rate for AM).
export const occupiedBandwidth = (bench) => {
  if (!bench.genOn) return 0;
  if (bench.modType === 'am') return 2 * bench.modRate;
  if (bench.modType === 'fm' || bench.modType === 'pm') return 2 * (bench.modIndex + 1) * bench.modRate;
  return bench.frequency * 0.001; // narrow CW
};
