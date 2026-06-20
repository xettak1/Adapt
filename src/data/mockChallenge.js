export const mockChallenge = {
  id: 'ch-001',
  title: 'Oscilloscope Mastery: Reading RF Waveforms',
  date: new Date().toISOString().split('T')[0],
  estimatedDuration: '25 min',
  difficulty: 'INTERMEDIATE',
  xpReward: 150,
  moduleId: 'mod-2',
  moduleName: 'Signal Behavior',

  scenario: {
    title: 'The Unstable Transmitter',
    context:
      'You are a junior RF engineer at a telecommunications company. A field technician reports that the 2.4 GHz transmitter in a base station is causing intermittent signal drops. You have been tasked with diagnosing the issue using a digital oscilloscope and signal generator.',
    objective:
      'Use the oscilloscope to characterize the RF output waveform, identify amplitude instability, and determine whether the issue is in the modulation stage or the power amplifier stage.',
    equipment: ['Rohde & Schwarz RTO2044 Oscilloscope', '2.4 GHz Signal Generator', 'RF Power Splitter', 'SMA Cables'],
    image: null,
  },

  miniLecture: {
    title: 'Understanding RF Waveform Characterization',
    content:
      'An oscilloscope is the primary tool for visualizing time-domain RF signals. When diagnosing transmitter instability, engineers look for three key indicators: amplitude modulation (AM) riding on the carrier, phase noise visible as waveform "jitter," and intermittent dropout events. In modern digital oscilloscopes, the persistence mode allows you to overlay thousands of waveform captures, making subtle instabilities visible as a "thickening" of the waveform trace.',
    keyPoints: [
      'Set time/div to capture at least 2-3 complete carrier cycles',
      'Use infinite persistence mode to reveal intermittent events',
      'Check trigger stability before interpreting amplitude readings',
      'Measure both peak-to-peak and RMS values for power assessment',
      'Use FFT mode to identify spurious emissions and harmonics',
    ],
  },

  history: {
    title: 'The Birth of the Oscilloscope',
    content:
      'The oscilloscope was invented by French physicist André Blondel in 1893, initially as a "bifilar oscillograph." The modern cathode-ray oscilloscope was developed by Karl Ferdinand Braun in 1897. During World War II, oscilloscopes became indispensable for radar calibration and signal analysis. Tektronix, founded in 1946 in Portland, Oregon, revolutionized the industry with portable oscilloscopes. Today, digital oscilloscopes can sample at rates exceeding 100 GSa/s, capturing events invisible to earlier analog instruments.',
    significance:
      'The oscilloscope remains the most fundamental diagnostic tool in electrical engineering, enabling engineers to "see" electricity for the first time.',
  },

  funFact: {
    title: 'Did You Know?',
    content:
      'The highest-bandwidth oscilloscope in existence as of 2024 achieves 110 GHz of analog bandwidth — fast enough to capture a single oscillation of a millimeter-wave 5G NR signal. At this speed, the oscilloscope is sampling 240 billion data points per second, generating more data per second than an entire month of global internet traffic from the early 2000s.',
    icon: '⚡',
  },

  tasks: [
    {
      id: 'task-mcq-1',
      type: 'mcq',
      question:
        'When setting up an oscilloscope to measure a 2.4 GHz RF carrier signal, what should be your FIRST step after powering on the instrument?',
      options: [
        { id: 'a', text: 'Connect the RF probe directly to the transmitter output' },
        { id: 'b', text: 'Perform a self-calibration and verify the timebase accuracy' },
        { id: 'c', text: 'Set the trigger level to 50% of expected signal amplitude' },
        { id: 'd', text: 'Enable infinite persistence mode to capture dropouts' },
      ],
      correctAnswer: 'b',
      explanation:
        'Self-calibration ensures measurement accuracy by compensating for thermal drift and component aging. Always calibrate before critical measurements. Connecting the probe before calibration risks damaging the instrument or producing inaccurate baseline data.',
      points: 50,
    },
    {
      id: 'task-mcq-2',
      type: 'mcq_multi',
      question:
        'Which of the following oscilloscope settings are CORRECT when characterizing amplitude instability in a 2.4 GHz signal? (Select ALL that apply)',
      options: [
        { id: 'a', text: 'Use AC coupling to remove the DC offset component' },
        { id: 'b', text: 'Set vertical scale to show 80% of the waveform within the display' },
        { id: 'c', text: 'Enable infinite persistence to reveal intermittent amplitude changes' },
        { id: 'd', text: 'Increase trigger holdoff to stabilize the display for repetitive analysis' },
      ],
      correctAnswers: ['b', 'c', 'd'],
      explanation:
        'AC coupling (A) is incorrect — at RF frequencies, you want DC coupling to see the full signal. Setting vertical scale to 80% (B) ensures you capture clipping and overshoots. Infinite persistence (C) reveals AM instability. Trigger holdoff (D) prevents re-triggering on noise, stabilizing the display for waveform analysis.',
      points: 75,
    },
    {
      id: 'task-arrange-1',
      type: 'arrange',
      question: 'Arrange the following oscilloscope setup procedure in the CORRECT order for RF signal characterization:',
      blocks: [
        { id: 'step-a', text: 'Power on and allow 30-minute warm-up period' },
        { id: 'step-b', text: 'Run self-calibration routine' },
        { id: 'step-c', text: 'Set vertical scale to expected signal amplitude' },
        { id: 'step-d', text: 'Set timebase to display 2-3 complete cycles' },
        { id: 'step-e', text: 'Connect RF probe with appropriate 50Ω termination' },
        { id: 'step-f', text: 'Adjust trigger level and source' },
        { id: 'step-g', text: 'Enable persistence mode and begin analysis' },
      ],
      correctOrder: ['step-a', 'step-b', 'step-c', 'step-d', 'step-e', 'step-f', 'step-g'],
      explanation:
        'The warm-up period (A) allows components to reach thermal equilibrium for accurate measurements. Self-calibration (B) must follow warm-up. Vertical (C) and timebase (D) settings are configured before connecting the signal (E) to avoid overloading the input. Triggering (F) is set on the live signal, and finally persistence analysis (G) begins.',
      points: 100,
    },
  ],
};

export const mockDailyStreakData = {
  completedToday: false,
  weekHistory: [true, true, false, true, true, true, false],
};
