// A context-aware tutor "brain" for the Workbench. Deterministic and offline —
// it adapts answers to the student's mastery level, the active instrument and
// the live bench state. Designed to be swapped for a real LLM endpoint later:
// just replace `respond()` with an async API call and keep the same context.

import { formatFreq } from '../components/workbench/benchUtils';

export const levelFromMastery = (mastery = 0) =>
  mastery >= 75 ? 'advanced' : mastery >= 50 ? 'intermediate' : 'beginner';

const instrumentNames = {
  oscilloscope: 'oscilloscope',
  'function-generator': 'function generator',
  multimeter: 'multimeter',
  voltmeter: 'voltmeter',
  'spectrum-analyzer': 'spectrum analyzer',
  'power-supply': 'power supply',
};

// Knowledge base — each topic offers level-adapted and mode-specific answers.
// Exported so Gemini can receive the existing entry as context and supplement it.
export const KB = {
  oscilloscope: {
    beginner: 'An oscilloscope draws a picture of a signal: voltage going up and down over time. It lets you *see* electricity move.',
    intermediate: 'The oscilloscope plots voltage (vertical) against time (horizontal). Use volts/div and time/div to scale the view so you capture a couple of clean cycles.',
    advanced: 'The scope samples the input and reconstructs the time-domain waveform. Vertical sensitivity sets amplitude resolution; the timebase sets the captured window; triggering anchors each acquisition for a stable display.',
    why: 'Without a scope you only get single numbers from a meter. The scope reveals shape, timing, glitches and distortion — everything a multimeter hides.',
    example: 'Try this: turn the function generator to a 1 MHz sine, open the scope, and adjust the trigger to ~50% — the wave snaps still.',
  },
  trigger: {
    beginner: 'The trigger tells the scope when to start drawing. Set it in the middle of the wave and the picture stops sliding around.',
    intermediate: 'Triggering starts each sweep when the signal crosses a chosen level/edge. Place the level near the signal midpoint for a stable lock.',
    advanced: 'The trigger comparator fires acquisition on a defined level and slope. Mis-set levels cause the display to free-run; holdoff prevents re-triggering on noise.',
    why: 'A stable trigger is what freezes a repetitive waveform so you can actually measure it.',
    example: 'If your wave is drifting, drag the trigger to 40–60% — watch it lock.',
  },
  frequency: {
    beginner: 'Frequency is how fast the signal repeats. Higher frequency = more wiggles per second.',
    intermediate: 'Frequency is cycles per second (Hz). On the bench it sets how many waves fit on the scope for a given timebase.',
    advanced: 'Frequency determines the period (T = 1/f) and the spectral position of the carrier on the spectrum analyzer.',
    why: 'Many RF faults are frequency-dependent — drift, harmonics and matching all move with frequency.',
    example: 'Bump the generator from 1 MHz to 2 MHz and watch the scope show twice as many cycles.',
  },
  amplitude: {
    beginner: 'Amplitude is how tall the wave is — how strong the signal feels.',
    intermediate: 'Amplitude (Vpp) is the peak-to-peak voltage swing. Scale volts/div so it fills ~80% of the screen.',
    advanced: 'Amplitude sets the signal power; RMS depends on the waveform shape (sine ≈ 0.354·Vpp).',
    why: 'Too small and you lose resolution; too large and you clip the input.',
    example: 'Set 4 Vpp and 2 V/div — the trace spans about two divisions each way.',
  },
  multimeter: {
    beginner: 'A multimeter measures one number at a time — like voltage or resistance — at a single point.',
    intermediate: 'The DMM measures DC/AC volts, resistance and continuity at a node. For AC it reports RMS, not peak.',
    advanced: 'The DMM integrates the measurement, so it gives RMS/DC averages but no waveform shape — pair it with the scope for time-domain detail.',
    why: 'It is fast and precise for steady values, but blind to shape and timing.',
    example: 'Switch to DC V across the supply output to read the rail voltage directly.',
  },
  'function-generator': {
    beginner: 'The function generator makes the test signal — pick a shape, how fast, and how big.',
    intermediate: 'It outputs sine/square/triangle/sawtooth with adjustable frequency, amplitude and DC offset to drive the circuit.',
    advanced: 'It is the bench source: waveform shape sets harmonic content, offset sets the DC operating point, amplitude sets drive level into the 50Ω load.',
    why: 'You need a known, controllable stimulus to characterize how a circuit responds.',
    example: 'Switch to a square wave and check the spectrum analyzer — harmonics appear at odd multiples.',
  },
  'spectrum-analyzer': {
    beginner: 'This shows which frequencies are present. The tallest bar is your main signal.',
    intermediate: 'It plots amplitude vs frequency. The carrier is the big peak; smaller peaks at 2× and 3× are harmonics.',
    advanced: 'It performs frequency-domain analysis; harmonic amplitudes reveal non-linearity/THD, and the noise floor sets measurement sensitivity.',
    why: 'Some problems (spurs, harmonics, interference) are invisible in time but obvious in frequency.',
    example: 'Compare a sine vs a square wave — the square sprouts a tall harmonic series.',
  },
  'power-supply': {
    beginner: 'The power supply gives your circuit steady DC power. Set the voltage you need.',
    intermediate: 'It provides a regulated DC voltage with a current limit that protects the circuit if it draws too much.',
    advanced: 'In CV mode it holds voltage; when load current hits the limit it crosses into CC mode, trading voltage for current protection.',
    why: 'A stable, current-limited rail keeps experiments safe and repeatable.',
    example: 'Set 5 V, 1 A limit and enable the output to power a small circuit.',
  },
  probe: {
    beginner: 'Connect the probe right at the point you want to measure, and clip the ground nearby.',
    intermediate: 'Measure at the output node and keep the ground lead short to avoid picking up noise.',
    advanced: 'Long ground leads add inductance and ringing; probe at the node of interest with the shortest return path.',
    why: 'Poor probing corrupts the measurement before the instrument even sees it.',
    example: 'Move the probe directly to the output node rather than further down the trace.',
  },
  harmonics: {
    beginner: 'Harmonics are extra waves hiding inside a non-smooth signal, at multiples of the main frequency.',
    intermediate: 'Harmonics are integer multiples of the fundamental. Sharp shapes (square) have strong harmonics; sines have almost none.',
    advanced: 'Harmonic content follows the Fourier series of the waveform; their relative amplitudes quantify distortion (THD).',
    why: 'Harmonics cause interference and reveal non-linearity in a system.',
    example: 'Switch the generator to square and watch the 3× and 5× peaks rise on the analyzer.',
  },
  offset: {
    beginner: 'Offset slides the whole wave up or down — adding a steady voltage underneath it.',
    intermediate: 'DC offset shifts the signal’s average level without changing its shape or amplitude.',
    advanced: 'Offset sets the DC bias point; the AC component rides on top, which matters for biasing active devices.',
    why: 'Many circuits only work when biased to the right operating point.',
    example: 'Add +2 V offset and watch the scope trace lift while the wave keeps its shape.',
  },
};

const TOPIC_KEYWORDS = [
  ['trigger', 'trigger'], ['frequenc', 'frequency'], ['amplitud', 'amplitude'],
  ['offset', 'offset'], ['harmonic', 'harmonics'], ['probe', 'probe'],
  ['oscillosc', 'oscilloscope'], ['scope', 'oscilloscope'],
  ['multimeter', 'multimeter'], ['dmm', 'multimeter'],
  ['spectrum', 'spectrum-analyzer'], ['power', 'power-supply'], ['supply', 'power-supply'],
  ['function', 'function-generator'], ['generator', 'function-generator'],
  ['voltmeter', 'voltmeter'], ['voltage', 'multimeter'], ['wave', 'function-generator'],
];

export const detectTopic = (text, activeInstrument) => {
  const lower = (text || '').toLowerCase();
  for (const [kw, topic] of TOPIC_KEYWORDS) {
    if (lower.includes(kw)) return topic;
  }
  return activeInstrument || 'oscilloscope';
};

const topicEntry = (topic) => KB[topic] || KB.oscilloscope;

// Main entry. Returns a response string adapted to mode + level + context.
export const respond = ({ text = '', mode = null, context = {} }) => {
  const level = context.level || 'beginner';
  const topic = detectTopic(text, context.activeInstrument);
  const entry = topicEntry(topic);
  const name = instrumentNames[topic] || topic;

  switch (mode) {
    case 'explain':
    case 'teach':
      return `${entry[level]}`;
    case 'why':
      return entry.why || `Here’s why it matters: ${entry.intermediate}`;
    case 'example':
      return entry.example || `For example — ${entry.beginner}`;
    case 'simplify':
      return entry.beginner;
    case 'deeper':
      return entry.advanced;
    default:
      break;
  }

  // Free-text: answer at the student's level, with a friendly opener.
  const openers = {
    beginner: ['Great question!', 'Good one —', 'Let’s keep it simple:'],
    intermediate: ['Sure —', 'Here’s the idea:', 'Good question:'],
    advanced: ['Right —', 'Precisely:', 'Technically:'],
  };
  const opener = openers[level][Math.floor(Math.random() * openers[level].length)];
  return `${opener} ${entry[level]}`;
};

// Proactive tip based on the live bench state (adaptive intervention).
export const contextualTip = (context = {}) => {
  const { bench, activeInstrument } = context;
  if (!bench) return null;
  if (activeInstrument === 'oscilloscope' && bench.genOn) {
    return 'Tip: if the trace won’t hold still, turn the Trigger knob toward 0% (mid-screen) to lock it.';
  }
  if (activeInstrument === 'spectrum-analyzer' && bench.waveform === 'sine') {
    return 'You’re viewing a clean sine — switch the generator to a square or pulse wave to watch harmonics appear.';
  }
  if (activeInstrument === 'multimeter' && !bench.ch1On && bench.genOn) {
    return 'Reading a signal? Use the AC V range — DC V will read near the offset only.';
  }
  if (activeInstrument === 'power-supply' && !bench.ch1On) {
    return 'Output 1 is disabled — enable it to deliver voltage to the bench rail.';
  }
  if (activeInstrument === 'vna') {
    return 'Sweep the center frequency across the DUT — the S21 dip shows where the filter passes or blocks signal.';
  }
  return null;
};

// Short reactive coaching note when a key parameter changes (cause→effect).
export const reactiveNote = (prev, next) => {
  if (!prev) return null;
  if (next.frequency !== prev.frequency) {
    const up = next.frequency > prev.frequency;
    return `You set the frequency to ${formatFreq(next.frequency)}. ${up ? 'Higher frequency means a shorter period — the waves on the scope bunch closer together.' : 'Lower frequency means a longer period — the waves stretch out.'}`;
  }
  if (next.waveform !== prev.waveform) {
    if (next.waveform === 'square' || next.waveform === 'pulse')
      return `Switched to a ${next.waveform} wave — notice the spectrum analyzer now shows strong odd harmonics at multiples of the carrier.`;
    if (next.waveform === 'sine') return 'Back to a sine — the spectrum collapses to a single clean carrier (very low harmonic content).';
    return `Switched to a ${next.waveform} wave — its harmonic content sits between a sine and a square.`;
  }
  if (next.amplitude !== prev.amplitude) {
    return `Amplitude is now ${next.amplitude.toFixed(2)} Vpp — the trace grows vertically and the measured RMS/power rises with it.`;
  }
  return null;
};

export const walkthrough = (instrument) => {
  const flows = {
    oscilloscope: [
      'Make sure the function generator output is ON.',
      'Set the generator to a 1 MHz sine wave.',
      'Open the oscilloscope — the trace should appear.',
      'Adjust volts/div so the wave fills most of the screen.',
      'Drag the trigger to ~50% to lock the display.',
      'Read the amplitude and frequency from the on-screen values.',
    ],
    'function-generator': [
      'Choose a waveform shape (start with sine).',
      'Set the frequency — try 1 MHz.',
      'Set the amplitude to about 4 Vpp.',
      'Leave offset at 0 V for now.',
      'Confirm the output is ON, then open a measurement instrument.',
    ],
    multimeter: [
      'Pick the function: DC V, AC V, resistance or continuity.',
      'For a steady rail, enable the power supply and select DC V.',
      'For a signal, select AC V to read its RMS.',
      'Compare with the oscilloscope to connect the number to the shape.',
    ],
    'spectrum-analyzer': [
      'Enable the function generator output.',
      'Note the tall carrier peak at the set frequency.',
      'Switch to a square wave and watch harmonics rise.',
      'Increase the bench noise to see weak signals get buried.',
    ],
    'power-supply': [
      'Set the desired output voltage.',
      'Set a sensible current limit (e.g. 1 A).',
      'Enable the output.',
      'Verify the rail with the voltmeter or multimeter.',
    ],
    voltmeter: [
      'Select DC or AC coupling.',
      'For a supply rail, use DC; for a signal, use AC (RMS).',
      'Read the value and sanity-check it against the scope.',
    ],
  };
  return flows[instrument] || flows.oscilloscope;
};

export const HINT_LEVELS = [
  'Think about which instrument shows signal *shape* versus a single *number*.',
  'The waveform is drifting because the display isn’t synchronized — look at the trigger.',
  'Set the trigger level near the middle of the signal (around 50%).',
  'Drag the Trigger Level slider to ~50% and the waveform will lock in place.',
];
