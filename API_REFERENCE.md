# 📚 API Reference - Professional Drum Machine

Complete technical reference for the DrumMachine class and its methods.

## Table of Contents

1. [DrumMachine Class](#drummachine-class)
2. [Properties](#properties)
3. [Methods](#methods)
4. [Audio Synthesis](#audio-synthesis)
5. [Pattern Data Structure](#pattern-data-structure)
6. [Events](#events)
7. [Examples](#examples)

---

## DrumMachine Class

### Constructor

```javascript
const drumMachine = new DrumMachine();
```

Creates a new drum machine instance and initializes the UI.

**Parameters**: None

**Returns**: `DrumMachine` instance

**Example**:
```javascript
window.drumMachine = new DrumMachine();
```

---

## Properties

### Audio Context Properties

#### `audioContext`
- **Type**: `AudioContext | null`
- **Description**: Web Audio API context for audio processing
- **Default**: `null` (initialized on user interaction)

```javascript
console.log(drumMachine.audioContext.sampleRate); // 48000
```

#### `isPlaying`
- **Type**: `boolean`
- **Description**: Current playback state
- **Default**: `false`

```javascript
if (drumMachine.isPlaying) {
    console.log('Sequencer is running');
}
```

#### `currentStep`
- **Type**: `number` (0-15)
- **Description**: Current step in the 16-step sequence
- **Default**: `0`

```javascript
console.log(`Playing step ${drumMachine.currentStep + 1}`);
```

#### `tempo`
- **Type**: `number`
- **Description**: Beats per minute (fixed at 120)
- **Default**: `120`
- **Read-only**: Yes (in current implementation)

```javascript
console.log(`Tempo: ${drumMachine.tempo} BPM`);
```

#### `lookahead`
- **Type**: `number`
- **Description**: Scheduler lookahead time in milliseconds
- **Default**: `25.0`

```javascript
drumMachine.lookahead = 30.0; // Increase for slower systems
```

#### `scheduleAheadTime`
- **Type**: `number`
- **Description**: How far ahead to schedule audio events (seconds)
- **Default**: `0.1`

```javascript
drumMachine.scheduleAheadTime = 0.15; // More buffer
```

#### `nextNoteTime`
- **Type**: `number`
- **Description**: AudioContext time for next scheduled note
- **Default**: `0.0`

```javascript
console.log(`Next note at: ${drumMachine.nextNoteTime}`);
```

#### `timerID`
- **Type**: `number | null`
- **Description**: setInterval timer ID for scheduler
- **Default**: `null`

---

### Pattern Properties

#### `tracks`
- **Type**: `string[]`
- **Description**: Array of track names
- **Default**: `['kick', 'snare', 'hihat', 'bass']`
- **Read-only**: Yes

```javascript
drumMachine.tracks.forEach(track => {
    console.log(`Track: ${track}`);
});
```

#### `pattern`
- **Type**: `Object<string, boolean[]>`
- **Description**: Pattern data for all tracks
- **Structure**:
```javascript
{
    kick: [false, false, false, ...],  // 16 steps
    snare: [false, false, false, ...], // 16 steps
    hihat: [false, false, false, ...], // 16 steps
    bass: [false, false, false, ...]   // 16 steps
}
```

**Example**:
```javascript
// Check if step 4 on kick is active
if (drumMachine.pattern.kick[3]) {
    console.log('Kick on step 4');
}

// Get all active steps for snare
const activeSnareSteps = drumMachine.pattern.snare
    .map((active, i) => active ? i : -1)
    .filter(i => i !== -1);
console.log('Snare steps:', activeSnareSteps);
```

#### `volumes`
- **Type**: `Object<string, number>`
- **Description**: Volume levels for each track (0-1 range)
- **Default**:
```javascript
{
    kick: 0.8,
    snare: 0.7,
    hihat: 0.6,
    bass: 0.75
}
```

**Example**:
```javascript
// Set kick volume to 50%
drumMachine.volumes.kick = 0.5;

// Get current snare volume
console.log(`Snare: ${drumMachine.volumes.snare * 100}%`);
```

#### `presets`
- **Type**: `Object<string, Object>`
- **Description**: Built-in pattern presets
- **Available Presets**: `basic`, `rock`, `funk`, `techno`, `hiphop`

**Structure**:
```javascript
{
    basic: {
        kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
        snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
        hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
        bass: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
    },
    // ... other presets
}
```

---

### Statistics Properties

#### `stats`
- **Type**: `Object`
- **Description**: Performance statistics
- **Properties**:
  - `notesScheduled` (number): Total notes scheduled
  - `timingErrors` (array): Timing error measurements
  - `lastScheduleTime` (number): Last scheduler execution time

**Example**:
```javascript
console.log(`Notes scheduled: ${drumMachine.stats.notesScheduled}`);
console.log(`Last schedule: ${drumMachine.stats.lastScheduleTime}`);
```

---

## Methods

### Initialization Methods

#### `init()`
```javascript
async init()
```

Initialize the drum machine (called automatically by constructor).

**Parameters**: None

**Returns**: `Promise<void>`

**Actions**:
- Builds UI grid
- Attaches event listeners
- Sets up loading overlay

---

#### `initAudio()`
```javascript
async initAudio()
```

Initialize Web Audio API context.

**Parameters**: None

**Returns**: `Promise<void>`

**Throws**: Error if AudioContext creation fails

**Example**:
```javascript
try {
    await drumMachine.initAudio();
    console.log('Audio ready');
} catch (error) {
    console.error('Audio init failed:', error);
}
```

---

### UI Methods

#### `buildUI()`
```javascript
buildUI()
```

Build the sequencer grid UI.

**Parameters**: None

**Returns**: `void`

**Description**: Creates 4×16 grid with track labels and step buttons.

---

#### `attachEventListeners()`
```javascript
attachEventListeners()
```

Attach all event listeners for UI controls.

**Parameters**: None

**Returns**: `void`

**Listeners**:
- Play/Stop/Clear buttons
- Volume sliders
- Preset buttons
- Step buttons

---

#### `updateUI()`
```javascript
updateUI()
```

Update UI to reflect current pattern state.

**Parameters**: None

**Returns**: `void`

**Description**: Updates all step button active states.

**Example**:
```javascript
drumMachine.pattern.kick[0] = true;
drumMachine.updateUI(); // Reflects change in UI
```

---

#### `updateCurrentStepUI(step)`
```javascript
updateCurrentStepUI(step)
```

Highlight the current step being played.

**Parameters**:
- `step` (number): Step index (0-15)

**Returns**: `void`

**Example**:
```javascript
drumMachine.updateCurrentStepUI(4); // Highlight step 5
```

---

#### `updateActiveNotesDisplay()`
```javascript
updateActiveNotesDisplay()
```

Update the active notes counter in the UI.

**Parameters**: None

**Returns**: `void`

---

### Pattern Methods

#### `toggleStep(track, step)`
```javascript
toggleStep(track, step)
```

Toggle a step on/off for a specific track.

**Parameters**:
- `track` (string): Track name ('kick', 'snare', 'hihat', 'bass')
- `step` (number): Step index (0-15)

**Returns**: `void`

**Example**:
```javascript
// Toggle kick on step 1
drumMachine.toggleStep('kick', 0);

// Toggle snare on step 5
drumMachine.toggleStep('snare', 4);
```

---

#### `clearPattern()`
```javascript
clearPattern()
```

Clear all patterns (with confirmation dialog).

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
drumMachine.clearPattern(); // Shows confirmation dialog
```

---

#### `loadPreset(presetName)`
```javascript
loadPreset(presetName)
```

Load a preset pattern.

**Parameters**:
- `presetName` (string): Preset name ('basic', 'rock', 'funk', 'techno', 'hiphop')

**Returns**: `void`

**Example**:
```javascript
drumMachine.loadPreset('rock');
drumMachine.play();
```

---

### Playback Methods

#### `play()`
```javascript
play()
```

Start sequencer playback.

**Parameters**: None

**Returns**: `void`

**Requirements**: AudioContext must be initialized

**Example**:
```javascript
drumMachine.play();
```

---

#### `stop()`
```javascript
stop()
```

Stop sequencer playback.

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
drumMachine.stop();
```

---

### Scheduling Methods

#### `scheduler()`
```javascript
scheduler()
```

Main scheduler loop (called every 25ms during playback).

**Parameters**: None

**Returns**: `void`

**Description**: Schedules audio events ahead of time using lookahead.

**Internal use only** - called automatically by play()

---

#### `scheduleCurrentStep(time)`
```javascript
scheduleCurrentStep(time)
```

Schedule all active notes for the current step.

**Parameters**:
- `time` (number): AudioContext time to schedule notes

**Returns**: `void`

**Internal use only**

---

#### `scheduleNote(track, time)`
```javascript
scheduleNote(track, time)
```

Schedule a single note at a specific time.

**Parameters**:
- `track` (string): Track name
- `time` (number): AudioContext time

**Returns**: `void`

**Example** (advanced usage):
```javascript
// Schedule a kick drum 1 second from now
const futureTime = drumMachine.audioContext.currentTime + 1.0;
drumMachine.scheduleNote('kick', futureTime);
```

---

#### `nextNote()`
```javascript
nextNote()
```

Advance to the next note in the sequence.

**Parameters**: None

**Returns**: `void`

**Internal use only**

---

### Audio Synthesis Methods

#### `playKick(time, volume)`
```javascript
playKick(time, volume = 0.8)
```

Play synthesized kick drum sound.

**Parameters**:
- `time` (number): AudioContext time to play
- `volume` (number, optional): Volume level (0-1), default: 0.8

**Returns**: `void`

**Synthesis Details**:
- Oscillator type: Sine
- Frequency envelope: 150Hz → 50Hz → 30Hz
- Duration: 300ms
- Filter: Lowpass at 200Hz

**Example**:
```javascript
const now = drumMachine.audioContext.currentTime;
drumMachine.playKick(now, 1.0); // Full volume
drumMachine.playKick(now + 0.5, 0.5); // Half volume, 500ms later
```

---

#### `playSnare(time, volume)`
```javascript
playSnare(time, volume = 0.7)
```

Play synthesized snare drum sound.

**Parameters**:
- `time` (number): AudioContext time to play
- `volume` (number, optional): Volume level (0-1), default: 0.7

**Returns**: `void`

**Synthesis Details**:
- Noise component: White noise through highpass filter (1kHz)
- Tonal component: Triangle wave 200Hz → 100Hz
- Duration: 150ms (noise), 100ms (tone)

**Example**:
```javascript
const now = drumMachine.audioContext.currentTime;
drumMachine.playSnare(now, 0.8);
```

---

#### `playHiHat(time, volume)`
```javascript
playHiHat(time, volume = 0.6)
```

Play synthesized hi-hat sound.

**Parameters**:
- `time` (number): AudioContext time to play
- `volume` (number, optional): Volume level (0-1), default: 0.6

**Returns**: `void`

**Synthesis Details**:
- Type: White noise
- Filter: Highpass at 7kHz
- Duration: 50ms

**Example**:
```javascript
const now = drumMachine.audioContext.currentTime;
drumMachine.playHiHat(now, 0.7);
```

---

#### `playBass(time, volume)`
```javascript
playBass(time, volume = 0.75)
```

Play synthesized bass sound.

**Parameters**:
- `time` (number): AudioContext time to play
- `volume` (number, optional): Volume level (0-1), default: 0.75

**Returns**: `void`

**Synthesis Details**:
- Oscillator type: Sine wave
- Frequency: 55Hz (A1 note)
- Duration: 400ms

**Example**:
```javascript
const now = drumMachine.audioContext.currentTime;
drumMachine.playBass(now, 0.9);
```

---

#### `createNoiseBuffer()`
```javascript
createNoiseBuffer()
```

Create white noise buffer for snare/hi-hat synthesis.

**Parameters**: None

**Returns**: `AudioBuffer`

**Example**:
```javascript
const noiseBuffer = drumMachine.createNoiseBuffer();
console.log(`Buffer length: ${noiseBuffer.length} samples`);
```

---

### Timing Properties (Getters)

#### `secondsPerBeat`
```javascript
get secondsPerBeat()
```

Calculate seconds per beat at current tempo.

**Returns**: `number` (seconds)

**Formula**: `60 / tempo`

**Example**:
```javascript
console.log(`Beat duration: ${drumMachine.secondsPerBeat}s`); // 0.5s at 120 BPM
```

---

#### `secondsPer16thNote`
```javascript
get secondsPer16thNote()
```

Calculate seconds per 16th note at current tempo.

**Returns**: `number` (seconds)

**Formula**: `(60 / tempo) / 4`

**Example**:
```javascript
console.log(`16th note: ${drumMachine.secondsPer16thNote}s`); // 0.125s at 120 BPM
```

---

## Pattern Data Structure

### Format

```javascript
{
    kick: [
        false, false, false, false,  // Steps 1-4
        false, false, false, false,  // Steps 5-8
        false, false, false, false,  // Steps 9-12
        false, false, false, false   // Steps 13-16
    ],
    snare: [ /* 16 booleans */ ],
    hihat: [ /* 16 booleans */ ],
    bass: [ /* 16 booleans */ ]
}
```

### Accessing Pattern Data

```javascript
// Get full pattern
const pattern = drumMachine.pattern;

// Check specific step
if (pattern.kick[0]) {
    console.log('Kick on step 1');
}

// Count active steps per track
const activeKicks = pattern.kick.filter(v => v).length;
console.log(`Active kicks: ${activeKicks}`);

// Get all active steps
const activeSteps = pattern.kick
    .map((active, index) => active ? index : -1)
    .filter(index => index !== -1);
console.log('Active kick steps:', activeSteps);
```

### Modifying Pattern Data

```javascript
// Set specific step
drumMachine.pattern.kick[0] = true;
drumMachine.pattern.snare[4] = true;
drumMachine.updateUI();

// Set multiple steps
[0, 4, 8, 12].forEach(step => {
    drumMachine.pattern.kick[step] = true;
});
drumMachine.updateUI();

// Copy pattern
const backup = JSON.parse(JSON.stringify(drumMachine.pattern));

// Restore pattern
drumMachine.pattern = backup;
drumMachine.updateUI();
```

---

## Events

### DOM Events

The drum machine uses standard DOM events:

```javascript
// Play button click
document.getElementById('playBtn').addEventListener('click', () => {
    console.log('Play clicked');
});

// Stop button click
document.getElementById('stopBtn').addEventListener('click', () => {
    console.log('Stop clicked');
});

// Step button click
document.querySelectorAll('.step').forEach(button => {
    button.addEventListener('click', (e) => {
        const track = e.target.dataset.track;
        const step = e.target.dataset.step;
        console.log(`Toggled ${track} step ${step}`);
    });
});

// Volume slider change
document.getElementById('kickVolume').addEventListener('input', (e) => {
    console.log(`Kick volume: ${e.target.value}%`);
});
```

---

## Examples

### Example 1: Create Custom Pattern

```javascript
// Create a four-on-the-floor pattern
drumMachine.pattern.kick = [
    1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0
].map(v => !!v);

drumMachine.pattern.hihat = [
    1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1
].map(v => !!v);

drumMachine.pattern.snare = [
    0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0
].map(v => !!v);

drumMachine.updateUI();
drumMachine.play();
```

### Example 2: Randomize Pattern

```javascript
function randomizePattern() {
    drumMachine.tracks.forEach(track => {
        drumMachine.pattern[track] = Array(16)
            .fill(false)
            .map(() => Math.random() > 0.7);
    });
    drumMachine.updateUI();
}

randomizePattern();
```

### Example 3: Pattern Analyzer

```javascript
function analyzePattern() {
    const analysis = {};
    
    drumMachine.tracks.forEach(track => {
        const pattern = drumMachine.pattern[track];
        const activeSteps = pattern.filter(v => v).length;
        const density = (activeSteps / 16 * 100).toFixed(1);
        
        analysis[track] = {
            activeSteps,
            density: `${density}%`,
            steps: pattern.map((v, i) => v ? i + 1 : null).filter(v => v)
        };
    });
    
    return analysis;
}

console.log(analyzePattern());
// Output:
// {
//   kick: { activeSteps: 4, density: '25.0%', steps: [1, 5, 9, 13] },
//   snare: { activeSteps: 2, density: '12.5%', steps: [5, 13] },
//   ...
// }
```

### Example 4: Export/Import Pattern

```javascript
// Export pattern to JSON
function exportPattern() {
    return JSON.stringify({
        pattern: drumMachine.pattern,
        volumes: drumMachine.volumes,
        tempo: drumMachine.tempo
    }, null, 2);
}

// Import pattern from JSON
function importPattern(jsonString) {
    const data = JSON.parse(jsonString);
    drumMachine.pattern = data.pattern;
    drumMachine.volumes = data.volumes;
    drumMachine.updateUI();
}

// Usage
const exported = exportPattern();
console.log(exported);

// Later...
importPattern(exported);
```

### Example 5: Real-Time Pattern Modification

```javascript
// Rotate pattern right
function rotatePatternRight(track) {
    const pattern = drumMachine.pattern[track];
    const last = pattern.pop();
    pattern.unshift(last);
    drumMachine.updateUI();
}

// Rotate pattern left
function rotatePatternLeft(track) {
    const pattern = drumMachine.pattern[track];
    const first = pattern.shift();
    pattern.push(first);
    drumMachine.updateUI();
}

// Invert pattern
function invertPattern(track) {
    drumMachine.pattern[track] = drumMachine.pattern[track].map(v => !v);
    drumMachine.updateUI();
}

// Usage
rotatePatternRight('kick');
invertPattern('hihat');
```

### Example 6: Performance Monitoring

```javascript
// Monitor timing accuracy
function monitorTiming() {
    const startTime = drumMachine.audioContext.currentTime;
    let lastStepTime = startTime;
    
    const originalSchedule = drumMachine.scheduleCurrentStep.bind(drumMachine);
    drumMachine.scheduleCurrentStep = function(time) {
        const delta = time - lastStepTime;
        const expected = drumMachine.secondsPer16thNote;
        const error = Math.abs(delta - expected) * 1000; // ms
        
        console.log(`Step ${drumMachine.currentStep}: ${error.toFixed(3)}ms error`);
        
        lastStepTime = time;
        return originalSchedule(time);
    };
}

monitorTiming();
drumMachine.play();
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| AudioContext | 35+ | 25+ | 14.1+ | 79+ |
| Promises | 32+ | 29+ | 8+ | 79+ |
| ES6 Classes | 49+ | 45+ | 9+ | 79+ |
| Grid Layout | 57+ | 52+ | 10.1+ | 16+ |

**Recommended Versions**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Performance Tips

1. **Avoid modifying patterns during playback** - can cause timing glitches
2. **Use `updateUI()` sparingly** - batch pattern changes
3. **Keep lookahead at 25-50ms** - balance between stability and responsiveness
4. **Monitor `stats.notesScheduled`** - detect scheduling issues
5. **Close AudioContext on cleanup** - prevent memory leaks

---

## Debugging

### Enable Console Logging

```javascript
// Override methods to add logging
const originalPlay = drumMachine.play.bind(drumMachine);
drumMachine.play = function() {
    console.log('▶️ Play called');
    return originalPlay();
};

const originalStop = drumMachine.stop.bind(drumMachine);
drumMachine.stop = function() {
    console.log('⏹️ Stop called');
    return originalStop();
};
```

### Inspect Audio Graph

```javascript
console.log('AudioContext state:', drumMachine.audioContext.state);
console.log('Sample rate:', drumMachine.audioContext.sampleRate);
console.log('Current time:', drumMachine.audioContext.currentTime);
console.log('Base latency:', drumMachine.audioContext.baseLatency);
```

---

## Support

For issues or questions:
- Check browser console for errors
- Verify AudioContext is initialized
- Ensure browser meets minimum version requirements
- Review examples in this document

---

**📚 Complete API reference for Professional Drum Machine v1.0.0**
