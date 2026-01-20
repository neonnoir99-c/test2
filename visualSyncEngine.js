/**
 * Visual Sync Engine
 * High-performance step highlighting synchronized with audio playback
 * Uses requestAnimationFrame for smooth 60fps updates without blocking audio
 * 
 * Key Features:
 * - Decoupled from audio timing (no UI lag affects audio)
 * - Efficient DOM updates using CSS classes
 * - Batch updates to minimize reflows
 * - Predictive highlighting for smooth visuals
 * - Supports multiple visual feedback modes
 */

class VisualSyncEngine {
  constructor(drumMachineEngine) {
    this.engine = drumMachineEngine;
    this.gridElements = {
      kick: [],
      snare: [],
      hihat: [],
      bass: []
    };
    
    // Visual state
    this.currentStep = -1;
    this.previousStep = -1;
    this.isRunning = false;
    this.animationFrameId = null;
    
    // Performance optimization
    this.lastUpdateTime = 0;
    this.updateThrottle = 8; // ~120fps max (faster than 60fps display)
    this.batchedUpdates = [];
    
    // Visual feedback modes
    this.feedbackMode = 'highlight'; // 'highlight', 'pulse', 'glow', 'minimal'
    this.showActiveNotes = true;
    this.showBeatMarkers = true;
    
    // Callbacks
    this.onStepChange = null;
    this.onBeatChange = null;
    
    // Bind to audio engine events
    this._bindEngineEvents();
  }

  /**
   * Initialize and register grid elements
   * @param {Object} gridElements - Object with arrays of DOM elements for each track
   */
  initialize(gridElements) {
    this.gridElements = gridElements;
    this._validateGridElements();
    this._applyInitialStyles();
    console.log('✅ Visual Sync Engine initialized');
  }

  /**
   * Register individual grid cell
   * @param {string} track - Track name (kick, snare, hihat, bass)
   * @param {number} step - Step index (0-15)
   * @param {HTMLElement} element - DOM element
   */
  registerCell(track, step, element) {
    if (!this.gridElements[track]) {
      this.gridElements[track] = [];
    }
    this.gridElements[track][step] = element;
    
    // Add data attributes for easy querying
    element.dataset.track = track;
    element.dataset.step = step;
  }

  /**
   * Start visual sync loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.currentStep = -1;
    this.previousStep = -1;
    this._startVisualLoop();
    console.log('▶️ Visual sync started');
  }

  /**
   * Stop visual sync loop
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this._clearAllHighlights();
    console.log('⏹️ Visual sync stopped');
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.stop();
    this.currentStep = -1;
    this.previousStep = -1;
  }

  /**
   * Set visual feedback mode
   * @param {string} mode - 'highlight', 'pulse', 'glow', 'minimal'
   */
  setFeedbackMode(mode) {
    const validModes = ['highlight', 'pulse', 'glow', 'minimal'];
    if (!validModes.includes(mode)) {
      console.warn(`Invalid feedback mode: ${mode}`);
      return;
    }
    
    this.feedbackMode = mode;
    this._updateStylesheet();
  }

  /**
   * Toggle active note indicators
   */
  toggleActiveNotes(show) {
    this.showActiveNotes = show;
    this._refreshActiveNotes();
  }

  /**
   * Toggle beat markers
   */
  toggleBeatMarkers(show) {
    this.showBeatMarkers = show;
    this._refreshBeatMarkers();
  }

  /**
   * Main visual update loop (runs at 60fps via requestAnimationFrame)
   * @private
   */
  _startVisualLoop() {
    const update = (timestamp) => {
      if (!this.isRunning) return;

      // Throttle updates (though RAF already limits to ~60fps)
      if (timestamp - this.lastUpdateTime >= this.updateThrottle) {
        this._updateVisuals();
        this.lastUpdateTime = timestamp;
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Update visual state based on audio engine
   * @private
   */
  _updateVisuals() {
    if (!this.engine || !this.engine.isPlaying) {
      return;
    }

    // Get current step from audio engine
    const audioStep = this.engine.currentStep;

    // Only update if step changed
    if (audioStep !== this.currentStep) {
      this.previousStep = this.currentStep;
      this.currentStep = audioStep;

      // Batch DOM updates for performance
      this._batchUpdate(() => {
        // Remove highlight from previous step
        if (this.previousStep >= 0) {
          this._unhighlightStep(this.previousStep);
        }

        // Add highlight to current step
        if (this.currentStep >= 0) {
          this._highlightStep(this.currentStep);
        }

        // Trigger callbacks
        if (this.onStepChange) {
          this.onStepChange(this.currentStep, this.previousStep);
        }

        // Check for beat change (every 4 steps)
        if (this.currentStep % 4 === 0 && this.onBeatChange) {
          this.onBeatChange(Math.floor(this.currentStep / 4));
        }
      });
    }
  }

  /**
   * Highlight a specific step
   * @private
   */
  _highlightStep(step) {
    Object.keys(this.gridElements).forEach(track => {
      const element = this.gridElements[track][step];
      if (!element) return;

      // Add highlight class based on mode
      element.classList.add('step-playing');
      element.classList.add(`step-playing-${this.feedbackMode}`);

      // Add track-specific class for custom styling
      element.classList.add(`${track}-playing`);

      // Trigger active note animation if note is active
      if (this.showActiveNotes && this.engine.pattern[track][step]) {
        element.classList.add('note-active-playing');
      }
    });
  }

  /**
   * Remove highlight from a specific step
   * @private
   */
  _unhighlightStep(step) {
    Object.keys(this.gridElements).forEach(track => {
      const element = this.gridElements[track][step];
      if (!element) return;

      element.classList.remove('step-playing');
      element.classList.remove(`step-playing-${this.feedbackMode}`);
      element.classList.remove(`${track}-playing`);
      element.classList.remove('note-active-playing');
    });
  }

  /**
   * Clear all highlights
   * @private
   */
  _clearAllHighlights() {
    for (let step = 0; step < 16; step++) {
      this._unhighlightStep(step);
    }
  }

  /**
   * Batch DOM updates to minimize reflows
   * @private
   */
  _batchUpdate(updateFn) {
    // Use DocumentFragment for multiple updates if needed
    // For now, direct updates are fast enough with class toggles
    updateFn();
  }

  /**
   * Bind to audio engine events
   * @private
   */
  _bindEngineEvents() {
    if (!this.engine) return;

    // Listen for engine state changes
    const originalStart = this.engine.start?.bind(this.engine);
    const originalStop = this.engine.stop?.bind(this.engine);

    if (originalStart) {
      this.engine.start = async () => {
        await originalStart();
        this.start();
      };
    }

    if (originalStop) {
      this.engine.stop = () => {
        originalStop();
        this.stop();
      };
    }
  }

  /**
   * Validate grid elements structure
   * @private
   */
  _validateGridElements() {
    const requiredTracks = ['kick', 'snare', 'hihat', 'bass'];
    requiredTracks.forEach(track => {
      if (!this.gridElements[track] || this.gridElements[track].length !== 16) {
        console.warn(`⚠️ Track ${track} does not have 16 elements`);
      }
    });
  }

  /**
   * Apply initial styles to grid
   * @private
   */
  _applyInitialStyles() {
    // Add beat markers (every 4 steps)
    if (this.showBeatMarkers) {
      this._refreshBeatMarkers();
    }
  }

  /**
   * Refresh beat markers
   * @private
   */
  _refreshBeatMarkers() {
    Object.keys(this.gridElements).forEach(track => {
      this.gridElements[track].forEach((element, step) => {
        if (!element) return;
        
        if (this.showBeatMarkers && step % 4 === 0) {
          element.classList.add('beat-marker');
        } else {
          element.classList.remove('beat-marker');
        }
      });
    });
  }

  /**
   * Refresh active note indicators
   * @private
   */
  _refreshActiveNotes() {
    if (!this.engine) return;

    Object.keys(this.gridElements).forEach(track => {
      this.gridElements[track].forEach((element, step) => {
        if (!element) return;
        
        const isActive = this.engine.pattern[track][step];
        if (this.showActiveNotes && isActive) {
          element.classList.add('note-active');
        } else {
          element.classList.remove('note-active');
        }
      });
    });
  }

  /**
   * Update stylesheet for current mode
   * @private
   */
  _updateStylesheet() {
    // Stylesheet is injected separately
    // This method can trigger re-application if needed
    console.log(`Visual mode changed to: ${this.feedbackMode}`);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      isRunning: this.isRunning,
      currentStep: this.currentStep,
      feedbackMode: this.feedbackMode,
      updateThrottle: this.updateThrottle,
      registeredCells: Object.values(this.gridElements).flat().filter(Boolean).length
    };
  }
}

// Export for ES6 modules
export default VisualSyncEngine;

// Also support CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualSyncEngine;
}
