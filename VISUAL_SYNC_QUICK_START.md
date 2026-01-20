# Visual Sync - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Include Files

```html
<!-- CSS for visual effects -->
<link rel="stylesheet" href="visualSync.css">

<!-- JavaScript module -->
<script type="module">
  import VisualSyncEngine from './visualSyncEngine.js';
  import DrumMachineEngine from './drumMachineEngine.js';
</script>
```

### Step 2: Initialize Engines

```javascript
// Create audio engine
const drumEngine = new DrumMachineEngine(120); // 120 BPM
await drumEngine.initialize();

// Create visual sync engine
const visualSync = new VisualSyncEngine(drumEngine);
```

### Step 3: Register Grid Elements

```javascript
// Collect your grid elements
const gridElements = {
  kick: [],
  snare: [],
  hihat: [],
  bass: []
};

document.querySelectorAll('.grid-cell').forEach(cell => {
  const track = cell.dataset.track;
  const step = parseInt(cell.dataset.step);
  gridElements[track][step] = cell;
});

// Initialize visual sync
visualSync.initialize(gridElements);
```

### Step 4: Start Playback

```javascript
// Start both engines together
await drumEngine.start();
visualSync.start();

// Stop both engines
drumEngine.stop();
visualSync.stop();
```

## 🎨 HTML Structure

Your grid cells need these data attributes:

```html
<div class="grid-cell kick" data-track="kick" data-step="0"></div>
<div class="grid-cell kick" data-track="kick" data-step="1"></div>
<!-- ... more cells ... -->
```

**Required attributes**:
- `data-track`: Track name (kick, snare, hihat, bass)
- `data-step`: Step number (0-15)

**Required class**:
- `grid-cell`: Base styling class

## 🎯 Basic CSS

Minimum CSS needed:

```css
.grid-cell {
  position: relative;
  transition: transform 0.05s ease-out;
  transform: translateZ(0); /* Enable GPU */
  backface-visibility: hidden;
}
```

The rest is handled by `visualSync.css`.

## ⚙️ Configuration Options

### Change Visual Mode

```javascript
// Available modes: 'highlight', 'pulse', 'glow', 'minimal'
visualSync.setFeedbackMode('pulse');
```

### Toggle Features

```javascript
// Show/hide active note indicators
visualSync.toggleActiveNotes(true);

// Show/hide beat markers
visualSync.toggleBeatMarkers(true);
```

### Add Callbacks

```javascript
// Called on every step change
visualSync.onStepChange = (currentStep, previousStep) => {
  console.log(`Step changed: ${previousStep} → ${currentStep}`);
};

// Called on every beat (every 4 steps)
visualSync.onBeatChange = (beat) => {
  console.log(`Beat: ${beat}`);
};
```

## 📊 Common Patterns

### Play/Stop Button

```javascript
let isPlaying = false;

playButton.addEventListener('click', async () => {
  if (!isPlaying) {
    await drumEngine.start();
    visualSync.start();
    playButton.textContent = '⏸️ Pause';
  } else {
    drumEngine.stop();
    visualSync.stop();
    playButton.textContent = '▶️ Play';
  }
  isPlaying = !isPlaying;
});
```

### BPM Control

```javascript
bpmSlider.addEventListener('input', (e) => {
  const bpm = parseInt(e.target.value);
  drumEngine.setBPM(bpm);
  bpmDisplay.textContent = bpm;
});
```

### Visual Mode Selector

```javascript
modeSelect.addEventListener('change', (e) => {
  visualSync.setFeedbackMode(e.target.value);
});
```

### Step Display

```javascript
drumEngine.onStepPlay((step) => {
  stepDisplay.textContent = `Step: ${step + 1}/16`;
  beatDisplay.textContent = `Beat: ${Math.floor(step / 4) + 1}/4`;
});
```

## 🐛 Troubleshooting

### Visual not syncing?

```javascript
// Check if engines are connected
console.log('Audio playing:', drumEngine.isPlaying);
console.log('Visual running:', visualSync.isRunning);
console.log('Current step:', drumEngine.currentStep);
```

### Performance issues?

```javascript
// Switch to minimal mode
visualSync.setFeedbackMode('minimal');

// Check metrics
console.log(visualSync.getMetrics());
```

### Elements not highlighting?

```javascript
// Verify element registration
console.log('Registered cells:', 
  Object.values(visualSync.gridElements).flat().filter(Boolean).length
);
// Should be 64 (4 tracks × 16 steps)
```

## 🎓 Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="visualSync.css">
  <style>
    .grid-cell {
      width: 50px;
      height: 50px;
      background: #333;
      border: 1px solid #555;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <button id="play">▶️ Play</button>
  <select id="mode">
    <option value="highlight">Highlight</option>
    <option value="pulse">Pulse</option>
    <option value="glow">Glow</option>
    <option value="minimal">Minimal</option>
  </select>
  
  <div id="grid">
    <!-- 4 tracks × 16 steps -->
    <div class="track">
      <div class="grid-cell" data-track="kick" data-step="0"></div>
      <!-- ... 15 more cells ... -->
    </div>
    <!-- ... 3 more tracks ... -->
  </div>

  <script type="module">
    import VisualSyncEngine from './visualSyncEngine.js';
    import DrumMachineEngine from './drumMachineEngine.js';

    // Initialize
    const drum = new DrumMachineEngine(120);
    const visual = new VisualSyncEngine(drum);
    
    await drum.initialize();
    
    // Register cells
    const cells = { kick: [], snare: [], hihat: [], bass: [] };
    document.querySelectorAll('.grid-cell').forEach(cell => {
      const track = cell.dataset.track;
      const step = parseInt(cell.dataset.step);
      cells[track][step] = cell;
    });
    visual.initialize(cells);

    // Controls
    document.getElementById('play').onclick = async () => {
      if (!drum.isPlaying) {
        await drum.start();
        visual.start();
      } else {
        drum.stop();
        visual.stop();
      }
    };

    document.getElementById('mode').onchange = (e) => {
      visual.setFeedbackMode(e.target.value);
    };
  </script>
</body>
</html>
```

## 📱 Mobile Considerations

### Touch Events

```javascript
// Add touch support
gridCell.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent double-tap zoom
  toggleStep(track, step);
});
```

### Viewport Meta

```html
<meta name="viewport" content="width=device-width, initial-scale=1, 
      maximum-scale=1, user-scalable=no">
```

### Reduced Motion

Automatically handled by CSS:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled automatically */
}
```

## 🔧 Advanced Usage

### Custom Visual Effects

```javascript
// Override highlight method
visualSync._highlightStep = function(step) {
  // Your custom highlighting logic
  this.gridElements.kick[step]?.classList.add('my-custom-class');
};
```

### Multiple Visual Engines

```javascript
// Different visual modes for different sections
const mainVisual = new VisualSyncEngine(drumEngine);
const miniVisual = new VisualSyncEngine(drumEngine);

mainVisual.setFeedbackMode('pulse');
miniVisual.setFeedbackMode('minimal');
```

### Performance Monitoring

```javascript
// Track frame rate
let frames = 0;
setInterval(() => {
  console.log(`FPS: ${frames}`);
  frames = 0;
}, 1000);

visualSync._startVisualLoop = function() {
  const update = () => {
    frames++;
    // ... rest of update logic
  };
  requestAnimationFrame(update);
};
```

## ✅ Checklist

Before deploying:

- [ ] Audio engine initialized
- [ ] Visual engine initialized
- [ ] All 64 cells registered (4×16)
- [ ] CSS file included
- [ ] Visual mode set
- [ ] Callbacks configured (optional)
- [ ] Tested on target browsers
- [ ] Tested on mobile devices
- [ ] Performance acceptable (<1% CPU)

## 🆘 Support

### Common Issues

**Q: Visual lags behind audio**  
A: This is expected (<16ms). Audio is authoritative.

**Q: High CPU usage**  
A: Switch to 'minimal' mode or check for other scripts.

**Q: Not working in Safari**  
A: Ensure AudioContext is resumed on user gesture.

**Q: Animations stuttering**  
A: Check for long-running JavaScript on main thread.

### Debug Mode

```javascript
// Enable verbose logging
visualSync.debugMode = true;

// Check registration
console.table(visualSync.gridElements);

// Monitor updates
visualSync.onStepChange = (curr, prev) => {
  console.log(`${prev} → ${curr}`, performance.now());
};
```

## 📚 Next Steps

1. ✅ Basic integration working
2. 🎨 Customize visual styles
3. 🎵 Add preset patterns
4. 📱 Test on mobile
5. 🚀 Deploy to production

See `VISUAL_SYNC_IMPLEMENTATION.md` for detailed architecture and performance analysis.

---

**Ready to rock!** 🎸🥁

Your drum machine now has lag-free visual feedback that stays perfectly in sync with the audio, even under heavy load.
