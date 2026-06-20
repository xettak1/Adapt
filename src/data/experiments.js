// Guided lab experiments + bench-validated challenge tasks for the Workbench.

export const guidedExperiments = [
  {
    id: 'scope-fundamentals', title: 'Oscilloscope Fundamentals', instrument: 'oscilloscope',
    steps: ['Enable the RF generator output.', 'Open the oscilloscope.', 'Press Auto-Scale.', 'Read Vpp and frequency from the measurement strip.', 'Turn the Trigger knob to 0% to lock the trace.'],
  },
  {
    id: 'signal-basics', title: 'Signal Generation Basics', instrument: 'rf-generator',
    steps: ['Select the Sine waveform.', 'Set the frequency to 1 MHz.', 'Set amplitude to 1 Vpp.', 'Switch between waveforms and watch the preview change.'],
  },
  {
    id: 'freq-measure', title: 'Frequency Measurement', instrument: 'oscilloscope',
    steps: ['Drive a sine into the scope.', 'Read the Period measurement.', 'Confirm f = 1 / T against the Freq readout.', 'Double the generator frequency and watch the period halve.'],
  },
  {
    id: 'harmonics', title: 'Harmonic Analysis', instrument: 'spectrum-analyzer',
    steps: ['Open the spectrum analyzer.', 'Set the generator to a square wave.', 'Press Peak → Center.', 'Identify the harmonics at 2×, 3×, 5× the carrier.'],
  },
  {
    id: 'filter-char', title: 'Filter Characterization', instrument: 'vna',
    steps: ['Open the VNA.', 'Choose the Band-Pass DUT.', 'Read the insertion loss (S21) at center.', 'Read the return loss (S11) — more negative is a better match.', 'Widen the bandwidth and watch S21 broaden.'],
  },
  {
    id: 'noise', title: 'Noise Analysis', instrument: 'spectrum-analyzer',
    steps: ['Open the spectrum analyzer.', 'Raise the bench Noise level.', 'Watch the noise floor rise on the display.', 'Notice weak harmonics disappear into the floor.'],
  },
  {
    id: 'rf-observe', title: 'RF Signal Observation', instrument: 'rf-generator',
    steps: ['Sweep the frequency knob toward the GHz range.', 'Watch the LED frequency readout switch units.', 'Open the spectrum analyzer to see the carrier move.'],
  },
];

// Bench-validated challenge tasks (checked against the shared signal).
export const challengeTasks = {
  oscilloscope: { goal: 'Drive the scope with a 1 MHz sine wave.', achievement: 'trigger-master', check: (b) => Math.abs(b.frequency - 1e6) < 5e4 && b.waveform === 'sine' && b.genOn },
  'rf-generator': { goal: 'Output a 2 MHz square wave.', achievement: 'signal-detective', check: (b) => Math.abs(b.frequency - 2e6) < 1e5 && b.waveform === 'square' && b.genOn },
  'spectrum-analyzer': { goal: 'Produce visible harmonics (non-sine waveform).', achievement: 'spectrum-hunter', check: (b) => b.waveform !== 'sine' && b.genOn },
  vna: { goal: 'Sweep the generator above 100 MHz.', achievement: null, check: (b) => b.frequency >= 1e8 },
  multimeter: { goal: 'Enable a power-supply rail to measure it.', achievement: null, check: (b) => b.ch1On },
  'power-supply': { goal: 'Set Output 1 to 12 V and enable it.', achievement: null, check: (b) => Math.abs(b.ch1Voltage - 12) < 0.6 && b.ch1On },
};
