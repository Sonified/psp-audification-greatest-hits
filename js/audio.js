/**
 * PSP Greatest Hits Audio Manager
 * 
 * Handles audio loading and playback for the PSP Greatest Hits showcase.
 */

const AUDIO_FADE_DURATION = 0.05; // 50ms fade time

class PSPAudioManager {
    constructor() {
        this.audioContext = null;
        this.initializeAudioContext();
        
        this.masterGain = null;
        this.analyser = null;
        
        this.audioSource = null;    // Single audio source
        this.audioBuffer = null;    // Single audio buffer
        
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.waveformDataArray = null;
        
        if (this.audioContext) {
            this.setupAudioNodes();
        }
    }
    
    initializeAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            if (this.audioContext.state === 'suspended') {
                const resumeAudio = () => {
                    this.audioContext.resume();
                    document.removeEventListener('click', resumeAudio);
                    document.removeEventListener('touchstart', resumeAudio);
                    document.removeEventListener('keydown', resumeAudio);
                };
                document.addEventListener('click', resumeAudio);
                document.addEventListener('touchstart', resumeAudio);
                document.addEventListener('keydown', resumeAudio);
            }
            console.log('Audio context initialized successfully.');
            return true;
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            return false;
        }
    }
    
    setupAudioNodes() {
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime); // Start with gain at 0
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.3;
        
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        this.waveformDataArray = new Uint8Array(this.analyser.fftSize);
    }
    
    async loadSingleAudio(audioUrl) { // New method, replaces loadAudioPair
        try {
            if (!this.audioContext) {
                const success = this.initializeAudioContext();
                if (!success) throw new Error('Could not initialize audio context');
                this.setupAudioNodes();
            }
            
            const response = await fetch(audioUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio file: ${audioUrl} - ${response.statusText}`);
            }
            
            const audioData = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(audioData);
            
            console.log('Audio file loaded successfully:', audioUrl);
            return true;
        } catch (error) {
            console.error('Error loading audio file:', error);
            throw error;
        }
    }
    
    startPlayback(startOffset = -1) { // Simplified signature
        if (!this.audioContext || !this.audioBuffer) {
            console.error('Cannot start playback: audio not loaded');
            return false;
        }

        this.stopPlayback(false, true); // Stop existing, but don't reset position, and indicate it's for an immediate restart

        let offset = 0;
        if (startOffset >= 0) { 
            offset = startOffset;
            this.startTime = this.audioContext.currentTime - offset;
            this.pauseTime = 0;
        } else if (this.pauseTime > 0 && this.startTime > 0) { 
            offset = this.pauseTime - this.startTime;
        } else {
            this.startTime = this.audioContext.currentTime;
            this.pauseTime = 0;
        }
        offset = Math.max(0, offset % (this.audioBuffer.duration || Infinity));

        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.connect(this.masterGain); // Connect directly to masterGain
        this.audioSource.loop = true;

        const now = this.audioContext.currentTime;
        this.audioSource.start(now, offset);

        // Fade in
        this.masterGain.gain.cancelScheduledValues(now); // Cancel any previous ramps
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now); // Hold current value (likely 0 if just started)
        this.masterGain.gain.linearRampToValueAtTime(1, now + AUDIO_FADE_DURATION);

        if (startOffset < 0) {
             this.startTime = this.audioContext.currentTime - offset;
        }
        
        this.isPlaying = true;
        return true;
    }
    
    stopPlayback(resetPosition = true, forRestart = false) { // Added forRestart flag
        if (!this.audioContext) return; // Guard against calls before context is ready

        const now = this.audioContext.currentTime;

        if (this.isPlaying || forRestart) { // Only update pauseTime if it was genuinely playing or being restarted
             if (this.isPlaying && !forRestart) { // If it was playing and this is a real stop/pause
                this.pauseTime = now;
            }

            if (this.audioSource) {
                // Fade out before stopping
                this.masterGain.gain.cancelScheduledValues(now);
                this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now); // Hold current value
                this.masterGain.gain.linearRampToValueAtTime(0, now + AUDIO_FADE_DURATION);

                // Stop the source after the fade
                // Store source in a temp variable to avoid issues if stopPlayback is called rapidly
                const sourceToStop = this.audioSource;
                this.audioSource = null; // Clear immediately so new playback can be set up if needed
                
                setTimeout(() => {
                    if (sourceToStop) {
                        try {
                            sourceToStop.stop();
                            sourceToStop.disconnect();
                        } catch (e) { /* Ignore errors if already stopped or disconnected */ }
                    }
                }, AUDIO_FADE_DURATION * 1000 + 50); // Delay stop slightly longer than fade
            } else if (forRestart) {
                 // If it's for restart and no source, ensure gain is 0 for the next fade-in
                this.masterGain.gain.cancelScheduledValues(now);
                this.masterGain.gain.setValueAtTime(0, now);
            }
        }

        if (resetPosition) {
            this.startTime = 0;
            this.pauseTime = 0; 
        }
        
        this.isPlaying = false; // Set immediately, playback is considered stopped once fade begins
    }
    
    seekTo(positionFraction) {
        if (!this.audioBuffer || !this.audioContext) return;
        const duration = this.audioBuffer.duration;
        const seekTime = duration * positionFraction;
        this.startPlayback(seekTime); // Call simplified startPlayback
    }
    
    getCurrentTime() {
        if (!this.audioBuffer || !this.audioContext) return 0;
        if (this.isPlaying) {
            let currentTime = this.audioContext.currentTime - this.startTime;
            return currentTime % this.audioBuffer.duration;
        } else if (this.pauseTime > 0 && this.startTime > 0) {
            let pausedTime = this.pauseTime - this.startTime;
            return pausedTime % this.audioBuffer.duration;
        }
        return 0;
    }
    
    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }
    
    getWaveformData() {
        if (!this.analyser || !this.waveformDataArray) return null;
        this.analyser.getByteTimeDomainData(this.waveformDataArray);
        return this.waveformDataArray;
    }
}
