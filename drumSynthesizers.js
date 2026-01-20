/**
 * Drum Sound Synthesizers using Web Audio API
 * Creates kick, snare, hi-hat, and bass sounds using oscillators and noise buffers
 */

class DrumSynthesizers {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.audioContext.destination);
  }

  /**
   * Creates a noise buffer for snare and hi-hat sounds
   * @param {number} duration - Duration in seconds
   * @returns {AudioBuffer}
   */
  createNoiseBuffer(duration = 0.5) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const output = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * Synthesizes a kick drum sound
   * Uses a pitched oscillator with frequency sweep and amplitude envelope
   * @param {number} time - When to play the sound (in AudioContext time)
   * @param {number} velocity - Volume (0-1)
   */
  playKick(time, velocity = 1.0) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Oscillator setup - sine wave for deep bass
    osc.type = 'sine';
    
    // Frequency sweep: 150Hz -> 40Hz for that punchy kick sound
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);

    // Low-pass filter for warmth
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);
    filter.Q.value = 1;

    // Amplitude envelope - quick attack, medium decay
    gain.gain.setValueAtTime(velocity * 1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    // Connect the chain
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Schedule playback
    osc.start(time);
    osc.stop(time + 0.5);

    return { osc, gain, filter };
  }

  /**
   * Synthesizes a snare drum sound
   * Combines a tonal component with noise for realistic snare character
   * @param {number} time - When to play the sound (in AudioContext time)
   * @param {number} velocity - Volume (0-1)
   */
  playSnare(time, velocity = 1.0) {
    // Tonal component (snare body)
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();

    osc1.type = 'triangle';
    osc2.type = 'triangle';
    
    // Two detuned oscillators for a fuller sound
    osc1.frequency.setValueAtTime(180, time);
    osc2.frequency.setValueAtTime(330, time);

    // Tonal envelope - short and snappy
    oscGain.gain.setValueAtTime(velocity * 0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc1.connect(oscGain);
    osc2.connect(oscGain);

    // Noise component (snare rattle)
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

    // Mix tonal and noise components
    const mixGain = this.audioContext.createGain();
    mixGain.gain.value = 1.0;
    
    oscGain.connect(mixGain);
    noiseGain.connect(mixGain);
    mixGain.connect(this.masterGain);

    // Schedule playback
    osc1.start(time);
    osc1.stop(time + 0.1);
    osc2.start(time);
    osc2.stop(time + 0.1);
    noise.start(time);
    noise.stop(time + 0.15);

    return { osc1, osc2, noise, oscGain, noiseGain, mixGain };
  }

  /**
   * Synthesizes a hi-hat sound
   * Uses filtered noise with tight envelope for metallic character
   * @param {number} time - When to play the sound (in AudioContext time)
   * @param {number} velocity - Volume (0-1)
   * @param {boolean} open - Whether to play open (longer) or closed hi-hat
   */
  playHiHat(time, velocity = 1.0, open = false) {
    const noiseBuffer = this.createNoiseBuffer(0.3);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // High-pass filter for metallic character
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 7000;
    highpass.Q.value = 1;

    // Band-pass filter for shaping
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    bandpass.Q.value = 0.5;

    const gain = this.audioContext.createGain();
    
    // Different envelope for open vs closed hi-hat
    const duration = open ? 0.3 : 0.05;
    gain.gain.setValueAtTime(velocity * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    // Connect the chain
    noise.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    // Schedule playback
    noise.start(time);
    noise.stop(time + duration + 0.01);

    return { noise, highpass, bandpass, gain };
  }

  /**
   * Synthesizes a bass drum/tom sound
   * Lower-pitched alternative to kick, useful for basslines
   * @param {number} time - When to play the sound (in AudioContext time)
   * @param {number} velocity - Volume (0-1)
   * @param {number} pitch - Base frequency (default 80Hz)
   */
  playBass(time, velocity = 1.0, pitch = 80) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Square wave for more harmonics
    osc.type = 'square';
    
    // Frequency sweep for punch
    osc.frequency.setValueAtTime(pitch * 2, time);
    osc.frequency.exponentialRampToValueAtTime(pitch, time + 0.02);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.8, time + 0.1);

    // Low-pass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.15);
    filter.Q.value = 2;

    // Amplitude envelope
    gain.gain.setValueAtTime(velocity * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    // Connect the chain
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Schedule playback
    osc.start(time);
    osc.stop(time + 0.3);

    return { osc, gain, filter };
  }

  /**
   * Sets the master volume for all drum sounds
   * @param {number} volume - Volume level (0-1)
   */
  setMasterVolume(volume) {
    this.masterGain.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.audioContext.currentTime
    );
  }

  /**
   * Gets the master gain node for connecting to external effects
   * @returns {GainNode}
   */
  getMasterGain() {
    return this.masterGain;
  }

  /**
   * Disconnects the master gain (cleanup)
   */
  disconnect() {
    this.masterGain.disconnect();
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DrumSynthesizers;
}
