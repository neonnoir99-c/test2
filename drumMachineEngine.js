/**
 * Drum Machine Audio Scheduling Engine
 * Integrates AudioScheduler with DrumSynthesizers for precise 120 BPM drum sequencing
 * 
 * This engine:
 * - Schedules drum sounds at precise 120 BPM intervals
 * - Manages 4-track patterns (Kick, Snare, HiHat, Bass)
 * - Uses Web Audio API for sample-accurate timing
 * - Provides pattern programming interface
 */

import AudioScheduler from './audio-scheduler.js';

class DrumMachineEngine {
  constructor(bpm = 120) {
    // Core components
    this.scheduler = new AudioScheduler(bpm, 4); // 4 steps per beat (16th notes)
    this.audioContext = null;
    this.drums = null;
    
    // Pattern data - 4 tracks × 16 steps
    this.pattern = {
      kick: new Array(16).fill(false),
      snare: new Array(16).fill(false),
      hihat: new Array(16).fill(false),
      bass: new Array(16).fill(false)
    };
    
    // Track settings
    this.trackSettings = {
      kick: { velocity: 1.0, enabled: true },
      snare: { velocity: 0.8, enabled: true },
      hihat: { velocity: 0.6, enabled: true, open: false },
      bass: { velocity: 0.7, enabled: true, pitch: 80 }
    };
    
    // Callbacks
    this.onStepPlayCallback = null;
    this.onPatternChangeCallback = null;
    
    // Performance metrics
    this.metrics = {
      stepsPlayed: 0,
      lastStepTime: 0,
      averageLatency: 0
    };
  }

  /**
   * Initialize the drum machine (must be called after user interaction)
   */
  async initialize() {
    // Initialize scheduler and get AudioContext
    this.audioContext = await this.scheduler.initialize();
    
    // Create drum synthesizers
    this.drums = new DrumSynthesizers(this.audioContext);
    
    // Register scheduler callbacks
    this.scheduler.onStep((stepNumber, time) => {
      this.triggerStep(stepNumber, time);
    });
    
    this.scheduler.onVisualUpdate((stepNumber, time) => {
      if (this.onStepPlayCallback) {
        this.onStepPlayCallback(stepNumber, time);
      }
    });
    
    console.log('Drum Machine Engine initialized at', this.audioContext.sampleRate, 'Hz');
    return this.audioContext;
  }

  /**
   * Trigger all active sounds for a given step
   * This is called by the scheduler at precise times
   */
  triggerStep(stepNumber, time) {
    // Update metrics
    this.metrics.stepsPlayed++;
    this.metrics.lastStepTime = time;
    
    // Check each track and trigger if active
    if (this.pattern.kick[stepNumber] && this.trackSettings.kick.enabled) {
      this.drums.playKick(time, this.trackSettings.kick.velocity);
    }
    
    if (this.pattern.snare[stepNumber] && this.trackSettings.snare.enabled) {
      this.drums.playSnare(time, this.trackSettings.snare.velocity);
    }
    
    if (this.pattern.hihat[stepNumber] && this.trackSettings.hihat.enabled) {
      this.drums.playHiHat(
        time,
        this.trackSettings.hihat.velocity,
        this.trackSettings.hihat.open
      );
    }
    
    if (this.pattern.bass[stepNumber] && this.trackSettings.bass.enabled) {
      this.drums.playBass(
        time,
        this.trackSettings.bass.velocity,
        this.trackSettings.bass.pitch
      );
    }
  }

  /**
   * Start playback
   */
  async start() {
    if (!this.audioContext) {
      await this.initialize();
    }
    await this.scheduler.start();
    console.log('Drum machine started');
  }

  /**
   * Stop playback
   */
  stop() {
    this.scheduler.stop();
    console.log('Drum machine stopped');
  }

  /**
   * Toggle playback
   */
  async toggle() {
    await this.scheduler.toggle();
  }

  /**
   * Check if playing
   */
  isPlaying() {
    return this.scheduler.isPlaying;
  }

  /**
   * Set a step in the pattern
   * @param {string} track - Track name ('kick', 'snare', 'hihat', 'bass')
   * @param {number} step - Step number (0-15)
   * @param {boolean} active - Whether the step is active
   */
  setStep(track, step, active) {
    if (!this.pattern[track]) {
      console.error(`Invalid track: ${track}`);
      return;
    }
    
    if (step < 0 || step >= 16) {
      console.error(`Invalid step: ${step} (must be 0-15)`);
      return;
    }
    
    this.pattern[track][step] = active;
    
    if (this.onPatternChangeCallback) {
      this.onPatternChangeCallback(track, step, active);
    }
  }

  /**
   * Toggle a step in the pattern
   * @param {string} track - Track name
   * @param {number} step - Step number (0-15)
   */
  toggleStep(track, step) {
    if (!this.pattern[track]) {
      console.error(`Invalid track: ${track}`);
      return;
    }
    
    const newState = !this.pattern[track][step];
    this.setStep(track, step, newState);
    return newState;
  }

  /**
   * Get the current pattern
   */
  getPattern() {
    return JSON.parse(JSON.stringify(this.pattern)); // Deep copy
  }

  /**
   * Load a pattern
   * @param {Object} pattern - Pattern object with track arrays
   */
  loadPattern(pattern) {
    // Validate pattern structure
    const tracks = ['kick', 'snare', 'hihat', 'bass'];
    for (const track of tracks) {
      if (pattern[track] && Array.isArray(pattern[track]) && pattern[track].length === 16) {
        this.pattern[track] = [...pattern[track]];
      }
    }
    
    if (this.onPatternChangeCallback) {
      this.onPatternChangeCallback('all', -1, true);
    }
    
    console.log('Pattern loaded');
  }

  /**
   * Clear the entire pattern
   */
  clearPattern() {
    this.pattern.kick.fill(false);
    this.pattern.snare.fill(false);
    this.pattern.hihat.fill(false);
    this.pattern.bass.fill(false);
    
    if (this.onPatternChangeCallback) {
      this.onPatternChangeCallback('all', -1, false);
    }
  }

  /**
   * Clear a specific track
   * @param {string} track - Track name
   */
  clearTrack(track) {
    if (this.pattern[track]) {
      this.pattern[track].fill(false);
      
      if (this.onPatternChangeCallback) {
        this.onPatternChangeCallback(track, -1, false);
      }
    }
  }

  /**
   * Set BPM (tempo)
   * @param {number} bpm - Beats per minute (20-300)
   */
  setBPM(bpm) {
    this.scheduler.setBPM(bpm);
    console.log(`BPM set to ${this.scheduler.getBPM()}`);
  }

  /**
   * Get current BPM
   */
  getBPM() {
    return this.scheduler.getBPM();
  }

  /**
   * Set track velocity
   * @param {string} track - Track name
   * @param {number} velocity - Volume (0-1)
   */
  setTrackVelocity(track, velocity) {
    if (this.trackSettings[track]) {
      this.trackSettings[track].velocity = Math.max(0, Math.min(1, velocity));
    }
  }

  /**
   * Set track enabled state
   * @param {string} track - Track name
   * @param {boolean} enabled - Whether track is enabled
   */
  setTrackEnabled(track, enabled) {
    if (this.trackSettings[track]) {
      this.trackSettings[track].enabled = enabled;
    }
  }

  /**
   * Set hi-hat open/closed
   * @param {boolean} open - True for open hi-hat, false for closed
   */
  setHiHatOpen(open) {
    this.trackSettings.hihat.open = open;
  }

  /**
   * Set bass pitch
   * @param {number} pitch - Frequency in Hz (40-200)
   */
  setBassPitch(pitch) {
    this.trackSettings.bass.pitch = Math.max(40, Math.min(200, pitch));
  }

  /**
   * Set master volume
   * @param {number} volume - Volume (0-1)
   */
  setMasterVolume(volume) {
    if (this.drums) {
      this.drums.setMasterVolume(volume);
    }
  }

  /**
   * Register callback for step playback (visual updates)
   * @param {Function} callback - Function(stepNumber, time)
   */
  onStepPlay(callback) {
    this.onStepPlayCallback = callback;
  }

  /**
   * Register callback for pattern changes
   * @param {Function} callback - Function(track, step, active)
   */
  onPatternChange(callback) {
    this.onPatternChangeCallback = callback;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      currentTime: this.audioContext ? this.audioContext.currentTime : 0,
      isPlaying: this.scheduler.isPlaying
    };
  }

  /**
   * Load a preset pattern
   * @param {string} presetName - Name of the preset
   */
  loadPreset(presetName) {
    const presets = {
      // Basic four-on-the-floor
      basic: {
        kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        bass:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
      },
      
      // Funky groove
      funk: {
        kick:  [true, false, false, false, false, false, true, false, false, true, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false],
        hihat: [true, false, true, true, true, false, true, false, true, true, true, false, true, false, true, true],
        bass:  [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false]
      },
      
      // Breakbeat
      breakbeat: {
        kick:  [true, false, false, false, false, false, false, false, true, false, false, true, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        bass:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
      },
      
      // Techno
      techno: {
        kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        bass:  [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false]
      },
      
      // Hip-hop
      hiphop: {
        kick:  [true, false, false, false, false, false, false, false, true, false, false, false, false, false, true, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true],
        bass:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
      }
    };
    
    if (presets[presetName]) {
      this.loadPattern(presets[presetName]);
      console.log(`Loaded preset: ${presetName}`);
      return true;
    } else {
      console.error(`Preset not found: ${presetName}`);
      return false;
    }
  }

  /**
   * Get list of available presets
   */
  getPresets() {
    return ['basic', 'funk', 'breakbeat', 'techno', 'hiphop'];
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    
    if (this.drums) {
      this.drums.disconnect();
    }
    
    if (this.scheduler) {
      this.scheduler.destroy();
    }
    
    this.audioContext = null;
    this.drums = null;
  }
}

/**
 * DrumSynthesizers class (embedded for standalone use)
 */
class DrumSynthesizers {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.audioContext.destination);
  }

  createNoiseBuffer(duration = 0.5) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playKick(time, velocity = 1.0) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);
    filter.Q.value = 1;

    gain.gain.setValueAtTime(velocity * 1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  playSnare(time, velocity = 1.0) {
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();

    osc1.type = 'triangle';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(180, time);
    osc2.frequency.setValueAtTime(330, time);

    oscGain.gain.setValueAtTime(velocity * 0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc1.connect(oscGain);
    osc2.connect(oscGain);

    const noiseBuffer = this.createNoiseBuffer(0.2);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noiseFilter.Q.value = 1;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.7, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    const mixGain = this.audioContext.createGain();
    mixGain.gain.value = 1.0;
    
    oscGain.connect(mixGain);
    noiseGain.connect(mixGain);
    mixGain.connect(this.masterGain);

    osc1.start(time);
    osc1.stop(time + 0.1);
    osc2.start(time);
    osc2.stop(time + 0.1);
    noise.start(time);
    noise.stop(time + 0.15);
  }

  playHiHat(time, velocity = 1.0, open = false) {
    const noiseBuffer = this.createNoiseBuffer(0.3);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 7000;
    highpass.Q.value = 1;

    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    bandpass.Q.value = 0.5;

    const gain = this.audioContext.createGain();
    const duration = open ? 0.3 : 0.05;
    gain.gain.setValueAtTime(velocity * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    noise.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration + 0.01);
  }

  playBass(time, velocity = 1.0, pitch = 80) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(pitch * 2, time);
    osc.frequency.exponentialRampToValueAtTime(pitch, time + 0.02);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.8, time + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.15);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(velocity * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  setMasterVolume(volume) {
    this.masterGain.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.audioContext.currentTime
    );
  }

  disconnect() {
    this.masterGain.disconnect();
  }
}

export default DrumMachineEngine;
