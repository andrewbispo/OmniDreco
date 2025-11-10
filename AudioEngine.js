

export default class AudioEngine {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);

        this.noteFrequencies = this.createNoteFrequencies();
        this.sustainedOscillators = [];
    }

    createNoteFrequencies() {
        const A4 = 440;
        const notes = {};
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        for (let octave = 2; octave <= 6; octave++) {
            noteNames.forEach((name, semitone) => {
                const noteNumber = (octave - 4) * 12 + semitone - 9;
                const frequency = A4 * Math.pow(2, noteNumber / 12);
                notes[`${name}${octave}`] = frequency;
            });
        }

        return notes;
    }

    getNoteFrequency(note, octave = 4) {
        return this.noteFrequencies[`${note}${octave}`] || 440;
    }

    playChord(chord) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const octave = 4;
        const baseNote = chord.root;
        const baseFreq = this.getNoteFrequency(baseNote, octave);

        chord.intervals.forEach((interval, index) => {
            const frequency = baseFreq * Math.pow(2, interval / 12);
            setTimeout(() => {
                this.playTone(frequency, 0.4, 0.15);
            }, index * 30);
        });
    }

    playChordNote(chord, noteIndex) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const octave = 4;
        const baseNote = chord.root;
        const baseFreq = this.getNoteFrequency(baseNote, octave);

        const intervalIndex = noteIndex % chord.intervals.length;
        const octaveOffset = Math.floor(noteIndex / chord.intervals.length);
        const interval = chord.intervals[intervalIndex];

        const frequency = baseFreq * Math.pow(2, (interval + octaveOffset * 12) / 12);
        this.playTone(frequency, 0.6, 0.2);
    }

    playTone(frequency, duration, volume = 0.3) {
        const now = this.audioContext.currentTime;

        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGain);

        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.value = frequency;

        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.value = frequency;

        const osc3 = this.audioContext.createOscillator();
        osc3.type = 'square';
        osc3.frequency.value = frequency * 2;

        const gain1 = this.audioContext.createGain();
        gain1.gain.value = 0.4;
        const gain2 = this.audioContext.createGain();
        gain2.gain.value = 0.3;
        const gain3 = this.audioContext.createGain();
        gain3.gain.value = 0.15;

        osc1.connect(gain1);
        osc2.connect(gain2);
        osc3.connect(gain3);

        gain1.connect(gainNode);
        gain2.connect(gainNode);
        gain3.connect(gainNode);

        const attack = 0.01;
        const decay = 0.1;
        const sustain = volume * 0.6;
        const release = duration - decay;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + attack);
        gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);
        gainNode.gain.setValueAtTime(sustain, now + release);
        gainNode.gain.linearRampToValueAtTime(0.001, now + duration);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);

        osc1.stop(now + duration);
        osc2.stop(now + duration);
        osc3.stop(now + duration);
    }

    playSustainedChord(chord) {
        this.stopSustainedChord();

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const octave = 4;
        const baseNote = chord.root;
        const baseFreq = this.getNoteFrequency(baseNote, octave);

        chord.intervals.forEach((interval) => {
            const frequency = baseFreq * Math.pow(2, interval / 12);

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = 'triangle';
            oscillator.frequency.value = frequency;

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.05);

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start();

            this.sustainedOscillators.push({ oscillator, gainNode });
        });
    }

    stopSustainedChord() {
        const now = this.audioContext.currentTime;

        this.sustainedOscillators.forEach(({ oscillator, gainNode }) => {
            gainNode.gain.linearRampToValueAtTime(0.001, now + 0.1);
            oscillator.stop(now + 0.15);
        });

        this.sustainedOscillators = [];
    }
}

