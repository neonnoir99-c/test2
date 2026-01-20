# 🚀 Integration Guide: Drum Machine Audio Scheduling Engine

## Quick Integration in 5 Minutes

### Step 1: Copy Files

Copy these files to your project:
```
your-project/
  ├── audio-scheduler.js
  ├── drumSynthesizers.js
  └── drumMachineEngine.js
```

### Step 2: Import the Engine

```javascript
import DrumMachineEngine from './drumMachineEngine.js';
```

### Step 3: Initialize After User Interaction

```javascript
const drumMachine = new DrumMachineEngine(120); // 120 BPM

// Must be called after user click/touch (browser autoplay policy)
document.getElementById('startButton').addEventListener('click', async () => {
  await drumMachine.initialize();
  await drumMachine.start();
});
```

### Step 4: Program a Pattern

```javascript
// Basic beat
drumMachine.setStep('kick', 0, true);
drumMachine.setStep('kick', 4, true);
drumMachine.setStep('kick', 8, true);
drumMachine.setStep('kick', 12, true);

drumMachine.setStep('snare', 4, true);
drumMachine.setStep('snare', 12, true);

drumMachine.setStep('hihat', 2, true);
drumMachine.setStep('hihat', 6, true);
drumMachine.setStep('hihat', 10, true);
drumMachine.setStep('hihat', 14, true);
```

### Step 5: Add Visual Feedback (Optional)

```javascript
drumMachine.onStepPlay((stepNumber, time) => {
  // Highlight the playing step in your UI
  console.log(`Playing step ${stepNumber}`);
});
```

**That's it!** You now have a working drum machine with precise timing.

---

## 🎨 UI Integration Examples

### Vanilla JavaScript

```html
<div id="sequencer"></div>
<button id="playBtn">Play</button>
<button id="stopBtn">Stop</button>

<script type="module">
import DrumMachineEngine from './drumMachineEngine.js';

const drums = new DrumMachineEngine(120);
const tracks = ['kick', 'snare', 'hihat', 'bass'];

// Build grid
const sequencer = document.getElementById('sequencer');
tracks.forEach(track => {
  const row = document.createElement('div');
  row.innerHTML = `<span>${track}</span>`;
  
  for (let i = 0; i < 16; i++) {
    const btn = document.createElement('button');
    btn.dataset.track = track;
    btn.dataset.step = i;
    btn.onclick = () => {
      const active = drums.toggleStep(track, i);
      btn.classList.toggle('active', active);
    };
    row.appendChild(btn);
  }
  
  sequencer.appendChild(row);
});

// Playback controls
document.getElementById('playBtn').onclick = async () => {
  await drums.initialize();
  await drums.start();
};

document.getElementById('stopBtn').onclick = () => {
  drums.stop();
};

// Visual feedback
drums.onStepPlay((step) => {
  document.querySelectorAll(`[data-step="${step}"]`).forEach(btn => {
    btn.classList.add('playing');
    setTimeout(() => btn.classList.remove('playing'), 100);
  });
});
</script>
```

### React

```jsx
import { useEffect, useRef, useState } from 'react';
import DrumMachineEngine from './drumMachineEngine.js';

function DrumMachine() {
  const engineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pattern, setPattern] = useState({
    kick: new Array(16).fill(false),
    snare: new Array(16).fill(false),
    hihat: new Array(16).fill(false),
    bass: new Array(16).fill(false)
  });
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    engineRef.current = new DrumMachineEngine(120);
    
    engineRef.current.onStepPlay((step) => {
      setCurrentStep(step);
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  const toggleStep = (track, step) => {
    const newState = engineRef.current.toggleStep(track, step);
    setPattern(prev => ({
      ...prev,
      [track]: prev[track].map((val, i) => i === step ? newState : val)
    }));
  };

  const togglePlay = async () => {
    if (!engineRef.current) return;
    
    await engineRef.current.initialize();
    await engineRef.current.toggle();
    setIsPlaying(engineRef.current.isPlaying());
  };

  return (
    <div className="drum-machine">
      <button onClick={togglePlay}>
        {isPlaying ? 'Stop' : 'Play'}
      </button>

      <div className="sequencer">
        {Object.entries(pattern).map(([track, steps]) => (
          <div key={track} className="track">
            <span>{track}</span>
            {steps.map((active, step) => (
              <button
                key={step}
                className={`step ${active ? 'active' : ''} ${step === currentStep ? 'playing' : ''}`}
                onClick={() => toggleStep(track, step)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DrumMachine;
```

### Vue 3

```vue
<template>
  <div class="drum-machine">
    <button @click="togglePlay">
      {{ isPlaying ? 'Stop' : 'Play' }}
    </button>

    <div class="sequencer">
      <div v-for="track in tracks" :key="track" class="track">
        <span>{{ track }}</span>
        <button
          v-for="step in 16"
          :key="step"
          :class="{
            step: true,
            active: pattern[track][step - 1],
            playing: currentStep === step - 1
          }"
          @click="toggleStep(track, step - 1)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import DrumMachineEngine from './drumMachineEngine.js';

const drumMachine = ref(null);
const isPlaying = ref(false);
const currentStep = ref(-1);
const tracks = ['kick', 'snare', 'hihat', 'bass'];
const pattern = ref({
  kick: new Array(16).fill(false),
  snare: new Array(16).fill(false),
  hihat: new Array(16).fill(false),
  bass: new Array(16).fill(false)
});

onMounted(() => {
  drumMachine.value = new DrumMachineEngine(120);
  
  drumMachine.value.onStepPlay((step) => {
    currentStep.value = step;
  });
});

onUnmounted(() => {
  if (drumMachine.value) {
    drumMachine.value.destroy();
  }
});

const toggleStep = (track, step) => {
  const newState = drumMachine.value.toggleStep(track, step);
  pattern.value[track][step] = newState;
};

const togglePlay = async () => {
  await drumMachine.value.initialize();
  await drumMachine.value.toggle();
  isPlaying.value = drumMachine.value.isPlaying();
};
</script>
```

### Svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import DrumMachineEngine from './drumMachineEngine.js';

  let drumMachine;
  let isPlaying = false;
  let currentStep = -1;
  let pattern = {
    kick: new Array(16).fill(false),
    snare: new Array(16).fill(false),
    hihat: new Array(16).fill(false),
    bass: new Array(16).fill(false)
  };

  const tracks = ['kick', 'snare', 'hihat', 'bass'];

  onMount(() => {
    drumMachine = new DrumMachineEngine(120);
    
    drumMachine.onStepPlay((step) => {
      currentStep = step;
    });
  });

  onDestroy(() => {
    if (drumMachine) {
      drumMachine.destroy();
    }
  });

  function toggleStep(track, step) {
    const newState = drumMachine.toggleStep(track, step);
    pattern[track][step] = newState;
  }

  async function togglePlay() {
    await drumMachine.initialize();
    await drumMachine.toggle();
    isPlaying = drumMachine.isPlaying();
  }
</script>

<div class="drum-machine">
  <button on:click={togglePlay}>
    {isPlaying ? 'Stop' : 'Play'}
  </button>

  <div class="sequencer">
    {#each tracks as track}
      <div class="track">
        <span>{track}</span>
        {#each pattern[track] as active, step}
          <button
            class:active
            class:playing={step === currentStep}
            on:click={() => toggleStep(track, step)}
          />
        {/each}
      </div>
    {/each}
  </div>
</div>
```

---

## 🎛️ Common Customizations

### Change Tempo

```javascript
// Set BPM
drumMachine.setBPM(140);

// With UI slider
const bpmSlider = document.getElementById('bpm');
bpmSlider.addEventListener('input', (e) => {
  drumMachine.setBPM(parseInt(e.target.value));
});
```

### Adjust Volumes

```javascript
// Per-track velocity
drumMachine.setTrackVelocity('kick', 1.0);   // Full volume
drumMachine.setTrackVelocity('snare', 0.8);  // 80%
drumMachine.setTrackVelocity('hihat', 0.6);  // 60%
drumMachine.setTrackVelocity('bass', 0.7);   // 70%

// Master volume
drumMachine.setMasterVolume(0.8);
```

### Load Presets

```javascript
// Load preset pattern
drumMachine.loadPreset('funk');

// Create preset selector
const presetSelect = document.getElementById('preset');
drumMachine.getPresets().forEach(preset => {
  const option = document.createElement('option');
  option.value = preset;
  option.textContent = preset;
  presetSelect.appendChild(option);
});

presetSelect.addEventListener('change', (e) => {
  drumMachine.loadPreset(e.target.value);
});
```

### Mute Tracks

```javascript
// Mute/unmute
drumMachine.setTrackEnabled('bass', false); // Mute
drumMachine.setTrackEnabled('bass', true);  // Unmute

// With UI buttons
tracks.forEach(track => {
  const muteBtn = document.getElementById(`mute-${track}`);
  muteBtn.addEventListener('click', () => {
    const enabled = !drumMachine.trackSettings[track].enabled;
    drumMachine.setTrackEnabled(track, enabled);
    muteBtn.classList.toggle('muted', !enabled);
  });
});
```

### Custom Patterns

```javascript
// Save current pattern
const savedPattern = drumMachine.getPattern();
localStorage.setItem('myPattern', JSON.stringify(savedPattern));

// Load saved pattern
const loadedPattern = JSON.parse(localStorage.getItem('myPattern'));
drumMachine.loadPattern(loadedPattern);

// Clear pattern
drumMachine.clearPattern();

// Clear specific track
drumMachine.clearTrack('bass');
```

---

## 🎨 CSS Styling Tips

### Basic Grid Styles

```css
.sequencer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.track {
  display: flex;
  align-items: center;
  gap: 5px;
}

.step {
  width: 40px;
  height: 40px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.step:hover {
  border-color: #667eea;
  transform: scale(1.05);
}

.step.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.step.playing {
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.8);
  transform: scale(1.1);
}

/* Beat markers (every 4 steps) */
.step:nth-child(4n+1) {
  border-width: 3px;
  border-color: #999;
}
```

### Track Colors

```css
.track.kick .step.active { background: #e74c3c; }
.track.snare .step.active { background: #3498db; }
.track.hihat .step.active { background: #f39c12; }
.track.bass .step.active { background: #9b59b6; }
```

---

## 🐛 Common Issues & Solutions

### Issue: No sound plays

**Solution:**
```javascript
// Ensure initialize() is called after user interaction
button.addEventListener('click', async () => {
  await drumMachine.initialize(); // Required!
  await drumMachine.start();
});
```

### Issue: Timing seems off

**Solution:**
```javascript
// Check BPM setting
console.log(drumMachine.getBPM()); // Should be 120

// Verify AudioContext is running
console.log(drumMachine.audioContext.state); // Should be "running"

// Resume if suspended
if (drumMachine.audioContext.state === 'suspended') {
  await drumMachine.audioContext.resume();
}
```

### Issue: Visual updates lag

**Solution:**
```javascript
// Use the visual callback, not the audio callback
drumMachine.onStepPlay((step) => {
  // This runs at 60fps, perfect for UI updates
  updateUI(step);
});

// Don't do this:
drumMachine.scheduler.onStep((step, time) => {
  // This is for audio scheduling only!
  // Don't update UI here
});
```

### Issue: Memory leak

**Solution:**
```javascript
// Always cleanup when done
window.addEventListener('beforeunload', () => {
  drumMachine.destroy();
});

// In React/Vue/Svelte
onDestroy(() => {
  drumMachine.destroy();
});
```

---

## 📱 Mobile Considerations

### Touch Events

```javascript
// Handle touch events
stepButton.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent double-tap zoom
  toggleStep(track, step);
});
```

### Responsive Grid

```css
@media (max-width: 768px) {
  .step {
    width: 30px;
    height: 30px;
  }
}

@media (max-width: 480px) {
  .step {
    width: 20px;
    height: 20px;
  }
}
```

### iOS Audio Context

```javascript
// iOS requires user interaction to start audio
const startAudio = async () => {
  await drumMachine.initialize();
  
  // Play silent sound to "unlock" audio on iOS
  const osc = drumMachine.audioContext.createOscillator();
  const gain = drumMachine.audioContext.createGain();
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(drumMachine.audioContext.destination);
  osc.start();
  osc.stop(drumMachine.audioContext.currentTime + 0.001);
};

document.getElementById('startBtn').addEventListener('click', startAudio);
```

---

## 🚀 Performance Tips

### 1. Minimize Pattern Changes During Playback

```javascript
// Good: Batch changes
drumMachine.stop();
drumMachine.setStep('kick', 0, true);
drumMachine.setStep('kick', 4, true);
drumMachine.setStep('kick', 8, true);
drumMachine.start();

// Also good: Changes during playback are fine,
// but avoid rapid changes in tight loops
```

### 2. Reuse Engine Instance

```javascript
// Good: Create once, reuse
const drumMachine = new DrumMachineEngine(120);

// Bad: Creating multiple instances
// Don't do this in a loop
```

### 3. Cleanup When Done

```javascript
// When navigating away or unmounting component
drumMachine.destroy();
```

---

## 🎓 Next Steps

1. **Try the demo**: Open `drumMachineDemo.html`
2. **Read the docs**: Check `ENGINE_README.md`
3. **Understand internals**: See `TECHNICAL_DEEP_DIVE.md`
4. **Build something**: Integrate into your project
5. **Customize**: Add your own sounds and features

---

## 💬 Need Help?

- Check `ENGINE_README.md` for full API reference
- Read `TECHNICAL_DEEP_DIVE.md` for internals
- Look at `drumMachineDemo.html` for complete example
- Review this integration guide for common patterns

**Happy coding! 🎵**
