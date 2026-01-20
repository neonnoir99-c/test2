/**
 * Audio Diagnostic Tool for Drum Machine
 * Run this in browser console to diagnose audio issues
 * 
 * Usage: Copy and paste into browser console, then call:
 *   - runFullDiagnostic()
 *   - testAudioContext()
 *   - testBasicSound()
 */

class AudioDiagnosticTool {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const prefix = {
      info: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    }[type] || 'ℹ️';
    
    const logMessage = `[${timestamp}] ${prefix} ${message}`;
    console.log(logMessage);
    
    this.results.push({ timestamp, type, message });
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
  }

  /**
   * Test 1: Check if Web Audio API is supported
   */
  testWebAudioSupport() {
    this.log('TEST 1: Web Audio API Support', 'test');
    
    if (window.AudioContext || window.webkitAudioContext) {
      this.log('Web Audio API is supported', 'info');
      return true;
    } else {
      this.log('Web Audio API is NOT supported in this browser', 'error');
      return false;
    }
  }

  /**
   * Test 2: Create and inspect AudioContext
   */
  async testAudioContext() {
    this.log('TEST 2: AudioContext Creation and State', 'test');
    
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      this.log(`AudioContext created successfully`, 'info');
      this.log(`  - State: ${ctx.state}`, 'info');
      this.log(`  - Sample Rate: ${ctx.sampleRate} Hz`, 'info');
      this.log(`  - Current Time: ${ctx.currentTime.toFixed(3)}s`, 'info');
      this.log(`  - Base Latency: ${(ctx.baseLatency * 1000).toFixed(2)}ms`, 'info');
      
      // Check state
      if (ctx.state === 'suspended') {
        this.log('AudioContext is SUSPENDED - this is likely the problem!', 'error');
        this.log('Attempting to resume...', 'info');
        
        await ctx.resume();
        
        if (ctx.state === 'running') {
          this.log('Successfully resumed AudioContext', 'info');
        } else {
          this.log(`Failed to resume. State: ${ctx.state}`, 'error');
        }
      } else if (ctx.state === 'running') {
        this.log('AudioContext is RUNNING - good!', 'info');
      } else {
        this.log(`AudioContext state is ${ctx.state} - unexpected!`, 'warning');
      }
      
      // Check destination
      if (ctx.destination) {
        this.log(`Destination available: ${ctx.destination.maxChannelCount} channels`, 'info');
      } else {
        this.log('Destination is NOT available', 'error');
      }
      
      return ctx;
    } catch (error) {
      this.log(`Failed to create AudioContext: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Test 3: Play a simple test tone
   */
  async testBasicSound(ctx = null) {
    this.log('TEST 3: Basic Sound Playback', 'test');
    
    try {
      // Create context if not provided
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        await ctx.resume();
      }
      
      // Verify state
      if (ctx.state !== 'running') {
        this.log(`Cannot play sound: AudioContext state is ${ctx.state}`, 'error');
        return false;
      }
      
      this.log('Creating test tone (440Hz for 0.5s)...', 'info');
      
      // Create oscillator and gain
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const startTime = ctx.currentTime;
      osc.start(startTime);
      osc.stop(startTime + 0.5);
      
      this.log(`Test tone scheduled at ${startTime.toFixed(3)}s`, 'info');
      this.log('If you heard a beep, audio is working!', 'info');
      
      return true;
    } catch (error) {
      this.log(`Failed to play test tone: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 4: Inspect existing drum machine instance
   */
  testDrumMachineInstance() {
    this.log('TEST 4: Drum Machine Instance Inspection', 'test');
    
    // Try to find drum machine instance
    const drumMachine = window.drumMachine || window.getDrumMachine?.();
    
    if (!drumMachine) {
      this.log('No drum machine instance found (window.drumMachine)', 'warning');
      this.log('Try initializing the drum machine first', 'info');
      return null;
    }
    
    this.log('Drum machine instance found', 'info');
    
    // Check AudioContext
    if (drumMachine.audioContext) {
      this.log(`  - AudioContext state: ${drumMachine.audioContext.state}`, 'info');
      this.log(`  - Sample rate: ${drumMachine.audioContext.sampleRate} Hz`, 'info');
      this.log(`  - Current time: ${drumMachine.audioContext.currentTime.toFixed(3)}s`, 'info');
      
      if (drumMachine.audioContext.state !== 'running') {
        this.log('  - AudioContext is NOT running!', 'error');
      }
    } else {
      this.log('  - AudioContext is NULL', 'error');
    }
    
    // Check drums (synthesizers)
    if (drumMachine.drums) {
      this.log('  - DrumSynthesizers instance exists', 'info');
      
      if (drumMachine.drums.masterGain) {
        this.log(`  - Master gain value: ${drumMachine.drums.masterGain.gain.value}`, 'info');
        this.log(`  - Master gain outputs: ${drumMachine.drums.masterGain.numberOfOutputs}`, 'info');
      } else {
        this.log('  - Master gain is NULL', 'error');
      }
    } else {
      this.log('  - DrumSynthesizers instance is NULL', 'error');
    }
    
    // Check scheduler
    if (drumMachine.scheduler) {
      this.log(`  - Scheduler playing: ${drumMachine.scheduler.isPlaying}`, 'info');
      this.log(`  - BPM: ${drumMachine.scheduler.getBPM()}`, 'info');
    } else {
      this.log('  - Scheduler is NULL', 'error');
    }
    
    // Check pattern
    if (drumMachine.pattern) {
      const activeSteps = {
        kick: drumMachine.pattern.kick.filter(Boolean).length,
        snare: drumMachine.pattern.snare.filter(Boolean).length,
        hihat: drumMachine.pattern.hihat.filter(Boolean).length,
        bass: drumMachine.pattern.bass.filter(Boolean).length
      };
      
      this.log(`  - Active steps: Kick=${activeSteps.kick}, Snare=${activeSteps.snare}, HiHat=${activeSteps.hihat}, Bass=${activeSteps.bass}`, 'info');
      
      const totalActive = Object.values(activeSteps).reduce((a, b) => a + b, 0);
      if (totalActive === 0) {
        this.log('  - No active steps in pattern!', 'warning');
      }
    }
    
    return drumMachine;
  }

  /**
   * Test 5: Test drum sounds directly
   */
  async testDrumSounds(drumMachine = null) {
    this.log('TEST 5: Individual Drum Sound Test', 'test');
    
    if (!drumMachine) {
      drumMachine = window.drumMachine || window.getDrumMachine?.();
    }
    
    if (!drumMachine || !drumMachine.drums || !drumMachine.audioContext) {
      this.log('Cannot test drum sounds: drum machine not properly initialized', 'error');
      return false;
    }
    
    const ctx = drumMachine.audioContext;
    
    if (ctx.state !== 'running') {
      this.log('Resuming AudioContext...', 'info');
      await ctx.resume();
    }
    
    const drums = drumMachine.drums;
    const time = ctx.currentTime + 0.1;
    
    try {
      this.log('Playing kick drum...', 'info');
      drums.playKick(time, 0.8);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.log('Playing snare drum...', 'info');
      drums.playSnare(time + 0.3, 0.8);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.log('Playing hi-hat...', 'info');
      drums.playHiHat(time + 0.6, 0.8, false);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.log('Playing bass...', 'info');
      drums.playBass(time + 0.9, 0.8, 80);
      
      this.log('If you heard 4 sounds, drum synthesis is working!', 'info');
      return true;
    } catch (error) {
      this.log(`Failed to play drum sounds: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 6: Check timing and scheduling
   */
  testScheduling(drumMachine = null) {
    this.log('TEST 6: Scheduling and Timing', 'test');
    
    if (!drumMachine) {
      drumMachine = window.drumMachine || window.getDrumMachine?.();
    }
    
    if (!drumMachine || !drumMachine.audioContext) {
      this.log('Cannot test scheduling: drum machine not initialized', 'error');
      return false;
    }
    
    const ctx = drumMachine.audioContext;
    const scheduler = drumMachine.scheduler;
    
    this.log(`Current time: ${ctx.currentTime.toFixed(3)}s`, 'info');
    
    if (scheduler) {
      this.log(`Next note time: ${scheduler.nextNoteTime?.toFixed(3)}s`, 'info');
      this.log(`Current step: ${scheduler.currentStep}`, 'info');
      this.log(`Schedule ahead: ${scheduler.scheduleAheadTime}s`, 'info');
      this.log(`Look ahead: ${scheduler.lookahead}ms`, 'info');
      
      // Check if scheduling time is valid
      if (scheduler.nextNoteTime && scheduler.nextNoteTime < ctx.currentTime) {
        this.log('WARNING: Next note time is in the past!', 'error');
        this.log(`  Delta: ${(scheduler.nextNoteTime - ctx.currentTime).toFixed(3)}s`, 'error');
      }
    }
    
    return true;
  }

  /**
   * Generate diagnostic report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSTIC REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Successful checks: ${this.results.filter(r => r.type === 'info').length}`);
    console.log(`❌ Errors found: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Provide recommendations
    if (this.errors.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      
      if (this.errors.some(e => e.includes('SUSPENDED'))) {
        console.log('  1. AudioContext is suspended - call await audioContext.resume()');
      }
      
      if (this.errors.some(e => e.includes('NULL'))) {
        console.log('  2. Some components not initialized - check initialization flow');
      }
      
      if (this.errors.some(e => e.includes('past'))) {
        console.log('  3. Timing issue detected - verify scheduling logic');
      }
    } else {
      console.log('\n✅ No critical errors found!');
      console.log('If you still have no sound, check:');
      console.log('  1. System volume is not muted');
      console.log('  2. Browser tab is not muted');
      console.log('  3. Pattern has active steps');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Run full diagnostic suite
   */
  async runFullDiagnostic() {
    console.clear();
    console.log('🔍 Starting Audio Diagnostic...\n');
    
    // Test 1: Web Audio Support
    if (!this.testWebAudioSupport()) {
      this.generateReport();
      return;
    }
    
    // Test 2: AudioContext
    const ctx = await this.testAudioContext();
    if (!ctx) {
      this.generateReport();
      return;
    }
    
    // Test 3: Basic Sound
    await this.testBasicSound(ctx);
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Drum Machine Instance
    const drumMachine = this.testDrumMachineInstance();
    
    // Test 5: Drum Sounds (if instance available)
    if (drumMachine) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.testDrumSounds(drumMachine);
      
      // Test 6: Scheduling
      this.testScheduling(drumMachine);
    }
    
    // Generate report
    this.generateReport();
    
    // Return results for programmatic access
    return {
      errors: this.errors,
      warnings: this.warnings,
      results: this.results
    };
  }
}

// Create global instance
window.audioDiagnostic = new AudioDiagnosticTool();

// Convenience functions
window.runFullDiagnostic = () => window.audioDiagnostic.runFullDiagnostic();
window.testAudioContext = () => window.audioDiagnostic.testAudioContext();
window.testBasicSound = () => window.audioDiagnostic.testBasicSound();
window.testDrumMachine = () => window.audioDiagnostic.testDrumMachineInstance();
window.testDrumSounds = () => window.audioDiagnostic.testDrumSounds();

console.log('🔧 Audio Diagnostic Tool Loaded!');
console.log('Run: runFullDiagnostic() to start complete diagnostic');
console.log('Or use individual tests:');
console.log('  - testAudioContext()');
console.log('  - testBasicSound()');
console.log('  - testDrumMachine()');
console.log('  - testDrumSounds()');
