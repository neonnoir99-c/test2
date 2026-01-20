/**
 * Web Audio API Scheduler Architecture - FIXED VERSION
 * Provides precise 120 BPM timing using AudioContext scheduling
 * 
 * FIXES IMPLEMENTED:
 * ✅ AudioContext state verification before playback
 * ✅ Proper async/await handling with state polling
 * ✅ Time validation to prevent past scheduling
 * ✅ Comprehensive error handling
 * ✅ State monitoring and recovery
 * 
 * Key Design Principles:
 * 1. Use AudioContext.currentTime for sample-accurate scheduling
 * 2. Look-ahead scheduling to prevent timing drift
 * 3. Separate scheduling logic from visual updates
 * 4. Queue-based system for future note scheduling
 * 5. Always verify AudioContext state before audio operations
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
    this.onErrorCallback = null; // Called on errors
    
    // Note Queue (for visual synchronization)
    this.noteQueue = [];
    
    // State monitoring
    this.stateCheckInterval = null;
    this.initializationPromise = null;
  }

  /**
   * Initialize AudioContext (must be called after user interaction)
   * ✅ FIX: Proper async handling with state verification
   */
  async initialize() {
    // Return existing initialization if in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return existing context if already running
    if (this.audioContext && this.audioContext.state === 'running') {
      return this.audioContext;
    }

    this.initializationPromise = this._initializeInternal();
    
    try {
      await this.initializationPromise;
      return this.audioContext;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Internal initialization with comprehensive state management
   * ✅ FIX: Ensures AudioContext reaches 'running' state
   */
  async _initializeInternal() {
    try {
      // Create AudioContext if needed
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✅ AudioContext created:', {
          state: this.audioContext.state,
          sampleRate: this.audioContext.sampleRate,
          baseLatency: this.audioContext.baseLatency
        });
      }
      
      // ✅ CRITICAL FIX: Always verify and resume if needed
      if (this.audioContext.state !== 'running') {
        console.log(`⚠️ AudioContext state: ${this.audioContext.state}, attempting resume...`);
        
        await this.audioContext.resume();
        
        // ✅ FIX: Wait for state to change with timeout
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds max
        
        while (this.audioContext.state !== 'running' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
          
          if (attempts % 5 === 0) {
            console.log(`   Still waiting for AudioContext (${this.audioContext.state})...`);
          }
        }
        
        // Verify final state
        if (this.audioContext.state !== 'running') {
          throw new Error(
            `Failed to start AudioContext after ${attempts * 100}ms. ` +
            `Final state: ${this.audioContext.state}. ` +
            `This may be due to browser autoplay policy.`
          );
        }
        
        console.log('✅ AudioContext resumed successfully');
      }

      // Verify destination is available
      if (!this.audioContext.destination) {
        throw new Error('AudioContext destination not available');
      }

      console.log('✅ AudioContext fully initialized and running');
      return this.audioContext;
      
    } catch (error) {
      console.error('❌ Failed to initialize AudioContext:', error);
      
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      
      throw error;
    }
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
   * ✅ FIX: Added time validation to prevent past scheduling
   */
  scheduleStep(stepNumber, time) {
    // ✅ CRITICAL FIX: Validate time is in the future
    const currentTime = this.audioContext.currentTime;
    const minScheduleTime = currentTime + 0.001; // 1ms minimum buffer
    
    if (time < minScheduleTime) {
      console.warn(
        `⚠️ Step ${stepNumber} scheduled in past ` +
        `(${time.toFixed(3)}s < ${currentTime.toFixed(3)}s), adjusting to ${minScheduleTime.toFixed(3)}s`
      );
      time = minScheduleTime;
    }

    // Add to queue for visual updates
    this.noteQueue.push({
      step: stepNumber,
      time: time
    });

    // Trigger the step callback with the precise time
    if (this.onStepCallback) {
      try {
        this.onStepCallback(stepNumber, time);
      } catch (error) {
        console.error(`❌ Error in step callback for step ${stepNumber}:`, error);
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      }
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
   * ✅ FIX: Added state verification and error handling
   */
  scheduler() {
    try {
      // ✅ FIX: Verify AudioContext is still running
      if (this.audioContext.state !== 'running') {
        console.warn(`⚠️ AudioContext suspended during playback (state: ${this.audioContext.state})`);
        
        // Attempt to resume
        this.audioContext.resume().then(() => {
          if (this.audioContext.state === 'running') {
            console.log('✅ AudioContext resumed during playback');
          }
        }).catch(error => {
          console.error('❌ Failed to resume AudioContext:', error);
        });
        
        // Continue scheduling anyway (will work when resumed)
      }

      // Schedule all notes that need to play before the next interval
      while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
        this.scheduleStep(this.currentStep, this.nextNoteTime);
        this.nextStep();
      }
      
    } catch (error) {
      console.error('❌ Error in scheduler:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
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
    try {
      const currentTime = this.audioContext.currentTime;
      
      // Process all notes that should be displayed now
      while (this.noteQueue.length && this.noteQueue[0].time < currentTime + 0.05) {
        const note = this.noteQueue.shift();
        
        if (this.onVisualUpdateCallback) {
          try {
            this.onVisualUpdateCallback(note.step, note.time);
          } catch (error) {
            console.error('❌ Error in visual update callback:', error);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error in updateVisuals:', error);
    }
    
    // Continue visual updates if playing
    if (this.isPlaying) {
      requestAnimationFrame(() => this.updateVisuals());
    }
  }

  /**
   * Start playback
   * ✅ FIX: Comprehensive state verification before starting
   */
  async start() {
    if (this.isPlaying) {
      console.log('⚠️ Already playing, ignoring start request');
      return;
    }
    
    try {
      // ✅ CRITICAL FIX: Ensure AudioContext is initialized and running
      await this.initialize();
      
      // ✅ CRITICAL FIX: Double-check state before playback
      if (this.audioContext.state !== 'running') {
        console.log(`⚠️ AudioContext not running (${this.audioContext.state}), attempting resume...`);
        await this.audioContext.resume();
        
        // Wait for state change
        let attempts = 0;
        while (this.audioContext.state !== 'running' && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (this.audioContext.state !== 'running') {
          throw new Error(`Cannot start playback: AudioContext state is ${this.audioContext.state}`);
        }
      }
      
      // Verify destination
      if (!this.audioContext.destination) {
        throw new Error('AudioContext destination not available');
      }
      
      // Reset state
      this.isPlaying = true;
      this.currentStep = 0;
      this.nextNoteTime = this.audioContext.currentTime + 0.005; // Start almost immediately
      this.noteQueue = [];
      
      // Start both loops
      this.scheduler(); // Audio scheduling loop
      this.updateVisuals(); // Visual update loop
      
      // ✅ FIX: Monitor AudioContext state during playback
      this.startStateMonitoring();
      
      console.log(`✅ Scheduler started at ${this.audioContext.currentTime.toFixed(3)}s`, {
        bpm: this.bpm,
        stepDuration: this.getStepDuration().toFixed(4) + 's',
        contextState: this.audioContext.state
      });
      
    } catch (error) {
      console.error('❌ Failed to start scheduler:', error);
      this.isPlaying = false;
      
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      
      throw error;
    }
  }

  /**
   * Monitor AudioContext state during playback
   * ✅ FIX: Detect and handle state changes
   */
  startStateMonitoring() {
    if (this.stateCheckInterval) {
      clearInterval(this.stateCheckInterval);
    }

    this.stateCheckInterval = setInterval(() => {
      if (this.isPlaying && this.audioContext) {
        if (this.audioContext.state !== 'running') {
          console.warn(`⚠️ AudioContext suspended during playback, attempting resume...`);
          this.audioContext.resume().catch(error => {
            console.error('❌ Failed to auto-resume:', error);
          });
        }
      }
    }, 1000); // Check every second
  }

  /**
   * Stop state monitoring
   */
  stopStateMonitoring() {
    if (this.stateCheckInterval) {
      clearInterval(this.stateCheckInterval);
      this.stateCheckInterval = null;
    }
  }

  /**
   * Stop playback
   * ✅ FIX: Proper cleanup
   */
  stop() {
    if (!this.isPlaying) {
      console.log('⚠️ Not playing, ignoring stop request');
      return;
    }
    
    this.isPlaying = false;
    
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
    
    // Clear the queue
    this.noteQueue = [];
    
    // Stop state monitoring
    this.stopStateMonitoring();
    
    console.log('⏹️ Scheduler stopped');
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
    const oldBPM = this.bpm;
    this.bpm = Math.max(20, Math.min(300, bpm)); // Clamp between 20-300 BPM
    
    if (oldBPM !== this.bpm) {
      console.log(`🎵 BPM changed: ${oldBPM} → ${this.bpm}`);
    }
  }

  /**
   * Get current BPM
   */
  getBPM() {
    return this.bpm;
  }

  /**
   * Get AudioContext state
   * ✅ FIX: Added helper for state checking
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      contextState: this.audioContext?.state || 'not initialized',
      sampleRate: this.audioContext?.sampleRate,
      currentTime: this.audioContext?.currentTime,
      nextNoteTime: this.nextNoteTime,
      queueLength: this.noteQueue.length
    };
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
   * Register callback for errors
   * ✅ FIX: Added error callback
   * @param {Function} callback - Function(error)
   */
  onError(callback) {
    this.onErrorCallback = callback;
  }

  /**
   * Get the AudioContext instance
   */
  getAudioContext() {
    return this.audioContext;
  }

  /**
   * Clean up resources
   * ✅ FIX: Comprehensive cleanup
   */
  destroy() {
    console.log('🗑️ Destroying AudioScheduler...');
    
    this.stop();
    this.stopStateMonitoring();
    
    if (this.audioContext) {
      this.audioContext.close().then(() => {
        console.log('✅ AudioContext closed');
      }).catch(error => {
        console.error('❌ Error closing AudioContext:', error);
      });
      this.audioContext = null;
    }
    
    // Clear callbacks
    this.onStepCallback = null;
    this.onVisualUpdateCallback = null;
    this.onErrorCallback = null;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioScheduler;
}

export default AudioScheduler;
