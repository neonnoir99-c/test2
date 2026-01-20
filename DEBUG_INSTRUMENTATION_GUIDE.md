# 🔍 Audio Debug Instrumentation Guide

## Overview

This guide explains how to use the comprehensive debugging instrumentation system to monitor and verify the audio pipeline in your Web Audio API applications.

## 📦 What's Included

### 1. **audio-debug-logger.js** - Core Debug Module
A standalone debugging module that provides:
- ✅ AudioContext state monitoring and lifecycle tracking
- ✅ Scheduled event logging with timing validation
- ✅ Audio node creation and connection graph tracking
- ✅ Performance metrics and latency measurements
- ✅ Error and warning tracking
- ✅ Comprehensive reporting and export capabilities

### 2. **drum-machine-with-debug.html** - Integration Example
A complete working example showing the debug logger integrated into the drum machine application.

---

## 🚀 Quick Start

### Step 1: Import the Debug Logger

```javascript
import AudioDebugLogger from './audio-debug-logger.js';
```

### Step 2: Create Logger Instance

```javascript
const debugLogger = new AudioDebugLogger({
    enabled: true,          // Enable/disable logging
    verbose: false,         // Detailed logging
    logToConsole: true,     // Console output
    logToDOM: false,        // On-screen log display
    maxLogEntries: 1000     // Max log history
});
```

### Step 3: Wrap Your AudioContext

```javascript
const audioContext = new AudioContext();
debugLogger.wrapAudioContext(audioContext);
```

### Step 4: Log Your Audio Events

```javascript
// Log scheduled notes
debugLogger.logScheduledNote('kick', scheduleTime, volume, { step: 1 });

// Log errors
debugLogger.logError(error, 'contextName');

// Log warnings
debugLogger.logWarning('Something unusual happened');

// Log custom events
debugLogger.logEvent('Pattern loaded', { name: 'rock' }, 'info');
```

### Step 5: Generate Reports

```javascript
// Print to console
debugLogger.printReport();

// Export as JSON
debugLogger.exportReport();

// Get programmatic access
const report = debugLogger.generateReport();
```

---

## 📊 What Gets Logged

### 1. **AudioContext State Changes**

The logger automatically monitors and logs:
- Initial AudioContext creation
- State transitions (suspended → running, etc.)
- Startup time measurements
- Sample rate and latency information

**Example Output:**
```
✅ [0.123s] AudioContext created: {
  state: "running",
  sampleRate: 48000,
  baseLatency: 0.005
}
```

### 2. **Audio Node Creation**

Every audio node created is tracked:
- Node type (Oscillator, Gain, Filter, etc.)
- Unique node ID for tracking
- Timestamp of creation
- Connection graph

**Example Output:**
```
🔊 [1.234s] Node created: Oscillator (#1)
🔊 [1.235s] Node created: Gain (#2)
🔊 [1.236s] Connection: Oscillator (#1) → Gain
🔊 [1.237s] Connection: Gain (#2) → AudioDestinationNode
```

### 3. **Scheduled Audio Events**

All scheduled audio events are logged with:
- Instrument/sound name
- Scheduled time (absolute)
- Current time (for comparison)
- Time delta (how far ahead)
- Volume/parameters
- Validation status

**Example Output:**
```
🎵 [2.345s] Scheduled: kick @ 2.456s (Δ+111ms) { volume: 0.8, step: 1 }
⚠️  [2.456s] Scheduled: snare @ 2.400s (Δ-56ms) - TIMING ERROR
```

### 4. **Node Start/Stop Events**

When verbose mode is enabled:
```
⏱️  [3.456s] Node #1 (Oscillator) started at 3.500s
⏱️  [3.756s] Node #1 (Oscillator) stopped at 3.800s
```

### 5. **Performance Metrics**

Continuously tracked:
- Total nodes created
- Total events scheduled
- Timing drift occurrences
- Latency measurements
- Error/warning counts

### 6. **Errors and Warnings**

All errors are captured with:
- Error message and stack trace
- Context (where it occurred)
- Timestamp
- Related data

---

## 🎯 Key Features

### Feature 1: Automatic AudioContext Monitoring

```javascript
debugLogger.wrapAudioContext(audioContext);
```

**What it does:**
- Monitors state changes every 100ms
- Logs state transitions automatically
- Tracks startup time
- Measures latency continuously
- Wraps all node creation methods

**No additional code needed!** Just wrap once and get full visibility.

### Feature 2: Time Validation

```javascript
debugLogger.logScheduledNote('kick', scheduleTime, volume);
```

**Automatically validates:**
- ✅ Is the schedule time in the future?
- ✅ How far ahead is it scheduled?
- ⚠️  Warns if time is in the past
- ⚠️  Warns if schedule ahead time is excessive (>200ms)

### Feature 3: Audio Graph Visualization

```javascript
const graph = debugLogger.getAudioGraph();
console.log(graph);
```

**Returns:**
```javascript
{
  nodes: [
    { id: 1, type: 'Oscillator', timestamp: 123 },
    { id: 2, type: 'Gain', timestamp: 124 },
    // ...
  ],
  connections: [
    { sourceId: 1, sourceType: 'Oscillator', destinationType: 'GainNode' },
    // ...
  ],
  adjacency: {
    1: ['GainNode'],
    2: ['AudioDestinationNode']
  }
}
```

### Feature 4: Timing Analysis

```javascript
const analysis = debugLogger.getTimingAnalysis();
```

**Returns:**
```javascript
{
  totalEvents: 128,
  validEvents: 126,
  invalidEvents: 2,
  averageScheduleAhead: "95.23ms",
  minScheduleAhead: "1.00ms",
  maxScheduleAhead: "150.00ms",
  timingDriftOccurrences: 3,
  invalidEventsList: [
    { instrument: 'snare', scheduleTime: '2.400', currentTime: '2.456', delta: '-56ms' }
  ]
}
```

### Feature 5: Comprehensive Reporting

```javascript
const report = debugLogger.generateReport();
```

**Report includes:**
- AudioContext state and history
- Performance metrics
- Timing analysis
- Audio graph structure
- All errors and warnings
- Recent log entries

### Feature 6: Live DOM Logging

```javascript
const debugLogger = new AudioDebugLogger({
    logToDOM: true
});
```

Creates a live log display in the bottom-right corner of your page:

```
┌─────────────────────────────┐
│ [0.123s] AudioContext created│
│ [1.234s] Node created: Osc   │
│ [2.345s] Scheduled: kick     │
│ [2.456s] Playback started    │
└─────────────────────────────┘
```

---

## 🔧 Integration Examples

### Example 1: Basic Integration

```javascript
import AudioDebugLogger from './audio-debug-logger.js';

class MyAudioApp {
    constructor() {
        // Create logger
        this.debugLogger = new AudioDebugLogger({
            enabled: true,
            verbose: false
        });
        
        // Create and wrap AudioContext
        this.audioContext = new AudioContext();
        this.debugLogger.wrapAudioContext(this.audioContext);
    }
    
    playSound(frequency, time) {
        // Log the scheduled event
        this.debugLogger.logScheduledNote('tone', time, 1.0, {
            frequency: frequency
        });
        
        // Create and play sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start(time);
        osc.stop(time + 0.5);
    }
    
    getDebugReport() {
        return this.debugLogger.generateReport();
    }
}
```

### Example 2: Error Handling Integration

```javascript
async function initAudio() {
    try {
        const audioContext = new AudioContext();
        debugLogger.wrapAudioContext(audioContext);
        
        if (audioContext.state !== 'running') {
            debugLogger.logWarning('AudioContext not running, attempting resume...');
            await audioContext.resume();
        }
        
        debugLogger.logEvent('Audio initialized successfully', null, 'success');
        
    } catch (error) {
        debugLogger.logError(error, 'initAudio');
        throw error;
    }
}
```

### Example 3: Scheduler Integration

```javascript
class AudioScheduler {
    constructor() {
        this.debugLogger = new AudioDebugLogger({ enabled: true });
        this.audioContext = new AudioContext();
        this.debugLogger.wrapAudioContext(this.audioContext);
    }
    
    scheduleNote(instrument, time) {
        try {
            // Validate time
            const currentTime = this.audioContext.currentTime;
            if (time < currentTime) {
                this.debugLogger.logWarning(
                    `Attempted to schedule ${instrument} in the past`
                );
                time = currentTime + 0.001;
            }
            
            // Log the event
            this.debugLogger.logScheduledNote(instrument, time, 0.8);
            
            // Schedule the sound
            this.playSound(instrument, time);
            
        } catch (error) {
            this.debugLogger.logError(error, 'scheduleNote');
        }
    }
}
```

---

## 📈 Reading Debug Output

### Console Output Format

```
[emoji] [timestamp] message { data }
```

**Emojis indicate log level:**
- ℹ️ = Info
- ✅ = Success
- ⚠️ = Warning
- ❌ = Error
- 🔍 = Debug
- 🎵 = Audio event
- ⏱️ = Timing
- 🔊 = Node operation

### Example Console Session

```javascript
// Application starts
ℹ️  [0.000s] AudioDebugLogger initialized
🎵 [0.123s] AudioContext created: { state: "suspended", sampleRate: 48000 }
✅ [0.234s] AudioContext resumed successfully
🎵 [0.235s] AudioContext state: running

// User clicks play
🔊 [1.234s] Node created: Oscillator (#1)
🔊 [1.235s] Node created: Gain (#2)
🔊 [1.236s] Connection: Oscillator (#1) → GainNode
🔊 [1.237s] Connection: GainNode (#2) → AudioDestinationNode
🎵 [1.238s] Scheduled: kick @ 1.350s (Δ+112ms) { volume: 0.8, step: 0 }
⏱️  [1.239s] Node #1 (Oscillator) started at 1.350s
✅ [1.240s] Playback started

// Timing issue detected
⚠️  [2.456s] Scheduled event in past: snare @ 2.400s (current: 2.456s)
⚠️  [2.457s] Adjusting snare time: 2.400 → 2.457

// Error occurs
❌ [3.567s] Error in scheduleNote: Cannot read property 'currentTime' of null
```

---

## 🎛️ Configuration Options

### Constructor Options

```javascript
const debugLogger = new AudioDebugLogger({
    // Enable/disable all logging
    enabled: true,              // Default: true
    
    // Verbose mode (logs everything)
    verbose: false,             // Default: false
    
    // Console output
    logToConsole: true,         // Default: true
    
    // DOM output (on-screen display)
    logToDOM: false,            // Default: false
    
    // Maximum log entries to keep
    maxLogEntries: 1000         // Default: 1000
});
```

### Runtime Configuration

```javascript
// Enable/disable logging
debugLogger.setEnabled(true);

// Toggle verbose mode
debugLogger.setVerbose(true);

// Clear all logs
debugLogger.clear();

// Destroy logger
debugLogger.destroy();
```

---

## 📊 Report Structure

### Complete Report Object

```javascript
{
  timestamp: "2024-01-15T10:30:00.000Z",
  uptime: "45.3s",
  
  audioContext: {
    state: "running",
    sampleRate: 48000,
    currentTime: "45.234s",
    baseLatency: "5.00ms",
    stateHistory: {
      currentState: "running",
      stateChanges: 2,
      history: [
        { state: "suspended", timestamp: "0.000s" },
        { state: "running", timestamp: "0.234s" }
      ]
    }
  },
  
  performance: {
    uptime: "45.3s",
    contextStartupTime: "234ms",
    totalNodesCreated: 128,
    totalEventsScheduled: 256,
    totalErrors: 0,
    totalWarnings: 2,
    averageLatency: "5.23ms",
    latencySamples: 45
  },
  
  timing: {
    totalEvents: 256,
    validEvents: 254,
    invalidEvents: 2,
    averageScheduleAhead: "95.23ms",
    minScheduleAhead: "1.00ms",
    maxScheduleAhead: "150.00ms",
    timingDriftOccurrences: 3,
    invalidEventsList: [...]
  },
  
  audioGraph: {
    nodes: [...],
    connections: [...],
    totalNodes: 128,
    totalConnections: 128,
    adjacency: {...}
  },
  
  errors: [...],
  warnings: [...],
  recentLogs: [...]
}
```

---

## 🎯 Use Cases

### Use Case 1: Debugging "No Sound" Issues

**Problem:** Sound doesn't play

**Debug Steps:**
1. Check AudioContext state:
   ```javascript
   console.log(debugLogger.getState());
   ```
2. Look for state warnings in logs
3. Check if nodes are being created
4. Verify connections are made
5. Check for timing errors

### Use Case 2: Debugging Timing Issues

**Problem:** Sounds play at wrong time or out of sync

**Debug Steps:**
1. Get timing analysis:
   ```javascript
   console.log(debugLogger.getTimingAnalysis());
   ```
2. Look for invalid events (scheduled in past)
3. Check average schedule ahead time
4. Look for timing drift occurrences
5. Verify schedule times in logs

### Use Case 3: Performance Optimization

**Problem:** App feels sluggish or has audio glitches

**Debug Steps:**
1. Check node creation count:
   ```javascript
   const report = debugLogger.generateReport();
   console.log('Nodes:', report.performance.totalNodesCreated);
   ```
2. Look for excessive node creation
3. Check latency measurements
4. Review audio graph for complexity

### Use Case 4: Production Monitoring

**Problem:** Need to track issues in production

**Solution:**
```javascript
// Enable lightweight logging
const debugLogger = new AudioDebugLogger({
    enabled: true,
    verbose: false,
    logToConsole: false  // Don't spam console
});

// Export report on errors
window.addEventListener('error', () => {
    debugLogger.exportReport();
});

// Periodic health checks
setInterval(() => {
    const report = debugLogger.generateReport();
    if (report.performance.totalErrors > 0) {
        sendToAnalytics(report);
    }
}, 60000); // Every minute
```

---

## 🔬 Advanced Features

### Custom Event Logging

```javascript
// Log with different levels
debugLogger.logEvent('Custom event', { data: 123 }, 'info');
debugLogger.logEvent('Success!', null, 'success');
debugLogger.logEvent('Debug info', { x: 1 }, 'debug');
```

### Programmatic Access to Logs

```javascript
// Get all logs
const allLogs = debugLogger.logs;

// Get specific log types
const errors = debugLogger.errors;
const warnings = debugLogger.warnings;
const scheduledEvents = debugLogger.scheduledEvents;
const audioNodes = debugLogger.audioNodes;
const connections = debugLogger.connections;
```

### State History Analysis

```javascript
const stateHistory = debugLogger.getStateHistory();

// Find when context was suspended
const suspensions = stateHistory.history.filter(
    s => s.state === 'suspended'
);
```

### Performance Tracking

```javascript
// Get latency over time
const latencies = debugLogger.metrics.latencyMeasurements;

// Calculate average
const avgLatency = latencies.reduce((a, b) => a + b.latency, 0) / latencies.length;
```

---

## 🎨 Visualization Ideas

### Audio Graph Visualization

```javascript
function visualizeAudioGraph() {
    const graph = debugLogger.getAudioGraph();
    
    // Use D3.js, vis.js, or similar to create visual graph
    // showing nodes and connections
}
```

### Timing Chart

```javascript
function createTimingChart() {
    const events = debugLogger.scheduledEvents;
    
    // Create timeline chart showing:
    // - When events were scheduled
    // - How far ahead they were scheduled
    // - Invalid events highlighted
}
```

### Performance Dashboard

```javascript
function updateDashboard() {
    const metrics = debugLogger.getPerformanceMetrics();
    
    // Update UI with:
    // - Nodes created (gauge)
    // - Events scheduled (counter)
    // - Errors/warnings (alerts)
    // - Average latency (line chart)
}
```

---

## 🐛 Troubleshooting

### Logger Not Working

**Check:**
1. Is `enabled: true`?
2. Is AudioContext wrapped?
3. Are you calling log methods?
4. Check browser console for errors

### Too Much Output

**Solutions:**
1. Disable verbose mode
2. Set `logToConsole: false`
3. Use selective logging
4. Increase `maxLogEntries` if needed

### Missing Node Information

**Cause:** AudioContext not wrapped before node creation

**Fix:**
```javascript
// Wrap BEFORE creating nodes
debugLogger.wrapAudioContext(audioContext);

// Then create nodes
const osc = audioContext.createOscillator();
```

### Performance Impact

**Mitigation:**
1. Disable in production: `enabled: false`
2. Use selective logging
3. Disable verbose mode
4. Clear logs periodically: `debugLogger.clear()`

---

## 📚 API Reference

### Constructor

```javascript
new AudioDebugLogger(options)
```

### Methods

| Method | Description |
|--------|-------------|
| `wrapAudioContext(ctx)` | Wrap AudioContext for monitoring |
| `logScheduledNote(name, time, volume, meta)` | Log scheduled audio event |
| `logError(error, context)` | Log error |
| `logWarning(message, data)` | Log warning |
| `logEvent(message, data, level)` | Log custom event |
| `generateReport()` | Get comprehensive report |
| `printReport()` | Print report to console |
| `exportReport()` | Export report as JSON file |
| `getAudioGraph()` | Get audio node graph |
| `getTimingAnalysis()` | Get timing statistics |
| `getPerformanceMetrics()` | Get performance metrics |
| `getStateHistory()` | Get AudioContext state history |
| `clear()` | Clear all logs |
| `setEnabled(bool)` | Enable/disable logging |
| `setVerbose(bool)` | Enable/disable verbose mode |
| `destroy()` | Cleanup and destroy logger |

---

## ✅ Best Practices

### 1. **Initialize Early**
```javascript
// ✅ Good
const debugLogger = new AudioDebugLogger({ enabled: true });
const audioContext = new AudioContext();
debugLogger.wrapAudioContext(audioContext);

// ❌ Bad
const audioContext = new AudioContext();
const osc = audioContext.createOscillator(); // Not tracked!
debugLogger.wrapAudioContext(audioContext);
```

### 2. **Use Appropriate Log Levels**
```javascript
// ✅ Good
debugLogger.logError(error, 'critical-function');
debugLogger.logWarning('Unusual but handled');
debugLogger.logEvent('Normal operation', null, 'info');

// ❌ Bad - everything as error
debugLogger.logError(new Error('Just FYI'), 'info');
```

### 3. **Provide Context**
```javascript
// ✅ Good
debugLogger.logScheduledNote('kick', time, 0.8, {
    step: 1,
    pattern: 'rock',
    measure: 1
});

// ❌ Bad - no context
debugLogger.logScheduledNote('kick', time, 0.8);
```

### 4. **Regular Reports**
```javascript
// ✅ Good - periodic health checks
setInterval(() => {
    const report = debugLogger.generateReport();
    if (report.performance.totalErrors > 0) {
        debugLogger.printReport();
    }
}, 30000);
```

### 5. **Cleanup**
```javascript
// ✅ Good - cleanup on exit
window.addEventListener('beforeunload', () => {
    debugLogger.destroy();
});
```

---

## 🎓 Learning Path

### Beginner
1. Start with basic integration
2. Use `printReport()` to see what's happening
3. Look for errors and warnings
4. Understand AudioContext states

### Intermediate
1. Use timing analysis to optimize scheduling
2. Visualize audio graph
3. Track performance metrics
4. Use verbose mode selectively

### Advanced
1. Build custom dashboards
2. Integrate with analytics
3. Create automated tests
4. Optimize based on metrics

---

## 📞 Support

For issues or questions:
1. Check console output for errors
2. Generate and review debug report
3. Check AudioContext state history
4. Review timing analysis for issues

---

## 🎉 Summary

The Audio Debug Logger provides:
- ✅ Complete visibility into Web Audio API operations
- ✅ Automatic monitoring with zero configuration
- ✅ Comprehensive reporting and analytics
- ✅ Production-ready error tracking
- ✅ Performance optimization insights

**Start debugging smarter, not harder!** 🚀
