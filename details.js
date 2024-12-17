const API_KEY = 'b5241bb6a49b350b54d6ae5ba084cde7';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/';
const videoBaseUrl = 'https://vidsrc.cc/v2/embed';

// Get media ID and type from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const mediaId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

async function fetchMediaDetails() {
    try {
        const response = await fetch(
            `${BASE_URL}/${mediaType}/${mediaId}?api_key=${API_KEY}`
        );
        if (!response.ok) {
            throw new Error('Failed to fetch media details');
        }
        const data = await response.json();
        
        displayMediaDetails(data);
        setupHeroSection(data);

        if (mediaType === 'tv') {
            setupTVControls(data);
        }
    } catch (error) {
        console.error('Error fetching media details:', error);
        document.getElementById('details').innerHTML = '<p>Error loading content. Please try again later.</p>';
    }
}

function setupHeroSection(data) {
    const heroSection = document.getElementById('detailsHero');
    if (data.backdrop_path) {
        heroSection.style.backgroundImage = `url(${IMG_URL}original${data.backdrop_path})`;
    }
    
    const releaseDate = new Date(data.release_date || data.first_air_date).getFullYear();
    const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : '';
    const rating = (data.vote_average * 10).toFixed(0);

    heroSection.innerHTML = `
        <div class="hero-content">
            <h1>${data.title || data.name}</h1>
            <div class="hero-meta">
                ${releaseDate ? `<span>${releaseDate}</span>` : ''}
                ${runtime ? `<span>${runtime}</span>` : ''}
                <span class="rating">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    ${rating}%
                </span>
            </div>
            <p class="overview">${data.overview}</p>
        </div>
    `;
}

function displayMediaDetails(data) {
    const detailsContainer = document.getElementById('details');
    
    detailsContainer.innerHTML = `
        <div class="poster-container">
            <img src="${IMG_URL}w500${data.poster_path}" alt="${data.title || data.name} Poster">
            <div class="stats">
                <div class="stat-item">
                    <span class="label">Status</span>
                    <span class="value">${data.status}</span>
                </div>
                ${data.budget ? `
                <div class="stat-item">
                    <span class="label">Budget</span>
                    <span class="value">${formatCurrency(data.budget)}</span>
                </div>
                ` : ''}
                ${data.revenue ? `
                <div class="stat-item">
                    <span class="label">Revenue</span>
                    <span class="value">${formatCurrency(data.revenue)}</span>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="content-info">
            <div class="genres">
                ${data.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
            </div>
            ${data.tagline ? `<p class="tagline">${data.tagline}</p>` : ''}
            <div class="additional-info">
                <div class="info-grid">
                    <div class="info-item">
                        <h4>Original Title</h4>
                        <p>${data.original_title || data.original_name}</p>
                    </div>
                    <div class="info-item">
                        <h4>Original Language</h4>
                        <p>${getLanguageName(data.original_language)}</p>
                    </div>
                    ${data.production_companies?.length ? `
                    <div class="info-item">
                        <h4>Production</h4>
                        <p>${data.production_companies.map(company => company.name).join(', ')}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function displayCastSection(credits) {
    if (!credits?.cast?.length) return;

    const castSection = document.getElementById('castSection');
    const castMembers = credits.cast.slice(0, 8);
    const crew = credits.crew.filter(person => 
        ['Director', 'Producer', 'Screenplay', 'Story'].includes(person.job)
    ).slice(0, 4);

    const castGrid = castSection.querySelector('.cast-grid');
    castGrid.innerHTML = castMembers.map(actor => `
        <div class="cast-card">
            <img src="${actor.profile_path ? IMG_URL + 'w185' + actor.profile_path : 'placeholder.jpg'}" 
                 alt="${actor.name}">
            <div class="cast-info">
                <div class="cast-name">${actor.name}</div>
                <div class="cast-character">${actor.character}</div>
            </div>
        </div>
    `).join('');
}

function displaySimilarContent(similarContent) {
    if (!similarContent?.length) return;

    const similarContainer = document.getElementById('similarContent');
    const items = similarContent.slice(0, 6);

    similarContainer.innerHTML = items.map(item => `
        <div class="movie-card" onclick="location.href='details.html?id=${item.id}&type=${mediaType}'">
            <img src="${IMG_URL}w342${item.poster_path}" alt="${item.title || item.name}">
            <div class="movie-info">
                <h3>${item.title || item.name}</h3>
                <span class="rating">${(item.vote_average * 10).toFixed(0)}%</span>
            </div>
        </div>
    `).join('');
}

async function setupTVControls(tvShow) {
    const videoOptions = document.getElementById('videoOptions');
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    videoOptions.style.display = 'block';

    // Populate seasons
    seasonSelect.innerHTML = tvShow.seasons
        .map(season => `
            <option value="${season.season_number}">
                Season ${season.season_number}
            </option>
        `)
        .join('');

    // Handle season change
    seasonSelect.addEventListener('change', () => updateEpisodes(seasonSelect.value));

    // Initialize with first season
    if (tvShow.seasons.length > 0) {
        await updateEpisodes(tvShow.seasons[0].season_number);
    }
}

async function updateEpisodes(seasonNumber) {
    try {
        const response = await fetch(
            `${BASE_URL}/tv/${mediaId}/season/${seasonNumber}?api_key=${API_KEY}`
        );
        const seasonData = await response.json();
        const episodeSelect = document.getElementById('episodeSelect');

        episodeSelect.innerHTML = seasonData.episodes
            .map(episode => `
                <option value="${episode.episode_number}">
                    Episode ${episode.episode_number}: ${episode.name}
                </option>
            `)
            .join('');

        // Display first episode details
        if (seasonData.episodes.length > 0) {
            displayEpisodeDetails(seasonNumber, seasonData.episodes[0].episode_number);
        }
    } catch (error) {
        console.error('Error updating episodes:', error);
    }
}

async function displayEpisodeDetails(seasonNumber, episodeNumber) {
    try {
        const response = await fetch(
            `${BASE_URL}/tv/${mediaId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${API_KEY}`
        );
        const episodeData = await response.json();
        const episodeDetails = document.getElementById('episodeDetails');

        episodeDetails.innerHTML = `
            <h3>${episodeData.name}</h3>
            <div class="meta-info">
                <span>Season ${seasonNumber}</span>
                <span>Episode ${episodeNumber}</span>
                <span>Rating: ${(episodeData.vote_average * 10).toFixed(0)}%</span>
            </div>
            <p>${episodeData.overview}</p>
        `;
    } catch (error) {
        console.error('Error displaying episode details:', error);
    }
}

function formatCurrency(amount) {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(amount);
}

function getLanguageName(code) {
    const languages = {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        ja: 'Japanese',
        ko: 'Korean',
        zh: 'Chinese'
    };
    return languages[code] || code.toUpperCase();
}

function goHome() {
    window.location.href = 'index.html';
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    if (!mediaId) {
        document.getElementById('details').innerHTML = '<p>No media ID provided</p>';
        return;
    }
    
    // Initialize the details page
    fetchMediaDetails();
    
    // Setup watch button
    const watchButton = document.getElementById('watchNowButton');
    const videoContainer = document.getElementById('videoContainer');
    
    // Ensure video container is hidden initially
    if (videoContainer) {
        videoContainer.style.display = 'none';
    }
    
    if (watchButton) {
        watchButton.addEventListener('click', () => {
            if (videoContainer) {
                videoContainer.innerHTML = `
                    <iframe
                        src="${videoBaseUrl}/${mediaType}/${mediaId}"
                        frameborder="0"
                        allowfullscreen
                    ></iframe>
                `;
                videoContainer.style.display = 'block';
                watchButton.style.display = 'none';
            }
        });
    }
});
