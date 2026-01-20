# 🚀 Browser Testing Quick Reference

## 📋 Quick Test Checklist

### Chrome ✅
```
□ Open drum machine
□ Click overlay to init audio
□ Click Play
□ Verify sound plays
□ Check timing stays consistent
□ Test for 60 seconds
□ No errors in console
```

### Firefox ✅
```
□ Open drum machine
□ Click overlay to init audio
□ Click Play
□ Verify sound plays
□ Check timing stays consistent
□ Test for 60 seconds
□ No errors in console
```

### Safari (Desktop) ⚠️
```
□ Open drum machine
□ Click overlay to init audio
□ Wait for "running" state
□ Click Play
□ Verify sound plays
□ Check timing stays consistent
□ Test for 60 seconds
□ No errors in console
```

### Safari (iOS) ⚠️
```
□ Open drum machine
□ Tap overlay to init audio
□ Wait for "running" state
□ Tap Play
□ Verify sound plays
□ Test in portrait/landscape
□ Test with screen rotation
□ Check battery usage
```

---

## ⚡ Quick Commands

### Open Test Suite
```bash
# Automated tests
open cross-browser-test-suite.html

# Browser compatibility
open browser-compatibility-test.html

# Main application
open drum-machine-complete-fixed.html
```

### Console Commands
```javascript
// Check audio state
drumMachine.audioContext.state

// Force resume
await drumMachine.audioContext.resume()

// Check stats
drumMachine.stats

// Check sample rate
drumMachine.audioContext.sampleRate
```

---

## 📊 Expected Results

### Chrome
- Timing: <0.5ms
- Latency: 10-20ms
- FPS: 60
- Score: 95-100%

### Firefox
- Timing: <0.8ms
- Latency: 20-30ms
- FPS: 60
- Score: 90-95%

### Safari
- Timing: <1.0ms
- Latency: 30-50ms
- FPS: 58-60
- Score: 85-90%

### iOS Safari
- Timing: <2.0ms
- Latency: 50-100ms
- FPS: 55-60
- Score: 75-85%

---

## 🐛 Quick Fixes

### No Sound
```javascript
await audioContext.resume()
```

### Safari Won't Start
```javascript
// Add loading overlay
<div id="overlay" onclick="initAudio()">
  Click to Start
</div>
```

### Timing Drift
```javascript
// Use currentTime
nextNoteTime = audioContext.currentTime + interval
```

### iOS Background Stop
```javascript
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        audioContext.resume()
    }
})
```

---

## ✅ Pass Criteria

### Must Pass
- [x] Audio plays
- [x] No errors
- [x] Drift < 10ms
- [x] FPS > 50

### Should Pass
- [x] Timing < 1ms
- [x] Latency < 50ms
- [x] FPS ≥ 55

---

## 📱 Mobile Testing

### iOS
1. Test on real device
2. Use Safari only
3. Tap to initialize
4. Test portrait/landscape
5. Check battery impact

### Android
1. Test on real device
2. Use Chrome
3. Tap to initialize
4. Test portrait/landscape
5. Check battery impact

---

## 🎯 Test Priority

### Priority 1 (Critical)
1. Audio initialization
2. Basic playback
3. Timing accuracy
4. No console errors

### Priority 2 (Important)
1. Pattern editing
2. Volume controls
3. Visual sync
4. Performance

### Priority 3 (Nice to Have)
1. Preset loading
2. Long-term stability
3. Edge cases
4. Mobile optimization

---

## 📁 Files

```
cross-browser-test-suite.html       # Auto tests
browser-compatibility-test.html     # Browser check
CROSS_BROWSER_TEST_GUIDE.md        # Full guide
CROSS_BROWSER_TESTING_SUMMARY.md   # Results
```

---

## 🚀 Quick Start

1. **Open**: `cross-browser-test-suite.html`
2. **Click**: Anywhere to init audio
3. **Run**: "Run All Tests" button
4. **Wait**: ~2.5 minutes
5. **Review**: Check all metrics pass

---

## 💡 Tips

- Always test on real devices
- Document browser versions
- Export test reports
- Compare across browsers
- Test edge cases
- Monitor performance

---

**Quick Reference v1.0** | Last Updated: 2024
