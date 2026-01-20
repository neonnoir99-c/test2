/**
 * Audio Debug Logger - Comprehensive Debugging Instrumentation
 * 
 * Provides detailed logging and monitoring for Web Audio API operations:
 * - AudioContext state changes and lifecycle
 * - Scheduled audio events with timing validation
 * - Audio node creation and connection graph
 * - Performance metrics and timing analysis
 * - Error tracking and diagnostics
 * 
 * Usage:
 *   const debugLogger = new AudioDebugLogger({ enabled: true, verbose: true });
 *   debugLogger.wrapAudioContext(audioContext);
 *   debugLogger.logScheduledNote('kick', time, 0.8);
 *   debugLogger.generateReport();
 */

class AudioDebugLogger {
    constructor(options = {}) {
        this.enabled = options.enabled !== false; // Default: true
        this.verbose = options.verbose || false;
        this.logToConsole = options.logToConsole !== false; // Default: true
        this.logToDOM = options.logToDOM || false;
        this.maxLogEntries = options.maxLogEntries || 1000;
        
        // Log storage
        this.logs = [];
        this.contextStates = [];
        this.scheduledEvents = [];
        this.audioNodes = [];
        this.connections = [];
        this.errors = [];
        this.warnings = [];
        
        // Performance tracking
        this.metrics = {
            contextCreatedAt: null,
            contextStartedAt: null,
            totalNodesCreated: 0,
            totalEventsScheduled: 0,
            totalErrors: 0,
            totalWarnings: 0,
            timingDrift: [],
            latencyMeasurements: []
        };
        
        // State tracking
        this.wrappedContext = null;
        this.startTime = Date.now();
        this.nodeIdCounter = 0;
        
        // DOM element for live logging
        this.logElement = null;
        
        this._init();
    }

    /**
     * Initialize the logger
     */
    _init() {
        if (!this.enabled) return;
        
        this._log('🔧 AudioDebugLogger initialized', {
            verbose: this.verbose,
            logToConsole: this.logToConsole,
            logToDOM: this.logToDOM,
            startTime: new Date().toISOString()
        });
        
        if (this.logToDOM) {
            this._createLogElement();
        }
    }

    /**
     * Create DOM element for live logging
     */
    _createLogElement() {
        this.logElement = document.createElement('div');
        this.logElement.id = 'audio-debug-log';
        this.logElement.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 400px;
            max-height: 300px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            padding: 10px;
            border: 1px solid #0f0;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        `;
        document.body.appendChild(this.logElement);
    }

    /**
     * Internal logging method
     */
    _log(message, data = null, level = 'info') {
        if (!this.enabled) return;
        
        const timestamp = Date.now() - this.startTime;
        const entry = {
            timestamp,
            level,
            message,
            data,
            time: new Date().toISOString()
        };
        
        this.logs.push(entry);
        
        // Trim logs if exceeded max
        if (this.logs.length > this.maxLogEntries) {
            this.logs.shift();
        }
        
        // Console output
        if (this.logToConsole) {
            const prefix = this._getLevelPrefix(level);
            const timeStr = `[${(timestamp / 1000).toFixed(3)}s]`;
            
            if (data && this.verbose) {
                console.log(`${prefix} ${timeStr} ${message}`, data);
            } else {
                console.log(`${prefix} ${timeStr} ${message}`);
            }
        }
        
        // DOM output
        if (this.logToDOM && this.logElement) {
            const logLine = document.createElement('div');
            logLine.style.marginBottom = '2px';
            logLine.style.color = this._getLevelColor(level);
            logLine.textContent = `[${(timestamp / 1000).toFixed(3)}s] ${message}`;
            this.logElement.appendChild(logLine);
            this.logElement.scrollTop = this.logElement.scrollHeight;
        }
    }

    _getLevelPrefix(level) {
        const prefixes = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            debug: '🔍',
            audio: '🎵',
            timing: '⏱️',
            node: '🔊'
        };
        return prefixes[level] || 'ℹ️';
    }

    _getLevelColor(level) {
        const colors = {
            info: '#0ff',
            success: '#0f0',
            warning: '#ff0',
            error: '#f00',
            debug: '#888',
            audio: '#0f0',
            timing: '#f0f',
            node: '#fa0'
        };
        return colors[level] || '#0ff';
    }

    /**
     * Wrap AudioContext to monitor all operations
     */
    wrapAudioContext(audioContext) {
        if (!this.enabled || !audioContext) return audioContext;
        
        this.wrappedContext = audioContext;
        this.metrics.contextCreatedAt = Date.now();
        
        this._log('🎵 AudioContext wrapped for monitoring', {
            state: audioContext.state,
            sampleRate: audioContext.sampleRate,
            baseLatency: audioContext.baseLatency
        }, 'audio');
        
        // Monitor state changes
        this._monitorStateChanges(audioContext);
        
        // Wrap node creation methods
        this._wrapNodeCreation(audioContext);
        
        // Monitor timing
        this._monitorTiming(audioContext);
        
        return audioContext;
    }

    /**
     * Monitor AudioContext state changes
     */
    _monitorStateChanges(audioContext) {
        const logStateChange = (newState) => {
            const stateEntry = {
                timestamp: Date.now() - this.startTime,
                state: newState,
                currentTime: audioContext.currentTime,
                time: new Date().toISOString()
            };
            
            this.contextStates.push(stateEntry);
            
            this._log(`AudioContext state: ${newState}`, {
                currentTime: audioContext.currentTime.toFixed(3) + 's',
                sampleRate: audioContext.sampleRate + 'Hz'
            }, newState === 'running' ? 'success' : 'warning');
            
            if (newState === 'running' && !this.metrics.contextStartedAt) {
                this.metrics.contextStartedAt = Date.now();
                const startupTime = this.metrics.contextStartedAt - this.metrics.contextCreatedAt;
                this._log(`AudioContext startup time: ${startupTime}ms`, null, 'timing');
            }
        };
        
        // Log initial state
        logStateChange(audioContext.state);
        
        // Monitor state changes
        const checkState = () => {
            const currentState = audioContext.state;
            const lastState = this.contextStates[this.contextStates.length - 1]?.state;
            
            if (currentState !== lastState) {
                logStateChange(currentState);
            }
        };
        
        // Check every 100ms
        setInterval(checkState, 100);
        
        // Also listen for state change events if available
        if (audioContext.onstatechange !== undefined) {
            audioContext.onstatechange = () => logStateChange(audioContext.state);
        }
    }

    /**
     * Wrap audio node creation methods
     */
    _wrapNodeCreation(audioContext) {
        const nodeMethods = [
            'createOscillator',
            'createGain',
            'createBiquadFilter',
            'createBufferSource',
            'createDelay',
            'createConvolver',
            'createDynamicsCompressor',
            'createAnalyser',
            'createWaveShaper',
            'createPanner',
            'createStereoPanner'
        ];
        
        nodeMethods.forEach(method => {
            if (typeof audioContext[method] === 'function') {
                const original = audioContext[method].bind(audioContext);
                
                audioContext[method] = (...args) => {
                    const node = original(...args);
                    this._trackNode(method, node);
                    return node;
                };
            }
        });
    }

    /**
     * Track created audio node
     */
    _trackNode(type, node) {
        const nodeId = ++this.nodeIdCounter;
        const nodeInfo = {
            id: nodeId,
            type: type.replace('create', ''),
            timestamp: Date.now() - this.startTime,
            time: new Date().toISOString()
        };
        
        this.audioNodes.push(nodeInfo);
        this.metrics.totalNodesCreated++;
        
        if (this.verbose) {
            this._log(`Node created: ${nodeInfo.type} (#${nodeId})`, null, 'node');
        }
        
        // Wrap connect method to track connections
        if (node.connect) {
            const originalConnect = node.connect.bind(node);
            node.connect = (destination, ...args) => {
                this._trackConnection(nodeId, nodeInfo.type, destination);
                return originalConnect(destination, ...args);
            };
        }
        
        // Track start/stop for scheduled sources
        if (node.start) {
            const originalStart = node.start.bind(node);
            node.start = (when = 0) => {
                this._log(`Node #${nodeId} (${nodeInfo.type}) started at ${when.toFixed(3)}s`, null, 'timing');
                return originalStart(when);
            };
        }
        
        if (node.stop) {
            const originalStop = node.stop.bind(node);
            node.stop = (when = 0) => {
                if (this.verbose) {
                    this._log(`Node #${nodeId} (${nodeInfo.type}) stopped at ${when.toFixed(3)}s`, null, 'timing');
                }
                return originalStop(when);
            };
        }
    }

    /**
     * Track audio node connection
     */
    _trackConnection(sourceId, sourceType, destination) {
        const destType = destination.constructor.name;
        const connection = {
            sourceId,
            sourceType,
            destinationType: destType,
            timestamp: Date.now() - this.startTime,
            time: new Date().toISOString()
        };
        
        this.connections.push(connection);
        
        if (this.verbose) {
            this._log(
                `Connection: ${sourceType} (#${sourceId}) → ${destType}`,
                null,
                'node'
            );
        }
    }

    /**
     * Monitor timing and latency
     */
    _monitorTiming(audioContext) {
        setInterval(() => {
            if (audioContext.state === 'running') {
                const latency = (audioContext.baseLatency || 0) + (audioContext.outputLatency || 0);
                
                this.metrics.latencyMeasurements.push({
                    timestamp: Date.now() - this.startTime,
                    latency,
                    currentTime: audioContext.currentTime
                });
                
                // Keep only last 100 measurements
                if (this.metrics.latencyMeasurements.length > 100) {
                    this.metrics.latencyMeasurements.shift();
                }
            }
        }, 1000);
    }

    /**
     * Log scheduled audio event
     */
    logScheduledNote(instrument, scheduleTime, volume = 1.0, metadata = {}) {
        if (!this.enabled) return;
        
        const currentTime = this.wrappedContext?.currentTime || 0;
        const timeDelta = scheduleTime - currentTime;
        
        // Validate timing
        const isValid = timeDelta >= 0;
        const level = isValid ? 'audio' : 'warning';
        
        const event = {
            timestamp: Date.now() - this.startTime,
            instrument,
            scheduleTime,
            currentTime,
            timeDelta,
            volume,
            isValid,
            metadata,
            time: new Date().toISOString()
        };
        
        this.scheduledEvents.push(event);
        this.metrics.totalEventsScheduled++;
        
        if (!isValid) {
            this.warnings.push({
                type: 'timing',
                message: `Scheduled event in the past: ${instrument} at ${scheduleTime.toFixed(3)}s (current: ${currentTime.toFixed(3)}s)`,
                event
            });
            this.metrics.totalWarnings++;
        }
        
        // Track timing drift
        if (isValid && timeDelta > 0.2) {
            this.metrics.timingDrift.push({
                timestamp: Date.now() - this.startTime,
                drift: timeDelta,
                instrument
            });
        }
        
        if (this.verbose || !isValid) {
            this._log(
                `Scheduled: ${instrument} @ ${scheduleTime.toFixed(3)}s (Δ${timeDelta >= 0 ? '+' : ''}${(timeDelta * 1000).toFixed(1)}ms)`,
                { volume, ...metadata },
                level
            );
        }
    }

    /**
     * Log error
     */
    logError(error, context = '') {
        if (!this.enabled) return;
        
        const errorEntry = {
            timestamp: Date.now() - this.startTime,
            error: error.toString(),
            stack: error.stack,
            context,
            time: new Date().toISOString()
        };
        
        this.errors.push(errorEntry);
        this.metrics.totalErrors++;
        
        this._log(`Error${context ? ` in ${context}` : ''}: ${error.message}`, {
            stack: error.stack
        }, 'error');
    }

    /**
     * Log warning
     */
    logWarning(message, data = null) {
        if (!this.enabled) return;
        
        const warningEntry = {
            timestamp: Date.now() - this.startTime,
            message,
            data,
            time: new Date().toISOString()
        };
        
        this.warnings.push(warningEntry);
        this.metrics.totalWarnings++;
        
        this._log(message, data, 'warning');
    }

    /**
     * Log custom event
     */
    logEvent(message, data = null, level = 'info') {
        this._log(message, data, level);
    }

    /**
     * Get audio graph visualization
     */
    getAudioGraph() {
        const graph = {
            nodes: this.audioNodes,
            connections: this.connections,
            totalNodes: this.audioNodes.length,
            totalConnections: this.connections.length
        };
        
        // Build adjacency list
        const adjacency = {};
        this.connections.forEach(conn => {
            if (!adjacency[conn.sourceId]) {
                adjacency[conn.sourceId] = [];
            }
            adjacency[conn.sourceId].push(conn.destinationType);
        });
        
        graph.adjacency = adjacency;
        
        return graph;
    }

    /**
     * Get timing analysis
     */
    getTimingAnalysis() {
        const scheduledEvents = this.scheduledEvents;
        const validEvents = scheduledEvents.filter(e => e.isValid);
        const invalidEvents = scheduledEvents.filter(e => !e.isValid);
        
        // Calculate statistics
        const deltas = validEvents.map(e => e.timeDelta * 1000); // Convert to ms
        const avgDelta = deltas.length > 0 
            ? deltas.reduce((a, b) => a + b, 0) / deltas.length 
            : 0;
        const minDelta = deltas.length > 0 ? Math.min(...deltas) : 0;
        const maxDelta = deltas.length > 0 ? Math.max(...deltas) : 0;
        
        return {
            totalEvents: scheduledEvents.length,
            validEvents: validEvents.length,
            invalidEvents: invalidEvents.length,
            averageScheduleAhead: avgDelta.toFixed(2) + 'ms',
            minScheduleAhead: minDelta.toFixed(2) + 'ms',
            maxScheduleAhead: maxDelta.toFixed(2) + 'ms',
            timingDriftOccurrences: this.metrics.timingDrift.length,
            invalidEventsList: invalidEvents.map(e => ({
                instrument: e.instrument,
                scheduleTime: e.scheduleTime.toFixed(3),
                currentTime: e.currentTime.toFixed(3),
                delta: (e.timeDelta * 1000).toFixed(1) + 'ms'
            }))
        };
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const latencies = this.metrics.latencyMeasurements.map(m => m.latency * 1000);
        const avgLatency = latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;
        
        return {
            uptime: ((Date.now() - this.startTime) / 1000).toFixed(1) + 's',
            contextStartupTime: this.metrics.contextStartedAt 
                ? (this.metrics.contextStartedAt - this.metrics.contextCreatedAt) + 'ms'
                : 'N/A',
            totalNodesCreated: this.metrics.totalNodesCreated,
            totalEventsScheduled: this.metrics.totalEventsScheduled,
            totalErrors: this.metrics.totalErrors,
            totalWarnings: this.metrics.totalWarnings,
            averageLatency: avgLatency.toFixed(2) + 'ms',
            latencySamples: latencies.length
        };
    }

    /**
     * Get AudioContext state history
     */
    getStateHistory() {
        return {
            currentState: this.wrappedContext?.state || 'unknown',
            stateChanges: this.contextStates.length,
            history: this.contextStates.map(s => ({
                state: s.state,
                timestamp: (s.timestamp / 1000).toFixed(3) + 's',
                time: s.time
            }))
        };
    }

    /**
     * Generate comprehensive debug report
     */
    generateReport() {
        if (!this.enabled) {
            return { error: 'Logger is disabled' };
        }
        
        const report = {
            timestamp: new Date().toISOString(),
            uptime: ((Date.now() - this.startTime) / 1000).toFixed(1) + 's',
            
            audioContext: {
                state: this.wrappedContext?.state || 'unknown',
                sampleRate: this.wrappedContext?.sampleRate || 'unknown',
                currentTime: this.wrappedContext?.currentTime?.toFixed(3) + 's' || 'unknown',
                baseLatency: ((this.wrappedContext?.baseLatency || 0) * 1000).toFixed(2) + 'ms',
                stateHistory: this.getStateHistory()
            },
            
            performance: this.getPerformanceMetrics(),
            timing: this.getTimingAnalysis(),
            audioGraph: this.getAudioGraph(),
            
            errors: this.errors.map(e => ({
                message: e.error,
                context: e.context,
                time: e.time
            })),
            
            warnings: this.warnings.map(w => ({
                message: w.message,
                time: w.time
            })),
            
            recentLogs: this.logs.slice(-50).map(l => ({
                level: l.level,
                message: l.message,
                timestamp: (l.timestamp / 1000).toFixed(3) + 's'
            }))
        };
        
        return report;
    }

    /**
     * Print report to console
     */
    printReport() {
        const report = this.generateReport();
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔊 AUDIO DEBUG REPORT');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        
        console.log('📊 PERFORMANCE METRICS:');
        console.log(report.performance);
        console.log('');
        
        console.log('⏱️  TIMING ANALYSIS:');
        console.log(report.timing);
        console.log('');
        
        console.log('🎵 AUDIOCONTEXT STATE:');
        console.log(report.audioContext);
        console.log('');
        
        console.log('🔊 AUDIO GRAPH:');
        console.log(`  Total Nodes: ${report.audioGraph.totalNodes}`);
        console.log(`  Total Connections: ${report.audioGraph.totalConnections}`);
        console.log('');
        
        if (report.errors.length > 0) {
            console.log('❌ ERRORS:');
            report.errors.forEach((e, i) => {
                console.log(`  ${i + 1}. ${e.message}`);
            });
            console.log('');
        }
        
        if (report.warnings.length > 0) {
            console.log('⚠️  WARNINGS:');
            report.warnings.forEach((w, i) => {
                console.log(`  ${i + 1}. ${w.message}`);
            });
            console.log('');
        }
        
        console.log('═══════════════════════════════════════════════════════════');
        
        return report;
    }

    /**
     * Export report as JSON
     */
    exportReport() {
        const report = this.generateReport();
        const json = JSON.stringify(report, null, 2);
        
        // Create downloadable file
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio-debug-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return json;
    }

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
        this.contextStates = [];
        this.scheduledEvents = [];
        this.audioNodes = [];
        this.connections = [];
        this.errors = [];
        this.warnings = [];
        
        this.metrics.totalNodesCreated = 0;
        this.metrics.totalEventsScheduled = 0;
        this.metrics.totalErrors = 0;
        this.metrics.totalWarnings = 0;
        this.metrics.timingDrift = [];
        this.metrics.latencyMeasurements = [];
        
        if (this.logElement) {
            this.logElement.innerHTML = '';
        }
        
        this._log('🗑️  Logs cleared', null, 'info');
    }

    /**
     * Enable/disable logging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this._log(enabled ? '✅ Logging enabled' : '⏸️  Logging disabled', null, 'info');
    }

    /**
     * Set verbose mode
     */
    setVerbose(verbose) {
        this.verbose = verbose;
        this._log(verbose ? '🔍 Verbose mode enabled' : 'ℹ️  Verbose mode disabled', null, 'info');
    }

    /**
     * Destroy logger and cleanup
     */
    destroy() {
        if (this.logElement) {
            this.logElement.remove();
            this.logElement = null;
        }
        
        this.clear();
        this.wrappedContext = null;
        
        this._log('🗑️  AudioDebugLogger destroyed', null, 'info');
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioDebugLogger;
}

export default AudioDebugLogger;
