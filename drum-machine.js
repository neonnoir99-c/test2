/**
 * Professional Drum Machine
 * Web Audio API-based drum sequencer with sample-accurate timing
 * 120 BPM • 4 tracks × 16 steps • Synthesized drum sounds
 */

class DrumMachine {
    constructor() {
        // Audio context and timing
        this.audioContext = null;
        this.isPlaying = false;
        this.currentStep = 0;
        this.tempo = 120;
        this.lookahead = 25.0; // ms - how far ahead to schedule
        this.scheduleAheadTime = 0.1; // seconds - how far ahead to schedule audio
        this.nextNoteTime = 0.0;
        this.timerID = null;

        // Pattern data (4 tracks × 16 steps)
        this.tracks = ['kick', 'snare', 'hihat', 'bass'];
        this.pattern = {
            kick: new Array(16).fill(false),
            snare: new Array(16).fill(false),
            hihat: new Array(16).fill(false),
            bass: new Array(16).fill(false)
        };

        // Volume settings (0-1 range)
        this.volumes = {
            kick: 0.8,
            snare: 0.7,
            hihat: 0.6,
            bass: 0.75
        };

        // Performance stats
        this.stats = {
            notesScheduled: 0,
            timingErrors: [],
            lastScheduleTime: 0
        };

        // Preset patterns
        this.presets = {
            basic: {
                kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
                snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
                hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
                bass: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
            },
            rock: {
                kick: [1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0],
                snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
                hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                bass: [1,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0]
            },
            funk: {
                kick: [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
                snare: [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],
                hihat: [1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0],
                bass: [1,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0]
            },
            techno: {
                kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
                snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
                hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                bass: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]
            },
            hiphop: {
                kick: [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0],
                snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
                hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
                bass: [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0]
            }
        };

        this.init();
    }

    /**
     * Initialize the drum machine
     */
    async init() {
        this.buildUI();
        this.attachEventListeners();
        this.updateActiveNotesDisplay();
        
        // Wait for user interaction before creating AudioContext
        document.getElementById('loadingOverlay').addEventListener('click', async () => {
            await this.initAudio();
            document.getElementById('loadingOverlay').classList.add('hidden');
        });
    }

    /**
     * Initialize Web Audio API
     */
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            console.log('✅ Audio Context initialized:', this.audioContext.state);
            console.log('Sample Rate:', this.audioContext.sampleRate);
            console.log('Base Latency:', this.audioContext.baseLatency);
        } catch (error) {
            console.error('❌ Failed to initialize Audio Context:', error);
            alert('Failed to initialize audio. Please use a modern browser.');
        }
    }

    /**
     * Build the sequencer UI grid
     */
    buildUI() {
        const grid = document.getElementById('sequencerGrid');
        grid.innerHTML = '';

        this.tracks.forEach(track => {
            // Track label
            const label = document.createElement('div');
            label.className = `track-label ${track}`;
            label.textContent = track.toUpperCase();
            grid.appendChild(label);

            // Step buttons
            for (let step = 0; step < 16; step++) {
                const button = document.createElement('div');
                button.className = 'step';
                if (step % 4 === 0) {
                    button.classList.add('measure-start');
                }
                button.dataset.track = track;
                button.dataset.step = step;
                
                button.addEventListener('click', () => this.toggleStep(track, step));
                
                grid.appendChild(button);
            }
        });
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Transport controls
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearPattern());

        // Volume controls
        ['kick', 'snare', 'hihat', 'bass'].forEach(track => {
            const slider = document.getElementById(`${track}Volume`);
            const display = slider.nextElementSibling;
            
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                this.volumes[track] = value / 100;
                display.textContent = `${value}%`;
            });
        });

        // Preset buttons
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const presetName = e.target.dataset.preset;
                this.loadPreset(presetName);
            });
        });
    }

    /**
     * Toggle step on/off
     */
    toggleStep(track, step) {
        this.pattern[track][step] = !this.pattern[track][step];
        this.updateUI();
        this.updateActiveNotesDisplay();
    }

    /**
     * Update UI to reflect current pattern
     */
    updateUI() {
        this.tracks.forEach(track => {
            for (let step = 0; step < 16; step++) {
                const button = document.querySelector(`[data-track="${track}"][data-step="${step}"]`);
                if (button) {
                    button.classList.toggle('active', this.pattern[track][step]);
                }
            }
        });
    }

    /**
     * Update current step visualization
     */
    updateCurrentStepUI(step) {
        // Remove previous current-step highlighting
        document.querySelectorAll('.current-step').forEach(el => {
            el.classList.remove('current-step');
        });

        // Add current-step highlighting
        document.querySelectorAll(`[data-step="${step}"]`).forEach(el => {
            el.classList.add('current-step');
        });

        // Update step display
        document.getElementById('currentStepDisplay').textContent = step + 1;
    }

    /**
     * Update active notes count
     */
    updateActiveNotesDisplay() {
        let count = 0;
        this.tracks.forEach(track => {
            count += this.pattern[track].filter(v => v).length;
        });
        document.getElementById('activeNotesDisplay').textContent = count;
    }

    /**
     * Clear entire pattern
     */
    clearPattern() {
        if (confirm('Clear all patterns?')) {
            this.tracks.forEach(track => {
                this.pattern[track].fill(false);
            });
            this.updateUI();
            this.updateActiveNotesDisplay();
        }
    }

    /**
     * Load preset pattern
     */
    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        this.tracks.forEach(track => {
            this.pattern[track] = preset[track].map(v => !!v);
        });
        
        this.updateUI();
        this.updateActiveNotesDisplay();
    }

    /**
     * Calculate note timing (16th notes at 120 BPM)
     */
    get secondsPerBeat() {
        return 60.0 / this.tempo;
    }

    get secondsPer16thNote() {
        return this.secondsPerBeat / 4; // 16th notes = quarter note / 4
    }

    /**
     * Schedule note at specific time
     */
    scheduleNote(track, time) {
        const volume = this.volumes[track];
        
        switch(track) {
            case 'kick':
                this.playKick(time, volume);
                break;
            case 'snare':
                this.playSnare(time, volume);
                break;
            case 'hihat':
                this.playHiHat(time, volume);
                break;
            case 'bass':
                this.playBass(time, volume);
                break;
        }

        this.stats.notesScheduled++;
    }

    /**
     * Synthesized Kick Drum
     * Deep, punchy bass drum sound using oscillator pitch sweep
     */
    playKick(time, volume = 0.8) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        // Pitch envelope: 150Hz -> 50Hz
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.05);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);

        // Low-pass filter for warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, time);
        filter.Q.setValueAtTime(1, time);

        // Amplitude envelope
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.3);
    }

    /**
     * Synthesized Snare Drum
     * Crisp snare using noise + oscillator blend
     */
    playSnare(time, volume = 0.7) {
        // Noise component (snare wires)
        const noise = this.createNoiseBuffer();
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noise;
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, time);
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        // Tonal component (drum body)
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        
        const oscGain = this.audioContext.createGain();
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
        
        oscGain.gain.setValueAtTime(volume * 0.3, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.audioContext.destination);

        noiseSource.start(time);
        noiseSource.stop(time + 0.15);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    /**
     * Synthesized Hi-Hat
     * Metallic high-frequency noise burst
     */
    playHiHat(time, volume = 0.6) {
        const noise = this.createNoiseBuffer();
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noise;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);
        filter.Q.setValueAtTime(1, time);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        noiseSource.start(time);
        noiseSource.stop(time + 0.05);
    }

    /**
     * Synthesized Bass
     * Deep sub-bass tone
     */
    playBass(time, volume = 0.75) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, time); // A1 note

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.4);
    }

    /**
     * Create white noise buffer for snare/hihat
     */
    createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        return buffer;
    }

    /**
     * Scheduler - called repeatedly to schedule notes ahead of time
     */
    scheduler() {
        // Schedule all notes that need to play before nextNoteTime + scheduleAheadTime
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleCurrentStep(this.nextNoteTime);
            this.nextNote();
        }

        this.stats.lastScheduleTime = this.audioContext.currentTime;
    }

    /**
     * Schedule all active notes for current step
     */
    scheduleCurrentStep(time) {
        this.tracks.forEach(track => {
            if (this.pattern[track][this.currentStep]) {
                this.scheduleNote(track, time);
                
                // Visual feedback (schedule slightly ahead for UI)
                const button = document.querySelector(
                    `[data-track="${track}"][data-step="${this.currentStep}"]`
                );
                if (button) {
                    const delay = (time - this.audioContext.currentTime) * 1000;
                    setTimeout(() => {
                        button.classList.add('playing');
                        setTimeout(() => button.classList.remove('playing'), 100);
                    }, Math.max(0, delay));
                }
            }
        });

        // Update current step UI
        const delay = (time - this.audioContext.currentTime) * 1000;
        setTimeout(() => {
            this.updateCurrentStepUI(this.currentStep);
        }, Math.max(0, delay));
    }

    /**
     * Advance to next note
     */
    nextNote() {
        this.nextNoteTime += this.secondsPer16thNote;
        this.currentStep = (this.currentStep + 1) % 16;
    }

    /**
     * Start playback
     */
    play() {
        if (!this.audioContext) {
            alert('Please click the loading screen first to initialize audio.');
            return;
        }

        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.005; // Start slightly ahead
        
        this.scheduler(); // Schedule first batch
        this.timerID = setInterval(() => this.scheduler(), this.lookahead);

        // Update UI
        document.getElementById('playBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        
        console.log('▶️ Playback started');
    }

    /**
     * Stop playback
     */
    stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        clearInterval(this.timerID);
        this.currentStep = 0;

        // Clear current step highlighting
        document.querySelectorAll('.current-step').forEach(el => {
            el.classList.remove('current-step');
        });

        // Update UI
        document.getElementById('playBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('currentStepDisplay').textContent = '0';

        console.log('⏹️ Playback stopped');
        console.log('📊 Notes scheduled:', this.stats.notesScheduled);
    }
}

// Initialize drum machine when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.drumMachine = new DrumMachine();
    });
} else {
    window.drumMachine = new DrumMachine();
}

// Prevent memory leaks on page unload
window.addEventListener('beforeunload', () => {
    if (window.drumMachine && window.drumMachine.audioContext) {
        window.drumMachine.stop();
        window.drumMachine.audioContext.close();
    }
});
