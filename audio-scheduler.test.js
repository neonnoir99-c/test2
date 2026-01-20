/**
 * Unit Tests for AudioScheduler
 * Tests timing accuracy, scheduling logic, and edge cases
 */

import AudioScheduler from './audio-scheduler.js';

// Mock AudioContext for testing
class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.sampleRate = 48000;
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// Test Suite
class SchedulerTests {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async runAll() {
    console.log('🧪 Running AudioScheduler Tests...\n');

    await this.testInitialization();
    await this.testBPMCalculations();
    await this.testStepDuration();
    await this.testScheduling();
    await this.testPlaybackControl();
    await this.testCallbacks();
    await this.testBPMChanges();
    await this.testEdgeCases();

    this.printResults();
  }

  assert(condition, testName, message = '') {
    if (condition) {
      this.passed++;
      console.log(`✅ ${testName}`);
    } else {
      this.failed++;
      console.log(`❌ ${testName}`);
      if (message) console.log(`   ${message}`);
    }
    this.tests.push({ name: testName, passed: condition });
  }

  async testInitialization() {
    console.log('\n📦 Initialization Tests');
    console.log('─'.repeat(50));

    // Test 1: Constructor
    const scheduler = new AudioScheduler(120, 4);
    this.assert(
      scheduler.bpm === 120,
      'Constructor sets BPM correctly'
    );

    this.assert(
      scheduler.stepsPerBeat === 4,
      'Constructor sets stepsPerBeat correctly'
    );

    this.assert(
      scheduler.totalSteps === 16,
      'Constructor sets totalSteps correctly'
    );

    this.assert(
      scheduler.isPlaying === false,
      'Initial playback state is stopped'
    );

    // Test 2: Initialize method
    global.AudioContext = MockAudioContext;
    await scheduler.initialize();
    
    this.assert(
      scheduler.audioContext !== null,
      'Initialize creates AudioContext'
    );

    this.assert(
      scheduler.audioContext.state === 'running',
      'AudioContext is in running state'
    );
  }

  async testBPMCalculations() {
    console.log('\n🎵 BPM Calculation Tests');
    console.log('─'.repeat(50));

    const scheduler = new AudioScheduler(120, 4);

    // Test step duration at 120 BPM
    const duration120 = scheduler.getStepDuration();
    const expected120 = (60.0 / 120) / 4; // 0.125 seconds
    this.assert(
      Math.abs(duration120 - expected120) < 0.0001,
      `120 BPM step duration is ${expected120}s (got ${duration120}s)`
    );

    // Test step duration at 140 BPM
    scheduler.setBPM(140);
    const duration140 = scheduler.getStepDuration();
    const expected140 = (60.0 / 140) / 4; // ~0.107 seconds
    this.assert(
      Math.abs(duration140 - expected140) < 0.0001,
      `140 BPM step duration is ${expected140.toFixed(4)}s (got ${duration140.toFixed(4)}s)`
    );

    // Test step duration at 60 BPM
    scheduler.setBPM(60);
    const duration60 = scheduler.getStepDuration();
    const expected60 = (60.0 / 60) / 4; // 0.25 seconds
    this.assert(
      Math.abs(duration60 - expected60) < 0.0001,
      `60 BPM step duration is ${expected60}s (got ${duration60}s)`
    );
  }

  async testStepDuration() {
    console.log('\n⏱️  Step Duration Tests');
    console.log('─'.repeat(50));

    const testCases = [
      { bpm: 120, expected: 0.125 },
      { bpm: 140, expected: 0.107142857 },
      { bpm: 100, expected: 0.15 },
      { bpm: 80, expected: 0.1875 },
      { bpm: 180, expected: 0.083333333 }
    ];

    testCases.forEach(({ bpm, expected }) => {
      const scheduler = new AudioScheduler(bpm, 4);
      const actual = scheduler.getStepDuration();
      const isCorrect = Math.abs(actual - expected) < 0.0001;
      this.assert(
        isCorrect,
        `${bpm} BPM = ${expected.toFixed(4)}s per step`,
        isCorrect ? '' : `Expected ${expected}, got ${actual}`
      );
    });
  }

  async testScheduling() {
    console.log('\n📅 Scheduling Logic Tests');
    console.log('─'.repeat(50));

    global.AudioContext = MockAudioContext;
    const scheduler = new AudioScheduler(120, 4);
    await scheduler.initialize();

    // Test step advancement
    const initialStep = scheduler.currentStep;
    scheduler.nextStep();
    this.assert(
      scheduler.currentStep === (initialStep + 1) % 16,
      'nextStep() advances step counter'
    );

    // Test wrap-around
    scheduler.currentStep = 15;
    scheduler.nextStep();
    this.assert(
      scheduler.currentStep === 0,
      'Step counter wraps around at 16'
    );

    // Test note queue
    const scheduledSteps = [];
    scheduler.onStep((step, time) => {
      scheduledSteps.push({ step, time });
    });

    scheduler.scheduleStep(5, 1.5);
    this.assert(
      scheduledSteps.length === 1,
      'scheduleStep() triggers callback'
    );

    this.assert(
      scheduledSteps[0].step === 5 && scheduledSteps[0].time === 1.5,
      'Callback receives correct step and time'
    );
  }

  async testPlaybackControl() {
    console.log('\n▶️  Playback Control Tests');
    console.log('─'.repeat(50));

    global.AudioContext = MockAudioContext;
    const scheduler = new AudioScheduler(120, 4);

    // Test start
    await scheduler.start();
    this.assert(
      scheduler.isPlaying === true,
      'start() sets isPlaying to true'
    );

    this.assert(
      scheduler.timerID !== null,
      'start() creates timer'
    );

    // Test stop
    scheduler.stop();
    this.assert(
      scheduler.isPlaying === false,
      'stop() sets isPlaying to false'
    );

    this.assert(
      scheduler.timerID === null,
      'stop() clears timer'
    );

    // Test toggle
    await scheduler.toggle();
    this.assert(
      scheduler.isPlaying === true,
      'toggle() starts when stopped'
    );

    await scheduler.toggle();
    this.assert(
      scheduler.isPlaying === false,
      'toggle() stops when playing'
    );
  }

  async testCallbacks() {
    console.log('\n🔔 Callback Tests');
    console.log('─'.repeat(50));

    global.AudioContext = MockAudioContext;
    const scheduler = new AudioScheduler(120, 4);

    // Test onStep callback
    let stepCallbackCalled = false;
    let receivedStep = null;
    let receivedTime = null;

    scheduler.onStep((step, time) => {
      stepCallbackCalled = true;
      receivedStep = step;
      receivedTime = time;
    });

    scheduler.scheduleStep(7, 2.5);
    this.assert(
      stepCallbackCalled === true,
      'onStep callback is invoked'
    );

    this.assert(
      receivedStep === 7,
      'onStep receives correct step number'
    );

    this.assert(
      receivedTime === 2.5,
      'onStep receives correct time'
    );

    // Test onVisualUpdate callback
    let visualCallbackCalled = false;
    scheduler.onVisualUpdate((step, time) => {
      visualCallbackCalled = true;
    });

    scheduler.scheduleStep(8, 3.0);
    this.assert(
      visualCallbackCalled === false,
      'onVisualUpdate is not called during scheduleStep (only in updateVisuals loop)'
    );
  }

  async testBPMChanges() {
    console.log('\n🎚️  BPM Change Tests');
    console.log('─'.repeat(50));

    const scheduler = new AudioScheduler(120, 4);

    // Test valid BPM change
    scheduler.setBPM(140);
    this.assert(
      scheduler.getBPM() === 140,
      'setBPM() updates BPM'
    );

    // Test BPM clamping (too low)
    scheduler.setBPM(10);
    this.assert(
      scheduler.getBPM() === 20,
      'setBPM() clamps minimum to 20 BPM'
    );

    // Test BPM clamping (too high)
    scheduler.setBPM(500);
    this.assert(
      scheduler.getBPM() === 300,
      'setBPM() clamps maximum to 300 BPM'
    );

    // Test BPM affects step duration
    scheduler.setBPM(120);
    const duration120 = scheduler.getStepDuration();
    scheduler.setBPM(240);
    const duration240 = scheduler.getStepDuration();
    
    this.assert(
      Math.abs(duration240 - duration120 / 2) < 0.0001,
      'Doubling BPM halves step duration'
    );
  }

  async testEdgeCases() {
    console.log('\n🔍 Edge Case Tests');
    console.log('─'.repeat(50));

    global.AudioContext = MockAudioContext;

    // Test multiple initializations
    const scheduler = new AudioScheduler(120, 4);
    await scheduler.initialize();
    const ctx1 = scheduler.getAudioContext();
    await scheduler.initialize();
    const ctx2 = scheduler.getAudioContext();
    this.assert(
      ctx1 === ctx2,
      'Multiple initialize() calls reuse same AudioContext'
    );

    // Test stop when not playing
    scheduler.stop();
    scheduler.stop(); // Should not throw
    this.assert(
      true,
      'stop() when already stopped does not throw'
    );

    // Test start when already playing
    await scheduler.start();
    await scheduler.start(); // Should not create multiple timers
    this.assert(
      scheduler.timerID !== null,
      'start() when already playing does not break state'
    );
    scheduler.stop();

    // Test destroy
    scheduler.destroy();
    this.assert(
      scheduler.audioContext === null,
      'destroy() closes AudioContext'
    );

    this.assert(
      scheduler.isPlaying === false,
      'destroy() stops playback'
    );

    // Test note queue clearing
    const scheduler2 = new AudioScheduler(120, 4);
    await scheduler2.initialize();
    scheduler2.noteQueue = [1, 2, 3, 4, 5];
    scheduler2.stop();
    this.assert(
      scheduler2.noteQueue.length === 0,
      'stop() clears note queue'
    );
  }

  printResults() {
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Test Results');
    console.log('═'.repeat(50));
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total:  ${this.passed + this.failed}`);
    console.log(`🎯 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    console.log('═'.repeat(50));

    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! Scheduler is ready for production.');
    } else {
      console.log(`\n⚠️  ${this.failed} test(s) failed. Review implementation.`);
    }
  }
}

// Run tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SchedulerTests;
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    const tests = new SchedulerTests();
    await tests.runAll();
  });
}

// For Node.js testing
if (typeof process !== 'undefined' && process.argv[1] === import.meta.url) {
  const tests = new SchedulerTests();
  tests.runAll().then(() => {
    process.exit(tests.failed > 0 ? 1 : 0);
  });
}
