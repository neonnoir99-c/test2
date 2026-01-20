/**
 * Automated Test Runner for Drum Machine
 * 
 * This script can be used with headless browsers for automated testing
 * in CI/CD pipelines or for batch testing across multiple browsers.
 * 
 * Usage with Puppeteer:
 *   const results = await runAutomatedTests();
 * 
 * Usage with Playwright:
 *   const results = await runAutomatedTests();
 */

class AutomatedTestRunner {
    constructor(config = {}) {
        this.config = {
            timingTestDuration: config.timingTestDuration || 60000, // 60 seconds
            audioTestDuration: config.audioTestDuration || 60000,   // 60 seconds
            uiTestDuration: config.uiTestDuration || 10000,         // 10 seconds
            bpm: config.bpm || 120,
            verbose: config.verbose !== undefined ? config.verbose : true,
            ...config
        };

        this.results = {
            browser: {},
            timing: null,
            audio: null,
            ui: null,
            overall: null
        };

        this.audioContext = null;
        this.masterGain = null;
    }

    /**
     * Initialize audio context
     */
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.1; // Low volume for automated testing
            this.masterGain.connect(this.audioContext.destination);

            this.log('Audio context initialized', 'success');
            return true;
        } catch (error) {
            this.log(`Audio initialization failed: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Detect browser information
     */
    detectBrowser() {
        const ua = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';

        if (ua.indexOf('HeadlessChrome') > -1) {
            browserName = 'Chrome (Headless)';
            browserVersion = ua.match(/HeadlessChrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
            browserName = 'Chrome';
            browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Edg') > -1) {
            browserName = 'Edge';
            browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
            browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
            browserName = 'Safari';
            browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        }

        this.results.browser = {
            name: browserName,
            version: browserVersion,
            platform: navigator.platform,
            userAgent: ua,
            sampleRate: this.audioContext?.sampleRate || 'N/A',
            timestamp: new Date().toISOString()
        };

        this.log(`Browser: ${browserName} ${browserVersion}`, 'info');
        return this.results.browser;
    }

    /**
     * Test 1: Timing Accuracy
     */
    async testTimingAccuracy() {
        this.log('Starting timing accuracy test...', 'info');

        return new Promise((resolve) => {
            const bpm = this.config.bpm;
            const stepDuration = 60 / bpm / 4; // 16th notes
            const testDuration = this.config.timingTestDuration / 1000;
            const expectedSteps = Math.floor(testDuration / stepDuration);

            const timingData = [];
            let currentStep = 0;
            let nextNoteTime = this.audioContext.currentTime;
            const testStartTime = this.audioContext.currentTime;

            const scheduleNote = (time, stepIndex) => {
                timingData.push({
                    scheduled: time,
                    expected: testStartTime + (stepIndex * stepDuration),
                    step: stepIndex
                });

                // Trigger sound (simplified for testing)
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.frequency.value = 440;
                gain.gain.setValueAtTime(0.01, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(time);
                osc.stop(time + 0.05);
            };

            const scheduler = () => {
                while (nextNoteTime < this.audioContext.currentTime + 0.1 && currentStep < expectedSteps) {
                    scheduleNote(nextNoteTime, currentStep);
                    nextNoteTime += stepDuration;
                    currentStep++;
                }

                if (currentStep < expectedSteps) {
                    setTimeout(scheduler, 25);
                } else {
                    setTimeout(() => {
                        const results = this.analyzeTimingData(timingData, testStartTime, expectedSteps, stepDuration);
                        this.results.timing = results;
                        resolve(results);
                    }, 1000);
                }
            };

            scheduler();
        });
    }

    /**
     * Analyze timing test data
     */
    analyzeTimingData(timingData, startTime, expectedSteps, stepDuration) {
        const errors = timingData.map(d => {
            const expectedTime = startTime + (d.step * stepDuration);
            return Math.abs(d.scheduled - expectedTime) * 1000; // Convert to ms
        });

        const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
        const variance = errors.reduce((sum, err) => sum + Math.pow(err - avgError, 2), 0) / errors.length;
        const jitter = Math.sqrt(variance);

        const lastData = timingData[timingData.length - 1];
        const expectedEndTime = startTime + (expectedSteps * stepDuration);
        const drift = Math.abs(lastData.scheduled - expectedEndTime) * 1000;

        const passed = avgError < 1 && jitter < 0.5 && drift < 5;

        const results = {
            avgError: parseFloat(avgError.toFixed(4)),
            jitter: parseFloat(jitter.toFixed(4)),
            drift: parseFloat(drift.toFixed(4)),
            stepsCompleted: timingData.length,
            expectedSteps,
            passed,
            grade: this.calculateGrade(avgError, 1, jitter, 0.5, drift, 5)
        };

        this.log(`Timing Test: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
        this.log(`  Avg Error: ${results.avgError}ms, Jitter: ${results.jitter}ms, Drift: ${results.drift}ms`, 'info');

        return results;
    }

    /**
     * Test 2: Audio Quality
     */
    async testAudioQuality() {
        this.log('Starting audio quality test...', 'info');

        return new Promise((resolve) => {
            const analyzer = this.audioContext.createAnalyser();
            analyzer.fftSize = 2048;
            this.masterGain.connect(analyzer);

            const bufferLength = analyzer.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            let soundsTriggered = 0;
            let bufferUnderruns = 0;
            let lastLevel = 0;
            let levelReadings = [];

            // Schedule test sounds
            const testPattern = [
                { time: 0, freq: 150 },     // Kick
                { time: 0.25, freq: 200 },  // Snare
                { time: 0.5, freq: 300 },   // Hi-hat
                { time: 0.75, freq: 100 }   // Bass
            ];

            const startTime = this.audioContext.currentTime + 0.1;
            const iterations = Math.floor(this.config.audioTestDuration / 2000);

            for (let i = 0; i < iterations; i++) {
                testPattern.forEach(({ time, freq }) => {
                    const scheduleTime = startTime + (i * 1) + time;
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.05, scheduleTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, scheduleTime + 0.1);
                    osc.connect(gain);
                    gain.connect(this.masterGain);
                    osc.start(scheduleTime);
                    osc.stop(scheduleTime + 0.1);
                    soundsTriggered++;
                });
            }

            // Monitor audio levels
            const monitorInterval = setInterval(() => {
                analyzer.getByteTimeDomainData(dataArray);
                const currentLevel = dataArray.reduce((a, b) => a + Math.abs(b - 128), 0);
                levelReadings.push(currentLevel);

                if (soundsTriggered > 10 && currentLevel < 100 && lastLevel < 100) {
                    bufferUnderruns++;
                }
                lastLevel = currentLevel;
            }, 50);

            // Finish test
            setTimeout(() => {
                clearInterval(monitorInterval);

                const latency = ((this.audioContext.baseLatency || 0) + 
                               (this.audioContext.outputLatency || 0)) * 1000;

                let qualityScore = 100;
                if (latency > 50) qualityScore -= 20;
                else if (latency > 30) qualityScore -= 10;
                if (bufferUnderruns > 0) qualityScore -= (bufferUnderruns * 5);
                qualityScore = Math.max(0, qualityScore);

                const passed = latency < 50 && bufferUnderruns === 0 && qualityScore >= 70;

                const results = {
                    latency: parseFloat(latency.toFixed(2)),
                    bufferUnderruns,
                    soundsTriggered,
                    qualityScore,
                    avgLevel: levelReadings.reduce((a, b) => a + b, 0) / levelReadings.length,
                    passed,
                    grade: this.calculateGrade(latency, 50, bufferUnderruns, 0, 100 - qualityScore, 30)
                };

                this.log(`Audio Test: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
                this.log(`  Latency: ${results.latency}ms, Underruns: ${bufferUnderruns}, Score: ${qualityScore}`, 'info');

                this.results.audio = results;
                resolve(results);
            }, this.config.audioTestDuration + 1000);
        });
    }

    /**
     * Test 3: UI Responsiveness
     */
    async testUIResponsiveness() {
        this.log('Starting UI responsiveness test...', 'info');

        return new Promise((resolve) => {
            let frameCount = 0;
            let droppedFrames = 0;
            let lastFrameTime = performance.now();
            const frameTimes = [];
            const visualLags = [];

            const startTime = performance.now();
            let currentStep = 0;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                if (elapsed >= this.config.uiTestDuration) {
                    const results = this.analyzeUIData(frameCount, droppedFrames, frameTimes, visualLags);
                    this.results.ui = results;
                    resolve(results);
                    return;
                }

                frameCount++;

                const frameTime = currentTime - lastFrameTime;
                frameTimes.push(frameTime);

                if (frameTime > 20) { // Dropped frame at 60fps
                    droppedFrames++;
                }

                lastFrameTime = currentTime;

                // Simulate visual update
                const expectedStep = Math.floor((elapsed / 1000) * 8) % 16;
                if (expectedStep !== currentStep) {
                    const visualUpdateTime = performance.now();
                    const expectedUpdateTime = startTime + (expectedStep * 125);
                    const lag = Math.abs(visualUpdateTime - expectedUpdateTime);
                    visualLags.push(lag);
                    currentStep = expectedStep;
                }

                requestAnimationFrame(animate);
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Analyze UI test data
     */
    analyzeUIData(frameCount, droppedFrames, frameTimes, visualLags) {
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const fps = 1000 / avgFrameTime;
        const dropRate = (droppedFrames / frameCount) * 100;
        const avgVisualLag = visualLags.length > 0 
            ? visualLags.reduce((a, b) => a + b, 0) / visualLags.length 
            : 0;

        const passed = fps >= 55 && avgVisualLag < 50 && dropRate < 5;

        const results = {
            fps: parseFloat(fps.toFixed(2)),
            avgVisualLag: parseFloat(avgVisualLag.toFixed(2)),
            dropRate: parseFloat(dropRate.toFixed(2)),
            frameCount,
            droppedFrames,
            passed,
            grade: this.calculateGrade(60 - fps, 5, avgVisualLag, 50, dropRate, 5)
        };

        this.log(`UI Test: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
        this.log(`  FPS: ${results.fps}, Visual Lag: ${results.avgVisualLag}ms, Drop Rate: ${results.dropRate}%`, 'info');

        return results;
    }

    /**
     * Calculate grade (A-F)
     */
    calculateGrade(...metrics) {
        let score = 100;
        for (let i = 0; i < metrics.length; i += 2) {
            const value = metrics[i];
            const threshold = metrics[i + 1];
            const ratio = value / threshold;
            if (ratio > 1) {
                score -= (ratio - 1) * 30;
            }
        }
        score = Math.max(0, Math.min(100, score));

        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        this.log('=== Starting Automated Test Suite ===', 'info');
        const overallStartTime = performance.now();

        try {
            // Initialize
            const audioInitialized = await this.initAudio();
            if (!audioInitialized) {
                throw new Error('Audio initialization failed');
            }

            this.detectBrowser();

            // Run tests sequentially
            await this.testTimingAccuracy();
            await this.testAudioQuality();
            await this.testUIResponsiveness();

            // Calculate overall results
            const overallElapsed = performance.now() - overallStartTime;
            const testsPassed = [
                this.results.timing?.passed,
                this.results.audio?.passed,
                this.results.ui?.passed
            ].filter(p => p === true).length;

            const testsTotal = 3;
            const overallScore = (testsPassed / testsTotal) * 100;

            this.results.overall = {
                passed: testsPassed,
                failed: testsTotal - testsPassed,
                total: testsTotal,
                score: overallScore,
                grade: overallScore >= 90 ? 'A' : 
                       overallScore >= 80 ? 'B' : 
                       overallScore >= 70 ? 'C' : 
                       overallScore >= 60 ? 'D' : 'F',
                duration: parseFloat((overallElapsed / 1000).toFixed(2)),
                success: testsPassed === testsTotal
            };

            this.log('=== Test Suite Complete ===', 'info');
            this.log(`Overall Score: ${overallScore.toFixed(0)}% (${testsPassed}/${testsTotal} passed)`, 
                     this.results.overall.success ? 'success' : 'error');

            return this.results;

        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'error');
            this.results.overall = {
                success: false,
                error: error.message
            };
            return this.results;
        }
    }

    /**
     * Generate JSON report
     */
    generateJSONReport() {
        return JSON.stringify(this.results, null, 2);
    }

    /**
     * Generate Markdown report
     */
    generateMarkdownReport() {
        const { browser, timing, audio, ui, overall } = this.results;

        let report = `# Automated Test Report\n\n`;
        report += `**Date**: ${new Date().toISOString()}\n`;
        report += `**Browser**: ${browser.name} ${browser.version}\n`;
        report += `**Platform**: ${browser.platform}\n`;
        report += `**Sample Rate**: ${browser.sampleRate} Hz\n\n`;

        report += `## Overall Results\n\n`;
        report += `- **Score**: ${overall.score.toFixed(0)}%\n`;
        report += `- **Grade**: ${overall.grade}\n`;
        report += `- **Status**: ${overall.success ? '✅ PASSED' : '❌ FAILED'}\n`;
        report += `- **Tests Passed**: ${overall.passed}/${overall.total}\n`;
        report += `- **Duration**: ${overall.duration}s\n\n`;

        report += `## Test Results\n\n`;

        report += `### 1. Timing Accuracy ${timing.passed ? '✅' : '❌'}\n\n`;
        report += `| Metric | Value | Target | Status |\n`;
        report += `|--------|-------|--------|--------|\n`;
        report += `| Avg Error | ${timing.avgError}ms | <1ms | ${timing.avgError < 1 ? '✅' : '❌'} |\n`;
        report += `| Jitter | ${timing.jitter}ms | <0.5ms | ${timing.jitter < 0.5 ? '✅' : '❌'} |\n`;
        report += `| Drift | ${timing.drift}ms | <5ms | ${timing.drift < 5 ? '✅' : '❌'} |\n`;
        report += `| Steps | ${timing.stepsCompleted}/${timing.expectedSteps} | ${timing.expectedSteps} | ${timing.stepsCompleted === timing.expectedSteps ? '✅' : '❌'} |\n\n`;

        report += `### 2. Audio Quality ${audio.passed ? '✅' : '❌'}\n\n`;
        report += `| Metric | Value | Target | Status |\n`;
        report += `|--------|-------|--------|--------|\n`;
        report += `| Latency | ${audio.latency}ms | <50ms | ${audio.latency < 50 ? '✅' : '❌'} |\n`;
        report += `| Buffer Underruns | ${audio.bufferUnderruns} | 0 | ${audio.bufferUnderruns === 0 ? '✅' : '❌'} |\n`;
        report += `| Quality Score | ${audio.qualityScore}/100 | ≥70 | ${audio.qualityScore >= 70 ? '✅' : '❌'} |\n`;
        report += `| Sounds Triggered | ${audio.soundsTriggered} | - | ✅ |\n\n`;

        report += `### 3. UI Responsiveness ${ui.passed ? '✅' : '❌'}\n\n`;
        report += `| Metric | Value | Target | Status |\n`;
        report += `|--------|-------|--------|--------|\n`;
        report += `| Frame Rate | ${ui.fps}fps | ≥55fps | ${ui.fps >= 55 ? '✅' : '❌'} |\n`;
        report += `| Visual Lag | ${ui.avgVisualLag}ms | <50ms | ${ui.avgVisualLag < 50 ? '✅' : '❌'} |\n`;
        report += `| Dropped Frames | ${ui.dropRate}% | <5% | ${ui.dropRate < 5 ? '✅' : '❌'} |\n`;
        report += `| Total Frames | ${ui.frameCount} | - | ✅ |\n\n`;

        return report;
    }

    /**
     * Generate HTML report
     */
    generateHTMLReport() {
        const md = this.generateMarkdownReport();
        // Simple markdown to HTML conversion
        return `<!DOCTYPE html>
<html>
<head>
    <title>Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        h1, h2, h3 { color: #333; }
        .pass { color: green; }
        .fail { color: red; }
    </style>
</head>
<body>
    <pre>${md}</pre>
</body>
</html>`;
    }

    /**
     * Logging utility
     */
    log(message, type = 'info') {
        if (!this.config.verbose) return;

        const timestamp = new Date().toISOString();
        const prefix = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        }[type] || 'ℹ️';

        console.log(`[${timestamp}] ${prefix} ${message}`);
    }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedTestRunner;
}

// Browser global
if (typeof window !== 'undefined') {
    window.AutomatedTestRunner = AutomatedTestRunner;
}

/**
 * Example usage in browser console or test script:
 * 
 * const runner = new AutomatedTestRunner({
 *     verbose: true,
 *     bpm: 120
 * });
 * 
 * const results = await runner.runAllTests();
 * console.log(runner.generateMarkdownReport());
 */
