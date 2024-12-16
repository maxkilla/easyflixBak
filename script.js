const tmdbApiKey = 'b5241bb6a49b350b54d6ae5ba084cde7';
const videoBaseUrl = 'https://vidsrc.cc/v2/embed';
const tmdbBaseUrl = 'https://api.themoviedb.org/3';
const tmdbPosterurl = 'https://image.tmdb.org/t/p';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');
const trendingMoviesContainer = document.getElementById('trendingMovies');
const topRatedContainer = document.getElementById('topRatedMovies');
const upcomingContainer = document.getElementById('upcomingMovies');
const continueWatchingContainer = document.getElementById('continueWatching');
const featuredMovieContainer = document.getElementById('featuredMovie');
const genreListContainer = document.getElementById('genreList');

let selectedGenre = null;
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let continueWatching = JSON.parse(localStorage.getItem('continueWatching')) || [];

// Load content when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadGenres();
  loadFeaturedMovie();
  loadTrendingMovies();
  loadTopRatedMovies();
  loadUpcomingMovies();
  loadContinueWatching();
});

// Featured Movie Functions
async function loadFeaturedMovie() {
  try {
    const response = await fetch(`${tmdbBaseUrl}/movie/now_playing?api_key=${tmdbApiKey}`);
    const data = await response.json();
    const randomMovie = data.results[Math.floor(Math.random() * 5)]; // Get one of the first 5 movies
    displayFeaturedMovie(randomMovie);
  } catch (error) {
    console.error('Error loading featured movie:', error);
  }
}

function displayFeaturedMovie(movie) {
  const backdropPath = `${tmdbPosterurl}/original${movie.backdrop_path}`;
  featuredMovieContainer.style.backgroundImage = `url(${backdropPath})`;
  
  featuredMovieContainer.innerHTML = `
    <div class="featured-content">
      <h2 class="featured-title">${movie.title}</h2>
      <p class="featured-overview">${movie.overview}</p>
      <div class="featured-actions">
        <button class="btn btn-primary" onclick="showDetails(${movie.id}, 'movie')">Watch Now</button>
        <button class="btn btn-secondary" onclick="addToWatchlist(${movie.id})">Add to Watchlist</button>
      </div>
    </div>
  `;
}

// Continue Watching Functions
function loadContinueWatching() {
  if (continueWatching.length === 0) {
    continueWatchingContainer.closest('section').style.display = 'none';
    return;
  }

  continueWatchingContainer.innerHTML = '';
  continueWatching.forEach(async (item) => {
    try {
      const response = await fetch(`${tmdbBaseUrl}/movie/${item.id}?api_key=${tmdbApiKey}`);
      const movie = await response.json();
      
      const movieCard = document.createElement('div');
      movieCard.classList.add('movie-card');
      movieCard.innerHTML = `
        <img src="${tmdbPosterurl}/w500${movie.poster_path}" alt="${movie.title}">
        <div class="movie-info">
          <div class="movie-title">${movie.title}</div>
        </div>
        <div class="progress-bar">
          <div class="progress" style="width: ${item.progress}%"></div>
        </div>
      `;
      
      movieCard.addEventListener('click', () => showDetails(movie.id, 'movie'));
      continueWatchingContainer.appendChild(movieCard);
    } catch (error) {
      console.error('Error loading continue watching item:', error);
    }
  });
}

// Top Rated Movies
async function loadTopRatedMovies() {
  showLoading(topRatedContainer);
  try {
    const response = await fetch(`${tmdbBaseUrl}/movie/top_rated?api_key=${tmdbApiKey}`);
    const data = await response.json();
    displayMovies(data.results, topRatedContainer);
  } catch (error) {
    console.error('Error loading top rated movies:', error);
    showError(topRatedContainer);
  }
}

// Upcoming Movies
async function loadUpcomingMovies() {
  showLoading(upcomingContainer);
  try {
    const response = await fetch(`${tmdbBaseUrl}/movie/upcoming?api_key=${tmdbApiKey}`);
    const data = await response.json();
    displayMovies(data.results, upcomingContainer);
  } catch (error) {
    console.error('Error loading upcoming movies:', error);
    showError(upcomingContainer);
  }
}

// Watchlist Functions
function addToWatchlist(movieId) {
  if (!watchlist.includes(movieId)) {
    watchlist.push(movieId);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showToast('Added to watchlist');
  } else {
    showToast('Already in watchlist');
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }, 100);
}

// Update the displayMovies function to be more generic
function displayMovies(movies, container) {
  container.innerHTML = '';
  
  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    
    const releaseDate = new Date(movie.release_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    movieCard.innerHTML = `
      <div class="movie-rating">${movie.vote_average.toFixed(1)}</div>
      <img src="${tmdbPosterurl}/w500${movie.poster_path}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-date">${releaseDate}</div>
      </div>
    `;
    
    movieCard.addEventListener('click', () => showDetails(movie.id, 'movie'));
    container.appendChild(movieCard);
  });
}

async function loadGenres() {
  try {
    const response = await fetch(`${tmdbBaseUrl}/genre/movie/list?api_key=${tmdbApiKey}`);
    const data = await response.json();
    displayGenres(data.genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
}

function displayGenres(genres) {
  const allGenrePill = document.createElement('div');
  allGenrePill.classList.add('genre-pill', 'active');
  allGenrePill.textContent = 'All';
  allGenrePill.addEventListener('click', () => filterByGenre(null));
  genreListContainer.appendChild(allGenrePill);

  genres.forEach(genre => {
    const genrePill = document.createElement('div');
    genrePill.classList.add('genre-pill');
    genrePill.textContent = genre.name;
    genrePill.addEventListener('click', () => filterByGenre(genre.id));
    genreListContainer.appendChild(genrePill);
  });
}

function filterByGenre(genreId) {
  selectedGenre = genreId;
  // Update active state of genre pills
  document.querySelectorAll('.genre-pill').forEach(pill => {
    pill.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Reload movies with selected genre
  loadTrendingMovies();
}

async function loadTrendingMovies() {
  showLoading(trendingMoviesContainer);
  
  try {
    let url = `${tmdbBaseUrl}/discover/movie?include_adult=true&include_video=false&language=en-US&page=1&sort_by=popularity.desc&api_key=${tmdbApiKey}`;
    
    if (selectedGenre) {
      url += `&with_genres=${selectedGenre}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results.length === 0) {
      showEmptyState(trendingMoviesContainer);
    } else {
      displayTrendingMovies(data.results);
    }
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    showError(trendingMoviesContainer);
  }
}

function showLoading(container) {
  container.innerHTML = '<div class="loading-spinner"></div>';
}

function showEmptyState(container) {
  container.innerHTML = '<div class="empty-state">No movies found</div>';
}

function showError(container) {
  container.innerHTML = '<div class="empty-state">Something went wrong. Please try again later.</div>';
}

function displayTrendingMovies(movies) {
  trendingMoviesContainer.innerHTML = '';
  
  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    
    const releaseDate = new Date(movie.release_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    movieCard.innerHTML = `
      <div class="movie-rating">${movie.vote_average.toFixed(1)}</div>
      <img src="${tmdbPosterurl}/w500${movie.poster_path}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-date">${releaseDate}</div>
      </div>
    `;
    
    movieCard.addEventListener('click', () => showDetails(movie.id, 'movie'));
    trendingMoviesContainer.appendChild(movieCard);
  });
}

function searchMovies() {
  const query = searchInput.value;
  if (query === '') {
    resultsContainer.innerHTML = '';
    return;
  }

  if (query.trim() !== '') {
    const apiUrl = `${tmdbBaseUrl}/search/multi?api_key=${tmdbApiKey}&query=${query}`;

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        displayResults(data.results);
      })
      .catch(error => {
        console.error('Error fetching search results:', error);
      });
  }
}

function displayResults(results) {
  resultsContainer.innerHTML = '';
  if (results.length === 0) {
    resultsContainer.innerHTML = '<p class="noResults">No results found.</p>';
    return;
  }
  results.forEach(result => {
    if (result.media_type !== 'person') {
      const resultCard = document.createElement('div');
      resultCard.classList.add('result-card');
      resultCard.innerHTML = `
        <img src="${tmdbPosterurl}/w92${result.poster_path}" alt="${result.title || result.name}">
        <div>
          <p class="title">${result.title || result.name}</p>
          <p>${result.media_type} (${getReleaseYear(result)})</p>
        </div>
      `;
      resultCard.addEventListener('click', () => showDetails(result.id, result.media_type));
      resultsContainer.appendChild(resultCard);
    }
  });
}

function getReleaseYear(result) {
  const releaseDate = result.release_date || result.first_air_date;
  return releaseDate ? new Date(releaseDate).getFullYear() : '';
}

function showDetails(id, mediaType) {
  if (mediaType === 'tv') {
    window.location.href = `details.html?id=${id}&mediaType=${mediaType}&season=1&episode=1`;
  } else {
    window.location.href = `details.html?id=${id}&mediaType=${mediaType}`;
  }
}

function handleSearchFormSubmit(event) {
  event.preventDefault();
  searchMovies();
}
