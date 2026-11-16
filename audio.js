// ============================================================================
// AUDIO.JS — Modular Web Audio Engine for Life in Paradise
// Swap between sound designs by changing ACTIVE_AUDIO_INDEX (0 to 7):
//   0 = Slot Machine & Carnival Arcade
//   1 = Cold Industrial Ledger & Cash Register
//   2 = Predatory Dopamine Pop-Ups vs. Somber Piano
//   3 = Minimalist Gallery Glass & Brass Resonance
//   4 = 8-Bit Retro Dystopian Chiptune (Your Favorite)
//   5 = 8-Bit Arcade Glitch & Coin Cascade (Retro Variant A)
//   6 = Dark NES Synth & Pulse Bass (Retro Variant B)
//   7 = Lo-Fi Handheld Game Boy Winter Chip (Retro Variant C)
// ============================================================================

let ACTIVE_AUDIO_INDEX = 7; // <-- CHANGE THIS SINGLE DIGIT (4, 5, 6, or 7)

let audioCtx = null;
let windGainNode = null;
let windFilterNode = null;
let lastHeartbeatTime = 0;

function initAudioEngine() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
    setupWinterWindLoop();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

function setupWinterWindLoop() {
  const bufferSize = audioCtx.sampleRate * 3;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 2.5;
  }

  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  windFilterNode = audioCtx.createBiquadFilter();
  windFilterNode.type = "bandpass";
  windFilterNode.frequency.value = 320;
  windFilterNode.Q.value = 2.8;

  windGainNode = audioCtx.createGain();
  windGainNode.gain.value = 0.0;

  whiteNoise.connect(windFilterNode);
  windFilterNode.connect(windGainNode);
  windGainNode.connect(audioCtx.destination);
  whiteNoise.start(0);
}

// ============================================================================
// 8 SOUND THEME PROFILES (Indexes 4, 5, 6, 7 = 8-Bit / Retro Chiptune Family)
// ============================================================================
const SOUND_THEMES = [
  // [0] SLOT MACHINE & CARNIVAL ARCADE
  {
    name: "Slot Machine & Carnival Arcade",
    windGainOutside: 0.055,
    windGainInside: 0.022,
    windFreq: 380,
    playAdPopup() {
      playTone(880, "triangle", 0.08, 0.14, 0);
      playTone(1174.66, "triangle", 0.12, 0.14, 0.07);
    },
    playPurchase(isBig) {
      if (isBig) {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(f, "square", 0.11, 0.12, i * 0.055));
      } else {
        playTone(587.33, "triangle", 0.09, 0.12, 0);
        playTone(880, "triangle", 0.11, 0.12, 0.06);
      }
    },
    playTowerOrb(isBig) {
      const baseFreq = isBig ? 987.77 : 659.25;
      playTone(baseFreq + Math.random() * 120, "sine", 0.09, isBig ? 0.16 : 0.08, 0);
      playTone(baseFreq * 1.5, "triangle", 0.07, isBig ? 0.11 : 0.05, 0.03);
    },
    playTowerBell() {
      playTone(1318.5, "sine", 0.65, 0.24, 0);
      playTone(2637.0, "triangle", 0.45, 0.14, 0);
      playTone(3951.0, "sine", 0.30, 0.08, 0.01);
    },
    playGameOver() {
      [440, 392, 349.23, 261.63].forEach((f, i) => playTone(f, "sawtooth", 0.25, 0.11, i * 0.18));
    }
  },

  // [1] COLD INDUSTRIAL LEDGER & CASH REGISTER
  {
    name: "Cold Industrial Ledger & Cash Register",
    windGainOutside: 0.09,
    windGainInside: 0.032,
    windFreq: 260,
    playAdPopup() {
      playTone(1480, "sine", 0.06, 0.13, 0);
      playTone(1480, "sine", 0.06, 0.13, 0.09);
    },
    playPurchase(isBig) {
      playNoiseBurst(0.08, 1200, 0.16);
      playTone(1046.5, "triangle", 0.18, 0.18, 0.06);
      if (isBig) playTone(2093, "sine", 0.28, 0.15, 0.08);
    },
    playTowerOrb(isBig) {
      playTone(isBig ? 110 : 146.83, "triangle", 0.14, isBig ? 0.22 : 0.10, 0);
      playNoiseBurst(0.04, 2400, isBig ? 0.10 : 0.04);
    },
    playTowerBell() {
      playNoiseBurst(0.09, 3200, 0.22);
      playTone(1760, "sine", 0.55, 0.25, 0.02);
      playTone(82.41, "sine", 0.50, 0.28, 0);
    },
    playGameOver() {
      playTone(98.0, "sawtooth", 0.65, 0.18, 0);
      playTone(65.41, "triangle", 0.85, 0.22, 0.25);
    }
  },

  // [2] PREDATORY DOPAMINE POP-UPS VS. SOMBER PIANO
  {
    name: "Predatory Dopamine Pop-Ups vs. Somber Piano",
    windGainOutside: 0.045,
    windGainInside: 0.02,
    windFreq: 310,
    playAdPopup() {
      [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => playTone(f, "sine", 0.18, 0.13, i * 0.05));
    },
    playPurchase(isBig) {
      if (isBig) {
        [523.25, 659.25, 783.99, 987.77, 1318.5].forEach((f, i) => playTone(f, "sine", 0.25, 0.12, i * 0.04));
      } else {
        playTone(329.63, "sine", 0.22, 0.11, 0);
        playTone(392.00, "sine", 0.25, 0.10, 0.08);
      }
    },
    playTowerOrb(isBig) {
      const chord = [523.25, 659.25, 783.99, 1046.5];
      const note = chord[Math.floor(Math.random() * chord.length)];
      playTone(note, "sine", 0.22, isBig ? 0.14 : 0.06, 0);
    },
    playTowerBell() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) => {
        playTone(f, "sine", 0.75, 0.11, i * 0.035);
      });
    },
    playGameOver() {
      playTone(293.66, "sine", 0.55, 0.16, 0);
      playTone(261.63, "sine", 0.55, 0.16, 0.35);
      playTone(220.00, "sine", 0.90, 0.18, 0.70);
    }
  },

  // [3] MINIMALIST GALLERY GLASS & BRASS RESONANCE
  {
    name: "Minimalist Gallery Glass & Brass Resonance",
    windGainOutside: 0.04,
    windGainInside: 0.018,
    windFreq: 420,
    playAdPopup() {
      playTone(1318.5, "sine", 0.14, 0.10, 0);
      playTone(1760.0, "sine", 0.18, 0.08, 0.08);
    },
    playPurchase(isBig) {
      playTone(isBig ? 440 : 523.25, "sine", 0.24, 0.13, 0);
    },
    playTowerOrb(isBig, profitLevel) {
      const pitch = 440 + Math.min(profitLevel * 12, 480);
      playTone(pitch, "sine", 0.16, isBig ? 0.13 : 0.06, 0);
    },
    playTowerBell() {
      playTone(587.33, "sine", 1.1, 0.22, 0);
      playTone(1174.66, "sine", 0.85, 0.11, 0.02);
      playTone(1760.0, "sine", 0.65, 0.06, 0.04);
    },
    playGameOver() {
      playTone(196.0, "sine", 0.9, 0.16, 0);
      playTone(185.0, "sine", 1.1, 0.16, 0.4);
    }
  },

  // [4] 8-BIT RETRO DYSTOPIAN CHIPTUNE
  {
    name: "8-Bit Retro Dystopian Chiptune",
    windGainOutside: 0.05,
    windGainInside: 0.025,
    windFreq: 350,
    playAdPopup() {
      playTone(987.77, "square", 0.06, 0.09, 0);
      playTone(1318.5, "square", 0.06, 0.09, 0.06);
      playTone(987.77, "square", 0.06, 0.09, 0.12);
      playTone(1318.5, "square", 0.10, 0.09, 0.18);
    },
    playPurchase(isBig) {
      playTone(493.88, "square", 0.06, 0.10, 0);
      playTone(659.25, "square", 0.12, 0.10, 0.06);
    },
    playTowerOrb(isBig) {
      playTone(987.77, "square", 0.045, isBig ? 0.09 : 0.04, 0);
      playTone(1318.5, "square", 0.075, isBig ? 0.09 : 0.04, 0.045);
    },
    playTowerBell() {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => {
        playTone(f, "square", 0.09, 0.11, i * 0.07);
      });
    },
    playGameOver() {
      [392, 369.99, 349.23, 329.63, 261.63].forEach((f, i) => {
        playTone(f, "square", 0.16, 0.11, i * 0.14);
      });
    }
  },

  // [5] 8-BIT ARCADE GLITCH & RAPID COIN CASCADE
  {
    name: "8-Bit Arcade Glitch & Coin Cascade",
    windGainOutside: 0.045,
    windGainInside: 0.022,
    windFreq: 390,
    playAdPopup() {
      [1046.5, 1396.9, 1046.5, 1567.98, 2093.0].forEach((f, i) => {
        playTone(f, "square", 0.045, 0.085, i * 0.042);
      });
    },
    playPurchase(isBig) {
      if (isBig) {
        [587.33, 783.99, 987.77, 1174.66].forEach((f, i) => playTone(f, "square", 0.07, 0.095, i * 0.045));
      } else {
        playTone(587.33, "square", 0.05, 0.085, 0);
        playTone(880.00, "square", 0.09, 0.085, 0.05);
      }
    },
    playTowerOrb(isBig, profitLevel) {
      const step = Math.min(profitLevel * 8, 320);
      playTone(880 + step, "square", 0.035, isBig ? 0.085 : 0.04, 0);
      playTone(1318.5 + step, "triangle", 0.055, isBig ? 0.09 : 0.045, 0.035);
    },
    playTowerBell() {
      [659.25, 880, 1174.66, 1567.98, 2093.0].forEach((f, i) => {
        playTone(f, "square", 0.08, 0.10, i * 0.055);
        playTone(f * 0.5, "triangle", 0.12, 0.10, i * 0.055);
      });
    },
    playGameOver() {
      [440, 415.30, 392.00, 349.23, 293.66, 220.00].forEach((f, i) => {
        playTone(f, "square", 0.13, 0.10, i * 0.11);
      });
    }
  },

  // [6] DARK NES SYNTH & SUB-PULSE
  {
    name: "Dark NES Synth & Sub-Pulse",
    windGainOutside: 0.06,
    windGainInside: 0.028,
    windFreq: 290,
    playAdPopup() {
      playTone(739.99, "sawtooth", 0.07, 0.08, 0);
      playTone(1108.73, "square", 0.07, 0.08, 0.07);
      playTone(1479.98, "square", 0.12, 0.08, 0.14);
    },
    playPurchase(isBig) {
      playTone(220.00, "triangle", 0.14, 0.14, 0);
      playTone(isBig ? 659.25 : 440.00, "square", 0.11, 0.08, 0.05);
    },
    playTowerOrb(isBig) {
      playTone(164.81, "triangle", 0.08, isBig ? 0.15 : 0.07, 0);
      playTone(isBig ? 987.77 : 659.25, "square", 0.06, isBig ? 0.075 : 0.035, 0.02);
    },
    playTowerBell() {
      playTone(110.00, "sawtooth", 0.45, 0.14, 0);
      [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => {
        playTone(f, "square", 0.11, 0.09, i * 0.065);
      });
    },
    playGameOver() {
      [329.63, 311.13, 293.66, 261.63, 196.00].forEach((f, i) => {
        playTone(f, "sawtooth", 0.20, 0.10, i * 0.16);
      });
    }
  },

  // [7] LO-FI HANDHELD GAME BOY WINTER CHIP
  {
    name: "Lo-Fi Handheld Game Boy Winter Chip",
    windGainOutside: 0.048,
    windGainInside: 0.024,
    windFreq: 340,
    playAdPopup() {
      playTone(783.99, "triangle", 0.06, 0.11, 0);
      playTone(1046.5, "square", 0.06, 0.07, 0.06);
      playTone(1318.5, "triangle", 0.11, 0.11, 0.12);
    },
    playPurchase(isBig) {
      playTone(523.25, "triangle", 0.07, 0.12, 0);
      playTone(783.99, "square", 0.10, 0.07, 0.06);
    },
    playTowerOrb(isBig) {
      playTone(783.99, "triangle", 0.05, isBig ? 0.12 : 0.06, 0);
      playTone(1046.5, "square", 0.06, isBig ? 0.065 : 0.03, 0.04);
    },
    playTowerBell() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
        playTone(f, "triangle", 0.12, 0.13, i * 0.065);
        playTone(f, "square", 0.09, 0.05, i * 0.065);
      });
    },
    playGameOver() {
      [392.00, 349.23, 329.63, 293.66, 261.63].forEach((f, i) => {
        playTone(f, "triangle", 0.18, 0.13, i * 0.15);
      });
    }
  }
];

// ============================================================================
// PUBLIC HOOKS CALLED BY SKETCH.JS
// ============================================================================
function updateAudioEnvironment(gameState, routineState, survivalBarLevel, frameCount) {
  if (!audioCtx || !windGainNode) return;

  const theme = SOUND_THEMES[ACTIVE_AUDIO_INDEX] || SOUND_THEMES[4];
  const now = audioCtx.currentTime;

  let targetWindGain = theme.windGainInside;
  if (gameState === "PLAY") {
    targetWindGain = (routineState === "AT_SHOP" || routineState === "RESTING_NIGHT")
      ? theme.windGainInside
      : theme.windGainOutside;
  } else if (gameState === "INTRO" || gameState === "PERSPECTIVE") {
    // Continuous gallery ambient winter sound on start & perspective screens
    targetWindGain = theme.windGainOutside * 0.85;
  }

  windGainNode.gain.setTargetAtTime(targetWindGain, now, 0.15);
  windFilterNode.frequency.setTargetAtTime(
    theme.windFreq + Math.sin(frameCount * 0.02) * 85,
    now,
    0.15
  );

  // Subtle low heartbeat warning when survival drops below 35%
  if (gameState === "PLAY" && survivalBarLevel < 0.35 && now - lastHeartbeatTime > 0.95) {
    lastHeartbeatTime = now;
    playTone(58, "sine", 0.14, 0.18, 0);
    playTone(52, "sine", 0.16, 0.14, 0.16);
  }
}

function triggerKeypadClickSound() {
  initAudioEngine();
  playTone(783.99, "square", 0.035, 0.05, 0);
}

function triggerAdPopupSound() {
  initAudioEngine();
  (SOUND_THEMES[ACTIVE_AUDIO_INDEX] || SOUND_THEMES[4]).playAdPopup();
}

function triggerPurchaseSound(isBig) {
  initAudioEngine();
  (SOUND_THEMES[ACTIVE_AUDIO_INDEX] || SOUND_THEMES[4]).playPurchase(isBig);
}

function triggerTowerOrbSound(isBig, profitLevel) {
  initAudioEngine();
  (SOUND_THEMES[ACTIVE_AUDIO_INDEX] || SOUND_THEMES[4]).playTowerOrb(isBig, profitLevel);
}

function triggerTowerBellSound() {
  initAudioEngine();
  (SOUND_THEMES[ACTIVE_AUDIO_INDEX] || SOUND_THEMES[4]).playTowerBell();
}

function triggerGameOverSound() {
  initAudioEngine();
  (SOUND_THEMES[ACTIVE_AUDIO_INDEX] || SOUND_THEMES[4]).playGameOver();
}

// ============================================================================
// LOW-LEVEL WEB AUDIO SYNTHESIS HELPERS
// ============================================================================
function playTone(freq, type, duration, maxGain, delaySec = 0) {
  if (!audioCtx) return;
  const start = audioCtx.currentTime + delaySec;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(maxGain, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playNoiseBurst(duration, filterFreq, maxGain) {
  if (!audioCtx) return;
  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = filterFreq;

  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(maxGain, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start(now);
}