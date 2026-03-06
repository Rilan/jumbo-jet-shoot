/**
 * Manages all audio playback using Web Audio API
 * Generates sounds programmatically - no external files needed
 */
export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;

        this.isMuted = false;
        this.volume = 0.5;
        this.musicVolume = 0.3;

        // Music state
        this.musicOscillators = [];
        this.musicPlaying = false;
        this.musicInterval = null;

        // Initialize on first user interaction (required by browsers)
        this.initialized = false;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;

            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.musicVolume;

            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = 1;

            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Resume audio context if suspended
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Play player shoot sound - short laser "pew"
     */
    playShoot() {
        if (!this.initialized || this.isMuted) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Oscillator for laser sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * Play enemy destroyed sound - explosion pop
     */
    playEnemyDestroyed() {
        if (!this.initialized || this.isMuted) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Noise burst for explosion
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.2);
    }

    /**
     * Play boss destroyed sound - large explosion
     */
    playBossDestroyed() {
        if (!this.initialized || this.isMuted) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Longer, deeper explosion
        const bufferSize = ctx.sampleRate * 0.6;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const envelope = Math.pow(1 - i / bufferSize, 0.5);
            data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.6);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.6);

        // Add low rumble
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    /**
     * Play power-up collected sound - positive chime
     */
    playPowerUp() {
        if (!this.initialized || this.isMuted) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Arpeggio chime
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const duration = 0.08;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = now + i * duration;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 2);

            osc.start(startTime);
            osc.stop(startTime + duration * 2);
        });
    }

    /**
     * Play player hit sound - impact thud
     */
    playPlayerHit() {
        if (!this.initialized || this.isMuted) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Impact thud with noise
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.15);

        // Add noise burst
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.1);
    }

    /**
     * Play game over sound - defeat jingle
     */
    playGameOver() {
        if (!this.initialized || this.isMuted) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Descending sad notes
        const notes = [392, 349.23, 293.66, 261.63]; // G4, F4, D4, C4
        const durations = [0.3, 0.3, 0.3, 0.6];

        let currentTime = now;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.25, currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, currentTime + durations[i]);

            osc.start(currentTime);
            osc.stop(currentTime + durations[i]);

            currentTime += durations[i] * 0.8;
        });
    }

    /**
     * Start background music - synthwave loop
     */
    startMusic() {
        if (!this.initialized || this.musicPlaying) return;

        this.musicPlaying = true;
        this.playMusicLoop();
    }

    /**
     * Play the music loop
     */
    playMusicLoop() {
        if (!this.musicPlaying || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Simple bass line pattern
        const bassNotes = [65.41, 65.41, 87.31, 82.41]; // C2, C2, F2, E2
        const bassPattern = [0, 0.5, 1, 1.5];

        bassNotes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            const startTime = now + bassPattern[i];
            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });

        // Simple arpeggio
        const arpNotes = [261.63, 329.63, 392, 329.63]; // C4, E4, G4, E4
        const arpTimes = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75];

        arpTimes.forEach((time, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.type = 'square';
            osc.frequency.value = arpNotes[i % arpNotes.length];

            const startTime = now + time;
            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.start(startTime);
            osc.stop(startTime + 0.2);
        });

        // Schedule next loop
        this.musicInterval = setTimeout(() => this.playMusicLoop(), 2000);
    }

    /**
     * Stop background music
     */
    stopMusic() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
    }

    /**
     * Pause music
     */
    pauseMusic() {
        this.stopMusic();
    }

    /**
     * Resume music
     */
    resumeMusic() {
        if (!this.musicPlaying) {
            this.startMusic();
        }
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
        }

        return this.isMuted;
    }

    /**
     * Set master volume (0-1)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));

        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * Get current mute state
     */
    getMuteState() {
        return this.isMuted;
    }

    /**
     * Get current volume
     */
    getVolume() {
        return this.volume;
    }
}
