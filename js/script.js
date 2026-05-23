console.log("Lets start javascript");
let currentSong = new Audio();
let songs;
let currFolder;
let songsData = null;

// Load songs manifest
async function loadManifest() {
    if (!songsData) {
        try {
            const response = await fetch('/songs-manifest.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            songsData = await response.json();

            // Validate manifest structure
            if (!songsData?.albums || !Array.isArray(songsData.albums)) {
                throw new Error('Invalid manifest structure');
            }
        } catch (error) {
            console.error('Failed to load manifest:', error);
            return { albums: [] }; // Fallback to empty albums
        }
    }
    return songsData;
}
//get all songs

function secondsTOMinutesSeconds(seconds) {
    if (isNaN(seconds)) return "00:00";
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}


async function getsongs(folder) {
    currFolder = folder;
    const manifest = await loadManifest();
    const album = manifest.albums.find(a => `songs/${a.folder}` === folder);

    if (!album) {
        console.error('Album not found:', folder);
        return [];
    }

    songs = album.songs;

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        let li = document.createElement("li");
        li.innerHTML = `
        <img src="img/music.svg" alt="">
        <div class="info">
            <div>${song.replaceAll("%20", " ")}</div>
            <div>Kunal</div>
        </div>
        <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="img/play.svg" alt="">
        </div>
    `;
        songUL.appendChild(li);
    }

    //Attach an event listner to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(element => {
        element.addEventListener("click", () => {
            console.log(element.querySelector(".info").firstElementChild.innerHTML);
            playMusic(element.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });
    return songs;
}



const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track
    if (!pause) {

        currentSong.play()
        play.src = "img/pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00"
}

async function displayAlbums() {
    const manifest = await loadManifest();
    const cardContainer = document.querySelector(".cardContainer");

    // Build HTML string first for better performance
    let html = '';
    for (const album of manifest.albums) {
        // Create temporary elements for safe text escaping
        const tempDiv = document.createElement('div');

        // Escape HTML in title and description
        const titleEl = document.createElement('h2');
        titleEl.textContent = album.title;
        const descEl = document.createElement('p');
        descEl.textContent = album.description;

        html += `<div data-folder="${album.folder.replace(/"/g, '&quot;')}" class="card">
        <div class="play">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100"> <circle cx="50" cy="50" r="48" fill="#1DB954" stroke="#1ED760" stroke-width="4" />
        <polygon points="42,33 42,67 68,50" fill="white" />
        </svg>
        </div>
        <img src="${album.cover.replace(/"/g, '&quot;')}" alt="">
        ${titleEl.outerHTML}
        ${descEl.outerHTML}
        </div>`;
    }
    cardContainer.innerHTML = html;

    //Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        console.log(e);
        e.addEventListener("click", async item => {
            console.log(item, item.currentTarget.dataset);
            songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

//Main function
async function main() {
    //Get the List of all the Songs
    songs = await getsongs("songs/ncs")
    playMusic(songs[0], true)

    //display all the songs in the page
    displayAlbums()

    //Attach an event listener to play, next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play(); // <- You forgot this
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    })


    //Listen for time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songTime").innerHTML = `${secondsTOMinutesSeconds(currentSong.currentTime)}/${secondsTOMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });



    //Add event listner to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent * 100 + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100

    })



    //Add event listner for hamburger
    document.querySelector(".hamburgercontainer").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })
    //Add event listner for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })




    //Add event listner to previous song
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })



    //Add event listner to next song
    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })




    //add an event listner to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log(e, e.target, e.target.value)
        currentSong.volume = parseInt(e.target.value) / 100
    })




}

main()