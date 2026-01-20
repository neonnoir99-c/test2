# 🔍 Audio Debug Logger - Quick Reference

## 30-Second Setup

```javascript
import AudioDebugLogger from './audio-debug-logger.js';

// 1. Create logger
const debugLogger = new AudioDebugLogger({ enabled: true });

// 2. Wrap AudioContext
const audioContext = new AudioContext();
debugLogger.wrapAudioContext(audioContext);

// 3. Log events
debugLogger.logScheduledNote('kick', time, 0.8);

// 4. Get report
debugLogger.printReport();
```

---

## Common Commands

```javascript
// Print comprehensive report
debugLogger.printReport();

// Export report as JSON
debugLogger.exportReport();

// Get timing analysis
const timing = debugLogger.getTimingAnalysis();

// Get audio graph
const graph = debugLogger.getAudioGraph();

// Get performance metrics
const perf = debugLogger.getPerformanceMetrics();

// Clear logs
debugLogger.clear();

// Toggle verbose mode
debugLogger.setVerbose(true);
```

---

## Log Levels (Emojis)

| Emoji | Level | Usage |
|-------|-------|-------|
| ℹ️ | Info | General information |
| ✅ | Success | Successful operations |
| ⚠️ | Warning | Issues that don't break functionality |
| ❌ | Error | Errors that break functionality |
| 🔍 | Debug | Detailed debug information |
| 🎵 | Audio | Audio-specific events |
| ⏱️ | Timing | Timing-related events |
| 🔊 | Node | Audio node operations |

---

## What Gets Logged Automatically

✅ **AudioContext state changes**
- Creation, suspension, resumption
- State transitions
- Startup time

✅ **Audio node creation**
- All node types
- Node IDs
- Connections

✅ **Performance metrics**
- Latency measurements
- Node count
- Event count

---

## Manual Logging

```javascript
// Log scheduled note
debugLogger.logScheduledNote(
    'kick',           // Instrument name
    scheduleTime,     // When to play
    0.8,              // Volume
    { step: 1 }       // Optional metadata
);

// Log error
debugLogger.logError(error, 'functionName');

// Log warning
debugLogger.logWarning('Something unusual', { data: 123 });

// Log custom event
debugLogger.logEvent('Custom message', { x: 1 }, 'info');
```

---

## Report Structure

```javascript
{
  audioContext: {
    state: "running",
    sampleRate: 48000,
    currentTime: "45.234s",
    stateHistory: [...]
  },
  performance: {
    totalNodesCreated: 128,
    totalEventsScheduled: 256,
    totalErrors: 0,
    totalWarnings: 2,
    averageLatency: "5.23ms"
  },
  timing: {
    validEvents: 254,
    invalidEvents: 2,
    averageScheduleAhead: "95.23ms"
  },
  audioGraph: {
    totalNodes: 128,
    totalConnections: 128
  },
  errors: [...],
  warnings: [...]
}
```

---

## Debugging Checklist

### No Sound Issues
- [ ] Check AudioContext state: `debugLogger.getState()`
- [ ] Look for state warnings in console
- [ ] Verify nodes are being created
- [ ] Check connections in audio graph
- [ ] Look for timing errors

### Timing Issues
- [ ] Get timing analysis: `debugLogger.getTimingAnalysis()`
- [ ] Check for invalid events (past scheduling)
- [ ] Review average schedule ahead time
- [ ] Look for timing drift warnings

### Performance Issues
- [ ] Check node count: `report.performance.totalNodesCreated`
- [ ] Review latency: `report.performance.averageLatency`
- [ ] Look for excessive node creation
- [ ] Check audio graph complexity

---

## Configuration Options

```javascript
new AudioDebugLogger({
    enabled: true,          // Enable/disable
    verbose: false,         // Detailed logging
    logToConsole: true,     // Console output
    logToDOM: false,        // On-screen display
    maxLogEntries: 1000     // History size
})
```

---

## Common Patterns

### Pattern 1: Basic Setup
```javascript
const debugLogger = new AudioDebugLogger({ enabled: true });
debugLogger.wrapAudioContext(audioContext);
```

### Pattern 2: Error Handling
```javascript
try {
    // Audio code
} catch (error) {
    debugLogger.logError(error, 'contextName');
}
```

### Pattern 3: Scheduled Events
```javascript
debugLogger.logScheduledNote(instrument, time, volume, metadata);
playSound(instrument, time, volume);
```

### Pattern 4: Periodic Reports
```javascript
setInterval(() => {
    if (debugLogger.errors.length > 0) {
        debugLogger.printReport();
    }
}, 30000);
```

### Pattern 5: Production Monitoring
```javascript
const debugLogger = new AudioDebugLogger({
    enabled: true,
    verbose: false,
    logToConsole: false
});

window.addEventListener('error', () => {
    debugLogger.exportReport();
});
```

---

## Files Included

1. **audio-debug-logger.js** - Core debug module
2. **drum-machine-with-debug.html** - Integration example
3. **DEBUG_INSTRUMENTATION_GUIDE.md** - Complete documentation
4. **DEBUG_QUICK_REFERENCE.md** - This file

---

## Key Methods

| Method | What It Does |
|--------|--------------|
| `wrapAudioContext()` | Start monitoring AudioContext |
| `logScheduledNote()` | Log audio event with timing |
| `logError()` | Log error with context |
| `logWarning()` | Log warning message |
| `printReport()` | Print full report to console |
| `exportReport()` | Download report as JSON |
| `getTimingAnalysis()` | Get timing statistics |
| `getAudioGraph()` | Get node connection graph |
| `clear()` | Clear all logs |

---

## Console Output Examples

```
✅ [0.123s] AudioContext created: { state: "running" }
🔊 [1.234s] Node created: Oscillator (#1)
🔊 [1.235s] Connection: Oscillator (#1) → GainNode
🎵 [1.238s] Scheduled: kick @ 1.350s (Δ+112ms)
⚠️  [2.456s] Scheduled event in past: snare @ 2.400s
❌ [3.567s] Error in scheduleNote: Cannot read property...
```

---

## Troubleshooting

**Logger not working?**
- Check `enabled: true`
- Verify AudioContext is wrapped
- Look for console errors

**Too much output?**
- Set `verbose: false`
- Set `logToConsole: false`
- Use selective logging

**Missing node info?**
- Wrap AudioContext BEFORE creating nodes

**Performance impact?**
- Disable in production: `enabled: false`
- Clear logs periodically: `debugLogger.clear()`

---

## Best Practices

✅ **DO:**
- Initialize logger early
- Wrap AudioContext before creating nodes
- Provide context in log messages
- Generate reports periodically
- Clean up on page unload

❌ **DON'T:**
- Create logger after nodes
- Log everything as errors
- Leave verbose mode on in production
- Forget to cleanup

---

## Quick Diagnostic Commands

```javascript
// Check current state
console.log(debugLogger.getState());

// Print full report
debugLogger.printReport();

// Check for errors
console.log(debugLogger.errors);

// Check timing issues
console.log(debugLogger.getTimingAnalysis());

// Check node count
console.log(debugLogger.audioNodes.length);

// Export for analysis
debugLogger.exportReport();
```

---

## Integration Checklist

- [ ] Import AudioDebugLogger
- [ ] Create logger instance
- [ ] Wrap AudioContext
- [ ] Add error handling
- [ ] Log scheduled events
- [ ] Add debug controls to UI
- [ ] Test report generation
- [ ] Configure for production

---

## Performance Metrics

**What's Tracked:**
- Total nodes created
- Total events scheduled
- Error count
- Warning count
- Average latency
- Timing drift occurrences
- AudioContext startup time

**Access:**
```javascript
const metrics = debugLogger.getPerformanceMetrics();
```

---

## Support

**Getting Help:**
1. Generate report: `debugLogger.printReport()`
2. Check errors: `debugLogger.errors`
3. Review timing: `debugLogger.getTimingAnalysis()`
4. Export data: `debugLogger.exportReport()`

---

## Example Output

### Console Report
```
═══════════════════════════════════════════
🔊 AUDIO DEBUG REPORT
═══════════════════════════════════════════

📊 PERFORMANCE METRICS:
{
  uptime: "45.3s",
  totalNodesCreated: 128,
  totalEventsScheduled: 256,
  totalErrors: 0,
  averageLatency: "5.23ms"
}

⏱️  TIMING ANALYSIS:
{
  totalEvents: 256,
  validEvents: 254,
  invalidEvents: 2,
  averageScheduleAhead: "95.23ms"
}

🎵 AUDIOCONTEXT STATE:
{
  state: "running",
  sampleRate: 48000,
  currentTime: "45.234s"
}
═══════════════════════════════════════════
```

---

## Remember

🎯 **Purpose:** Verify audio pipeline is functioning correctly

✅ **Benefits:**
- Catch timing errors
- Monitor AudioContext state
- Track node creation
- Measure performance
- Debug audio issues

🚀 **Result:** Reliable, debuggable audio applications!

---

**For detailed documentation, see:** `DEBUG_INSTRUMENTATION_GUIDE.md`
