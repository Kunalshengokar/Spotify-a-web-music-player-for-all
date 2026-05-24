// Library UI Manager
class LibraryUI {
    constructor() {
        this.songs = [];
        this.filteredSongs = [];
        this.currentSort = 'dateAdded';
        this.currentFilter = '';
    }

    async initializeUI() {
        this.createUploadArea();
        this.createLibraryView();
        this.attachEventListeners();
        await this.loadSongs();
    }

    createUploadArea() {
        const header = document.querySelector('.header');
        const uploadHTML = `
            <div class="upload-section">
                <div class="upload-zone" id="uploadZone">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p>Drag & drop music files or click to upload</p>
                </div>
                <input type="file" id="fileInput" multiple accept="audio/*" style="display:none">
            </div>
            <div class="search-filter">
                <input type="text" id="searchInput" placeholder="Search songs...">
                <select id="sortSelect">
                    <option value="dateAdded">Recent</option>
                    <option value="name">Name</option>
                    <option value="artist">Artist</option>
                    <option value="album">Album</option>
                </select>
            </div>
        `;
        header.insertAdjacentHTML('afterend', uploadHTML);
    }

    createLibraryView() {
        const right = document.querySelector('.right');
        const libraryHTML = `
            <div class="library-view">
                <h2>My Music Library</h2>
                <div class="songs-grid" id="songsGrid"></div>
                <div class="songs-list-view" id="songsListView" style="display:none;"></div>
            </div>
        `;
        right.querySelector('.spotify.playlist').insertAdjacentHTML('beforebegin', libraryHTML);
    }

    attachEventListeners() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        searchInput.addEventListener('input', (e) => this.filterSongs(e.target.value));
        sortSelect.addEventListener('change', (e) => this.sortSongs(e.target.value));
    }

    async handleFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith('audio/')) continue;
            
            try {
                const metadata = await metadataParser.parseMetadata(file);
                const song = await fileManager.addSong(file, metadata);
                this.songs.push(song);
                this.displaySongs(this.songs);
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }
    }

    async loadSongs() {
        this.songs = await fileManager.getSongs();
        this.displaySongs(this.songs);
    }

    filterSongs(query) {
        this.currentFilter = query.toLowerCase();
        this.filteredSongs = this.songs.filter(song =>
            song.name.toLowerCase().includes(this.currentFilter) ||
            song.artist.toLowerCase().includes(this.currentFilter) ||
            song.album.toLowerCase().includes(this.currentFilter)
        );
        this.displaySongs(this.filteredSongs);
    }

    sortSongs(sortBy) {
        this.currentSort = sortBy;
        const songsToSort = this.currentFilter ? this.filteredSongs : this.songs;
        
        songsToSort.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'artist':
                    return a.artist.localeCompare(b.artist);
                case 'album':
                    return a.album.localeCompare(b.album);
                case 'dateAdded':
                    return b.dateAdded - a.dateAdded;
                default:
                    return 0;
            }
        });
        this.displaySongs(songsToSort);
    }

    displaySongs(songs) {
        const grid = document.getElementById('songsGrid');
        grid.innerHTML = '';

        songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.innerHTML = `
                <div class="song-card-image">
                    <img src="img/music.svg" alt="album">
                    <button class="play-btn" data-song-id="${song.id}">▶</button>
                </div>
                <div class="song-card-info">
                    <h3>${this.escapeHtml(song.name)}</h3>
                    <p>${this.escapeHtml(song.artist)}</p>
                    <p class="album">${this.escapeHtml(song.album)}</p>
                    <span class="mood-badge" data-mood="${song.mood}">${song.mood || 'Unknown'}</span>
                </div>
                <div class="song-card-actions">
                    <button class="delete-btn" data-song-id="${song.id}">✕</button>
                </div>
            `;

            card.querySelector('.play-btn').addEventListener('click', () => this.playSong(song));
            card.querySelector('.delete-btn').addEventListener('click', () => this.deleteSong(song.id));
            grid.appendChild(card);
        });
    }

    async playSong(song) {
        currentSong.src = song.blobUrl;
        currentSong.play();
        document.querySelector('.songinfo').innerHTML = song.name;
        document.querySelector('#play').src = 'img/pause.svg';
    }

    async deleteSong(songId) {
        if (confirm('Delete this song?')) {
            await fileManager.deleteSong(songId);
            this.songs = this.songs.filter(s => s.id !== songId);
            this.displaySongs(this.songs);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const libraryUI = new LibraryUI();
