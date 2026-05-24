// Metadata Parser for audio files
class MetadataParser {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    async parseMetadata(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const metadata = this.extractID3(e.target.result);
                metadata.duration = this.getAudioDuration(file);
                resolve(metadata);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    extractID3(arrayBuffer) {
        const view = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder();
        
        // Simple ID3v2 extraction
        let title = 'Unknown Title';
        let artist = 'Unknown Artist';
        let album = 'Unknown Album';

        if (view[0] === 73 && view[1] === 68 && view[2] === 51) { // ID3 tag
            const size = ((view[6] & 0x7f) << 21) |
                        ((view[7] & 0x7f) << 14) |
                        ((view[8] & 0x7f) << 7) |
                        (view[9] & 0x7f);
            
            try {
                const id3Data = decoder.decode(view.slice(10, Math.min(10 + size, view.length)));
                
                const titleMatch = id3Data.match(/TIT2[\x00\x01\x02\x03]([^\x00]+)/);
                const artistMatch = id3Data.match(/TPE1[\x00\x01\x02\x03]([^\x00]+)/);
                const albumMatch = id3Data.match(/TALB[\x00\x01\x02\x03]([^\x00]+)/);
                
                if (titleMatch) title = titleMatch[1].trim();
                if (artistMatch) artist = artistMatch[1].trim();
                if (albumMatch) album = albumMatch[1].trim();
            } catch (e) {
                console.log('Could not parse full metadata, using defaults');
            }
        }

        return { title, artist, album };
    }

    async getAudioDuration(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const audioBuffer = await this.audioContext.decodeAudioData(e.target.result);
                    resolve(Math.round(audioBuffer.duration));
                } catch {
                    resolve(0);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    async extractAudioFeatures(audioBuffer) {
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = offlineContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyser.connect(offlineContext.destination);
        source.start(0);

        const rendered = await offlineContext.startRendering();
        
        // Calculate features
        const data = rendered.getChannelData(0);
        const rms = Math.sqrt(data.reduce((sum, val) => sum + val * val, 0) / data.length);
        const energy = Math.min(1, rms * 2);

        return {
            energy: parseFloat(energy.toFixed(2)),
            tempo: this.detectTempo(data, audioBuffer.sampleRate),
            loudness: this.calculateLoudness(data)
        };
    }

    detectTempo(data, sampleRate) {
        // Simple tempo detection (BPM estimation)
        const correlationArray = new Array(data.length);
        for (let lag = 0; lag < data.length; lag++) {
            let sum = 0;
            for (let index = 0; index < data.length - lag; index++) {
                sum += Math.abs(data[index] * data[index + lag]);
            }
            correlationArray[lag] = sum;
        }

        const minSamples = sampleRate / 4; // 0.25 seconds
        const maxSamples = sampleRate / 2; // 2 seconds
        let maxValue = -Infinity;
        let maxIndex = -1;

        for (let i = minSamples; i < maxSamples; i++) {
            if (correlationArray[i] > maxValue) {
                maxValue = correlationArray[i];
                maxIndex = i;
            }
        }

        return maxIndex > 0 ? Math.round((60 * sampleRate) / maxIndex) : 0;
    }

    calculateLoudness(data) {
        const mean = data.reduce((a, b) => a + b) / data.length;
        const variance = data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / data.length;
        const loudness = 20 * Math.log10(Math.sqrt(variance) + 1e-10);
        return parseFloat(loudness.toFixed(1));
    }
}

const metadataParser = new MetadataParser();
