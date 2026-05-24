// AI Mood Analyzer using audio features
class MoodAnalyzer {
    constructor() {
        this.moods = {
            happy: { energy: 0.7, tempo: 100, valence: 0.8 },
            sad: { energy: 0.3, tempo: 70, valence: 0.2 },
            calm: { energy: 0.2, tempo: 60, valence: 0.5 },
            energetic: { energy: 0.9, tempo: 130, valence: 0.7 },
            focus: { energy: 0.5, tempo: 90, valence: 0.4 }
        };
    }

    async analyzeSong(songData) {
        if (!songData.features || Object.keys(songData.features).length === 0) {
            return { mood: 'unknown', score: 0 };
        }

        const features = songData.features;
        const scores = {};

        for (const [mood, moodProfile] of Object.entries(this.moods)) {
            scores[mood] = this.calculateMoodScore(features, moodProfile);
        }

        const bestMood = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        return {
            mood: bestMood,
            score: scores[bestMood],
            allScores: scores
        };
    }

    calculateMoodScore(features, moodProfile) {
        const energyDiff = Math.abs((features.energy || 0.5) - moodProfile.energy);
        const tempoDiff = Math.abs(((features.tempo || 100) - moodProfile.tempo) / 200);
        const valenceDiff = Math.abs((features.valence || 0.5) - moodProfile.valence);

        const energyScore = (1 - energyDiff) * 0.4;
        const tempoScore = (1 - tempoDiff) * 0.3;
        const valenceScore = (1 - valenceDiff) * 0.3;

        return Math.round((energyScore + tempoScore + valenceScore) * 100) / 100;
    }

    generatePlaylistByMood(songs, targetMood) {
        return songs
            .filter(song => song.mood === targetMood)
            .sort((a, b) => b.moodScore - a.moodScore);
    }

    generateMixedPlaylist(songs, moods = ['happy', 'energetic']) {
        const playlist = [];
        const songsPerMood = Math.floor(songs.length / moods.length);

        moods.forEach(mood => {
            const moodSongs = songs
                .filter(song => song.mood === mood)
                .sort((a, b) => b.moodScore - a.moodScore)
                .slice(0, songsPerMood);
            playlist.push(...moodSongs);
        });

        return playlist.slice(0, songs.length);
    }

    getTimeBasedMoodRecommendation() {
        const hour = new Date().getHours();
        
        if (hour >= 6 && hour < 12) return ['happy', 'energetic']; // Morning
        if (hour >= 12 && hour < 17) return ['focus', 'calm']; // Afternoon
        if (hour >= 17 && hour < 21) return ['happy', 'calm']; // Evening
        return ['calm', 'sad']; // Night
    }
}

const moodAnalyzer = new MoodAnalyzer();
