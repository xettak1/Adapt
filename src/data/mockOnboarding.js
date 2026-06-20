import { Wrench, Radio, Activity, Search, Waves, Antenna } from 'lucide-react';

export const experienceOptions = [
  {
    id: 'new',
    emoji: '🌱',
    title: 'Completely New',
    description: 'I am just getting started.',
    level: 0,
  },
  {
    id: 'some',
    emoji: '⚡',
    title: 'Some Experience',
    description: 'I understand some concepts but still need guidance.',
    level: 1,
  },
  {
    id: 'experienced',
    emoji: '🎯',
    title: 'Experienced',
    description: 'I have studied RF/Electronics for years and have lab experience.',
    level: 2,
  },
];

export const goalOptions = [
  { id: 'lab-skills', emoji: '🔬', label: 'Laboratory Skills' },
  { id: 'rf-measure', emoji: '📡', label: 'RF Measurements' },
  { id: 'oscilloscope', emoji: '🖥️', label: 'Oscilloscope Usage' },
  { id: 'troubleshooting', emoji: '🔧', label: 'Troubleshooting' },
  { id: 'signal-analysis', emoji: '📈', label: 'Signal Analysis' },
  { id: 'comm-systems', emoji: '📻', label: 'Communication Systems' },
];

// Adaptive diagnostic — difficulty tiers. The engine serves harder/easier
// questions based on the running performance.
export const diagnosticQuestions = {
  easy: [
    {
      id: 'd-e1',
      difficulty: 'easy',
      type: 'mcq',
      prompt: 'What does an oscilloscope primarily measure?',
      options: [
        { id: 'a', text: 'Voltage over time' },
        { id: 'b', text: 'Resistance only' },
        { id: 'c', text: 'Temperature' },
        { id: 'd', text: 'Magnetic field strength' },
      ],
      correct: 'a',
      concept: 'Instrument Basics',
    },
    {
      id: 'd-e2',
      difficulty: 'easy',
      type: 'concept',
      prompt: 'Which unit is used to express signal frequency?',
      options: [
        { id: 'a', text: 'Volts (V)' },
        { id: 'b', text: 'Hertz (Hz)' },
        { id: 'c', text: 'Ohms (Ω)' },
        { id: 'd', text: 'Watts (W)' },
      ],
      correct: 'b',
      concept: 'Signal Fundamentals',
    },
  ],
  medium: [
    {
      id: 'd-m1',
      difficulty: 'medium',
      type: 'scenario',
      prompt: 'A waveform on your oscilloscope keeps scrolling and never stays still. What setting should you adjust first?',
      options: [
        { id: 'a', text: 'Vertical scale (volts/div)' },
        { id: 'b', text: 'The trigger level and source' },
        { id: 'c', text: 'Probe attenuation' },
        { id: 'd', text: 'Display brightness' },
      ],
      correct: 'b',
      concept: 'Triggering & Stability',
    },
    {
      id: 'd-m2',
      difficulty: 'medium',
      type: 'mcq',
      prompt: 'A 50Ω system has a reflection. Which parameter best describes how much signal is reflected?',
      options: [
        { id: 'a', text: 'Insertion loss' },
        { id: 'b', text: 'Return loss / S11' },
        { id: 'c', text: 'Gain' },
        { id: 'd', text: 'Bandwidth' },
      ],
      correct: 'b',
      concept: 'Signal Behavior',
    },
  ],
  hard: [
    {
      id: 'd-h1',
      difficulty: 'hard',
      type: 'order',
      prompt: 'Order these steps to measure noise figure with a spectrum analyzer:',
      blocks: [
        { id: 'o1', text: 'Calibrate with a known noise source' },
        { id: 'o2', text: 'Connect the device under test' },
        { id: 'o3', text: 'Measure output noise power' },
        { id: 'o4', text: 'Compute the noise figure' },
      ],
      correctOrder: ['o1', 'o2', 'o3', 'o4'],
      concept: 'RF Measurement Concepts',
    },
    {
      id: 'd-h2',
      difficulty: 'hard',
      type: 'scenario',
      prompt: 'A power amplifier shows spurious peaks at 2x and 3x the carrier. What is the most likely cause?',
      options: [
        { id: 'a', text: 'Thermal drift in the oscilloscope' },
        { id: 'b', text: 'Harmonic distortion from non-linearity' },
        { id: 'c', text: 'Incorrect probe grounding' },
        { id: 'd', text: 'Low battery on the signal generator' },
      ],
      correct: 'b',
      concept: 'Advanced Diagnostics',
    },
  ],
};

export const tracks = {
  beginner: {
    id: 'beginner',
    name: 'Beginner Track',
    emoji: '🌱',
    color: 'from-emerald-400 to-teal-500',
    description: 'Build a rock-solid foundation in lab instruments and signals.',
    startingModule: 'Instrument Basics',
    modules: ['Instrument Basics', 'Signal Fundamentals'],
  },
  intermediate: {
    id: 'intermediate',
    name: 'Intermediate Track',
    emoji: '⚡',
    color: 'from-blue-400 to-primary-600',
    description: 'Sharpen your signal behavior and triggering expertise.',
    startingModule: 'Signal Behavior',
    modules: ['Signal Behavior', 'Triggering & Stability'],
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced Track',
    emoji: '🎯',
    color: 'from-violet-400 to-purple-600',
    description: 'Master professional RF measurement and fault diagnosis.',
    startingModule: 'RF Measurement Concepts',
    modules: ['RF Measurement Concepts', 'Advanced Diagnostics', 'Laboratory Troubleshooting'],
  },
};

// Determine placement from experience + diagnostic score (0-100).
// Completely-new students always start at Module 1 (Beginner track),
// regardless of how they guessed on the diagnostic.
export const determinePlacement = (experienceLevel, diagnosticScore) => {
  if (experienceLevel <= 0) return tracks.beginner;
  const blended = experienceLevel * 25 + diagnosticScore * 0.6;
  if (blended >= 75) return tracks.advanced;
  if (blended >= 40) return tracks.intermediate;
  return tracks.beginner;
};
