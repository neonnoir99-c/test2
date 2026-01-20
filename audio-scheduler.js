/**
 * Web Audio API Scheduler Architecture
 * Provides precise 120 BPM timing using AudioContext scheduling
 * 
 * Key Design Principles:
 * 1. Use AudioContext.currentTime for sample-accurate scheduling
 * 2. Look-ahead scheduling to prevent timing drift
 * 3. Separate scheduling logic from visual updates
 * 4. Queue-based system for future note scheduling
 */

class AudioScheduler {
  constructor(bpm = 120, stepsPerBeat = 4) {
    // Audio Context - the foundation of Web Audio API
    this.audioContext = null;
    
    // Timing Configuration
    this.bpm = bpm;
    this.stepsPerBeat = stepsPerBeat; // 16th notes (4 steps per quarter note)
    this.totalSteps = 16; // 16-step sequencer
    this.currentStep = 0;
    
    // Scheduling Parameters
    this.scheduleAheadTime = 0.1; // How far ahead to schedule (100ms)
    this.lookahead = 25.0; // How frequently to call scheduling function (ms)
    this.nextNoteTime = 0.0; // When the next note is due
    
    // Playback State
    this.isPlaying = false;
    this.timerID = null;
    
    // Callbacks
    this.onStepCallback = null; // Called when a step should be triggered
    this.onVisualUpdateCallback = null; // Called for UI updates (separate from audio)
    
    // Note Queue (for visual synchronization)
    this.noteQueue = [];
  }

  /**
   * Initialize AudioContext (must be called after user interaction)
   */
  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
    return this.audioContext;
  }

  /**
   * Calculate the time interval for each step based on BPM
   * @returns {number} Duration of one step in seconds
   */
  getStepDuration() {
    // BPM = beats per minute (quarter notes)
    // 120 BPM = 120 quarter notes per minute = 2 quarter notes per second
    // Each quarter note = 4 sixteenth notes
    // So: (60 / BPM) / stepsPerBeat
    return (60.0 / this.bpm) / this.stepsPerBeat;
  }

  /**
   * Schedule a single step
   * This is where the magic happens - scheduling in AudioContext time
   */
  scheduleStep(stepNumber, time) {
    // Add to queue for visual updates
    this.noteQueue.push({
      step: stepNumber,
      time: time
    });

    // Trigger the step callback with the precise time
    if (this.onStepCallback) {
      this.onStepCallback(stepNumber, time);
    }
  }

  /**
   * Advance to the next step
   */
  nextStep() {
    const stepDuration = this.getStepDuration();
    
    // Advance current note time
    this.nextNoteTime += stepDuration;
    
    // Advance step counter (wrap around at totalSteps)
    this.currentStep = (this.currentStep + 1) % this.totalSteps;
  }

  /**
   * Core scheduling loop - looks ahead and schedules notes
   * This runs frequently but only schedules notes that are due soon
   */
  scheduler() {
    // Schedule all notes that need to play before the next interval
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.nextStep();
    }
    
    // Continue the loop if playing
    if (this.isPlaying) {
      this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }
  }

  /**
   * Visual update loop - separate from audio scheduling
   * Checks the note queue and triggers visual updates at the right time
   */
  updateVisuals() {
    const currentTime = this.audioContext.currentTime;
    
    // Process all notes that should be displayed now
    while (this.noteQueue.length && this.noteQueue[0].time < currentTime + 0.05) {
      const note = this.noteQueue.shift();
      
      if (this.onVisualUpdateCallback) {
        this.onVisualUpdateCallback(note.step, note.time);
      }
    }
    
    // Continue visual updates if playing
    if (this.isPlaying) {
      requestAnimationFrame(() => this.updateVisuals());
    }
  }

  /**
   * Start playback
   */
  async start() {
    if (this.isPlaying) return;
    
    // Ensure AudioContext is initialized
    await this.initialize();
    
    // Reset state
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.005; // Start almost immediately
    this.noteQueue = [];
    
    // Start both loops
    this.scheduler(); // Audio scheduling loop
    this.updateVisuals(); // Visual update loop
    
    console.log('Scheduler started at', this.audioContext.currentTime);
  }

  /**
   * Stop playback
   */
  stop() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
    
    // Clear the queue
    this.noteQueue = [];
    
    console.log('Scheduler stopped');
  }

  /**
   * Toggle playback
   */
  async toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      await this.start();
    }
  }

  /**
   * Set BPM (tempo)
   */
  setBPM(bpm) {
    this.bpm = Math.max(20, Math.min(300, bpm)); // Clamp between 20-300 BPM
  }

  /**
   * Get current BPM
   */
  getBPM() {
    return this.bpm;
  }

  /**
   * Register callback for step triggers (audio scheduling)
   * @param {Function} callback - Function(stepNumber, time)
   */
  onStep(callback) {
    this.onStepCallback = callback;
  }

  /**
   * Register callback for visual updates
   * @param {Function} callback - Function(stepNumber, time)
   */
  onVisualUpdate(callback) {
    this.onVisualUpdateCallback = callback;
  }

  /**
   * Get the AudioContext instance
   */
  getAudioContext() {
    return this.audioContext;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export default AudioScheduler;
