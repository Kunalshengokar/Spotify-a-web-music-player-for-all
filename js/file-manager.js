// IndexedDB Manager for local music storage
class FileManager {
    constructor() {
        this.dbName = 'SpotifyLocalDB';
        this.version = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('songs')) {
                    const songStore = db.createObjectStore('songs', { keyPath: 'id' });
                    songStore.createIndex('artist', 'artist', { unique: false });
                    songStore.createIndex('album', 'album', { unique: false });
                    songStore.createIndex('dateAdded', 'dateAdded', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('playlists')) {
                    db.createObjectStore('playlists', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('preferences')) {
                    db.createObjectStore('preferences', { keyPath: 'key' });
                }
            };
        });
    }

    async addSong(file, metadata = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const blob = e.target.result;
                const song = {
                    id: `song-${Date.now()}-${Math.random()}`,
                    name: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
                    artist: metadata.artist || 'Unknown Artist',
                    album: metadata.album || 'Unknown Album',
                    duration: metadata.duration || 0,
                    fileSize: file.size,
                    dateAdded: Date.now(),
                    blobData: blob,
                    mood: metadata.mood || null,
                    moodScore: 0,
                    features: metadata.features || {}
                };
                
                const transaction = this.db.transaction(['songs'], 'readwrite');
                const store = transaction.objectStore('songs');
                const request = store.add(song);
                
                request.onsuccess = () => resolve(song);
                request.onerror = () => reject(request.error);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    async getSongs() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['songs'], 'readonly');
            const store = transaction.objectStore('songs');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const songs = request.result.map(song => ({
                    ...song,
                    blobUrl: URL.createObjectURL(new Blob([song.blobData]))
                }));
                resolve(songs);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteSong(songId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['songs'], 'readwrite');
            const store = transaction.objectStore('songs');
            const request = store.delete(songId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async updateSongMood(songId, mood, score) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['songs'], 'readwrite');
            const store = transaction.objectStore('songs');
            const getRequest = store.get(songId);
            
            getRequest.onsuccess = () => {
                const song = getRequest.result;
                song.mood = mood;
                song.moodScore = score;
                const updateRequest = store.put(song);
                updateRequest.onsuccess = () => resolve(song);
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async savePlaylist(playlist) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            const request = store.put(playlist);
            
            request.onsuccess = () => resolve(playlist);
            request.onerror = () => reject(request.error);
        });
    }

    async getPlaylists() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readonly');
            const store = transaction.objectStore('playlists');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async savePreferences(key, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['preferences'], 'readwrite');
            const store = transaction.objectStore('preferences');
            const request = store.put({ key, data });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPreferences(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['preferences'], 'readonly');
            const store = transaction.objectStore('preferences');
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result?.data || null);
            request.onerror = () => reject(request.error);
        });
    }
}

// Initialize FileManager globally
const fileManager = new FileManager();
