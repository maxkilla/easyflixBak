const tmdbApiKey = 'b5241bb6a49b350b54d6ae5ba084cde7';
const videoBaseUrl = 'https://vidsrc.cc/v2/embed';
const tmdbBaseUrl = 'https://api.themoviedb.org/3';
const tmdbPosterurl = 'https://image.tmdb.org/t/p';


const detailsContainer = document.getElementById('details');
const watchNowButton = document.getElementById('watchNowButton');
const videoOptionsContainer = document.getElementById('videoOptions');
const seasonSelect = document.getElementById('seasonSelect');
const episodeSelect = document.getElementById('episodeSelect');
var videoContainer = document.getElementById('videoContainer');

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const mediaType = params.get('mediaType');
  const season = params.get('season');
  const episode = params.get('episode');
  
  if (id && mediaType) {
    showDetails(id, mediaType, season, episode);
  } else {
    detailsContainer.innerHTML = '<p>Invalid request</p>';
  }
});

function showDetails(id, mediaType, season, episode) {
  const detailsUrl = `${tmdbBaseUrl}/${mediaType}/${id}?api_key=${tmdbApiKey}`;

  fetch(detailsUrl)
    .then(response => response.json())
    .then(data => {
      displayDetails(data, mediaType);
      if (mediaType === 'tv') {
        setupSeriesOptions(data, season, episode);
      }
      watchNowButton.addEventListener('click', () => {
        const selectedSeason = seasonSelect.value;
        const selectedEpisode = episodeSelect.value;
        openVideo(id, mediaType, selectedSeason, selectedEpisode);
      });
      seasonSelect.addEventListener('change', () => updateSelectors(id));
      episodeSelect.addEventListener('change', () => updateSelectors(id));
    })
    .catch(error => {
      console.error('Error fetching details:', error);
      detailsContainer.innerHTML = '<p>Error fetching details</p>';
    });
}

function displayDetails(details, mediaType) {
  const genres = details.genres ? details.genres.map(genre => genre.name).join(', ') : '';
  detailsContainer.innerHTML = `
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="${tmdbPosterurl}/w300${details.poster_path}" alt="${details.title || details.name}" style="max-width: 100%;">
  </div>
  <h2 style="text-align: center; color: #3498db;">${details.title || details.name}</h2>
  <p><strong>Type:</strong> ${mediaType}</p>
  <p><strong>Overview:</strong> ${details.overview}</p>
  <p><strong>Release Date:</strong> ${details.release_date || details.first_air_date}</p>
  <p><strong>Rating:</strong> ${details.vote_average}</p>
  <p><strong>Genres:</strong> ${genres}</p>
  <p><strong>Language:</strong> ${details.original_language}</p>
`;
  if (mediaType === 'movie') {
    watchNowButton.addEventListener('click', () => openVideo(details.id, 'movie'));
  } else if (mediaType === 'tv') {
    setupSeriesOptions(details);
    videoOptionsContainer.style.display = 'block';
    const seasonNumber = document.getElementById('seasonSelect').value;
    const episodeNumber = document.getElementById('episodeSelect').value;
    updateEpisodeDetails(details.id, seasonNumber, episodeNumber);
    watchNowButton.addEventListener('click', () => openVideo(details.id, 'tv'));
  }
}

function openVideo(id, mediaType, season, episode) {
  const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const aspectRatio = 16 / 9;
  const videoHeight = Math.min(screenWidth * (1 / aspectRatio), 400);

  if (mediaType === 'movie') {
    videoContainer.innerHTML = `<iframe src="${videoBaseUrl}/movie/${id}" width="100%" height="${videoHeight}px" frameborder="0" allowfullscreen></iframe>`;
  } else if (mediaType === 'tv') {
    videoContainer.innerHTML = `<iframe src="${videoBaseUrl}/tv/${id}/${season}/${episode}" width="100%" height="${videoHeight}px" frameborder="0" allowfullscreen></iframe>`;
  }
}

function setupSeriesOptions(tvDetails, initialSeason, initialEpisode) {
  const regularSeasons = tvDetails.seasons.filter(season => season.season_number !== 0);
  seasonSelect.innerHTML = '';
  regularSeasons.forEach(season => {
    const option = document.createElement('option');
    option.value = season.season_number;
    option.textContent = `Season ${season.season_number}`;
    seasonSelect.appendChild(option);
  });

  seasonSelect.value = initialSeason || 1;
  populateEpisodes(tvDetails, initialSeason || 1, initialEpisode);

  seasonSelect.addEventListener('change', () => {
    populateEpisodes(tvDetails, seasonSelect.value);
  });
}

function populateEpisodes(tvDetails, selectedSeason, initialEpisode) {
  const selectedSeasonDetails = tvDetails.seasons.find(season => season.season_number === parseInt(selectedSeason, 10));
  episodeSelect.innerHTML = '';
  if (selectedSeasonDetails) {
    for (let i = 1; i <= selectedSeasonDetails.episode_count; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `Episode ${i}`;
      episodeSelect.appendChild(option);
    }
  }
  episodeSelect.value = initialEpisode || 1;
  updateSelectors(tvDetails.id);
}

function updateSelectors(seriesId) {
  const season = seasonSelect.value;
  const episode = episodeSelect.value;
  updateUrl(seriesId, 'tv', season, episode);
  updateEpisodeDetails(seriesId, season, episode);
}

function updateUrl(id, mediaType, season, episode) {
  const url = new URL(window.location);
  url.searchParams.set('id', id);
  url.searchParams.set('mediaType', mediaType);
  if (mediaType === 'tv') {
    url.searchParams.set('season', season);
    url.searchParams.set('episode', episode);
  } else {
    url.searchParams.delete('season');
    url.searchParams.delete('episode');
  }
  window.history.pushState({}, '', url);
}

function updateEpisodeDetails(seriesId, seasonNumber, episodeNumber) {
  videoContainer.innerHTML = '';
  const episodeDetailsUrl = `${tmdbBaseUrl}/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${tmdbApiKey}`;

  fetch(episodeDetailsUrl)
    .then(response => response.json())
    .then(details => {
      const episodeDetailsContainer = document.getElementById('episodeDetails');
      if (details.error) {
        episodeDetailsContainer.innerHTML = `<p>${details.error}</p>`;
      } else {
        episodeDetailsContainer.innerHTML = `
          <h3 style="color: #3498db;">${details.name}</h3>
          <p><strong>Overview: </strong>${details.overview}</p>
          <p><strong>Air Date: </strong>${details.air_date}</p>
        `;
      }
    })
    .catch(error => {
      console.error('Error fetching episode details:', error);
    });
}

function goHome() {
  window.location.href = 'index.html';
}
