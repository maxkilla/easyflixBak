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
let currentMediaType = 'movie';

// Load content when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadGenres();
  loadFeaturedMovie();
  loadContent();
  setupNavigation();
});

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      // Add active class to clicked link
      e.target.classList.add('active');
      
      // Update current media type
      if (e.target.textContent === 'TV Shows') {
        currentMediaType = 'tv';
      } else if (e.target.textContent === 'Movies') {
        currentMediaType = 'movie';
      } else if (e.target.textContent === 'My List') {
        loadWatchlist();
        return;
      }
      
      // Reload content with new media type
      loadContent();
    });
  });
}

function loadContent() {
  // Clear previous results
  resultsContainer.innerHTML = '';
  
  // Load appropriate content based on media type
  loadTrendingContent();
  loadTopRatedContent();
  loadUpcomingContent();
  
  // Show/hide sections based on media type
  const upcomingSection = document.querySelector('.upcoming-section');
  if (currentMediaType === 'tv') {
    upcomingSection.style.display = 'none';
    document.querySelector('.trending-section h2').textContent = 'Trending TV Shows';
    document.querySelector('.top-rated-section h2').textContent = 'Top Rated TV Shows';
  } else {
    upcomingSection.style.display = 'block';
    document.querySelector('.trending-section h2').textContent = 'Trending Movies';
    document.querySelector('.top-rated-section h2').textContent = 'Top Rated Movies';
  }
}

async function loadTrendingContent() {
  showLoading(trendingMoviesContainer);
  try {
    let url = `${tmdbBaseUrl}/trending/${currentMediaType}/week?api_key=${tmdbApiKey}`;
    if (selectedGenre) {
      url += `&with_genres=${selectedGenre}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    displayContent(data.results, trendingMoviesContainer);
  } catch (error) {
    console.error('Error loading trending content:', error);
    showError(trendingMoviesContainer);
  }
}

async function loadTopRatedContent() {
  showLoading(topRatedContainer);
  try {
    const response = await fetch(`${tmdbBaseUrl}/${currentMediaType}/top_rated?api_key=${tmdbApiKey}`);
    const data = await response.json();
    displayContent(data.results, topRatedContainer);
  } catch (error) {
    console.error('Error loading top rated content:', error);
    showError(topRatedContainer);
  }
}

async function loadUpcomingContent() {
  if (currentMediaType === 'movie') {
    showLoading(upcomingContainer);
    try {
      const response = await fetch(`${tmdbBaseUrl}/movie/upcoming?api_key=${tmdbApiKey}`);
      const data = await response.json();
      displayContent(data.results, upcomingContainer);
    } catch (error) {
      console.error('Error loading upcoming movies:', error);
      showError(upcomingContainer);
    }
  }
}

async function loadWatchlist() {
  // Hide other sections
  document.querySelectorAll('section').forEach(section => {
    if (!section.classList.contains('watchlist-section')) {
      section.style.display = 'none';
    }
  });

  // Create watchlist section if it doesn't exist
  let watchlistSection = document.querySelector('.watchlist-section');
  if (!watchlistSection) {
    watchlistSection = document.createElement('section');
    watchlistSection.classList.add('watchlist-section');
    document.querySelector('main').appendChild(watchlistSection);
  }

  watchlistSection.innerHTML = `
    <div class="section-header">
      <h2>My Watchlist</h2>
    </div>
    <div class="movie-grid" id="watchlistGrid"></div>
  `;

  const watchlistGrid = document.getElementById('watchlistGrid');
  showLoading(watchlistGrid);

  try {
    const watchlistItems = await Promise.all(
      watchlist.map(async (id) => {
        const response = await fetch(`${tmdbBaseUrl}/movie/${id}?api_key=${tmdbApiKey}`);
        return response.json();
      })
    );
    
    if (watchlistItems.length === 0) {
      watchlistGrid.innerHTML = '<div class="empty-state">Your watchlist is empty</div>';
    } else {
      displayContent(watchlistItems, watchlistGrid);
    }
  } catch (error) {
    console.error('Error loading watchlist:', error);
    showError(watchlistGrid);
  }
}

function displayContent(items, container) {
  container.innerHTML = '';
  
  items.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('movie-card');
    
    const releaseDate = new Date(item.release_date || item.first_air_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    card.innerHTML = `
      <div class="movie-rating">${item.vote_average.toFixed(1)}</div>
      <img src="${tmdbPosterurl}/w500${item.poster_path}" alt="${item.title || item.name}" 
           onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
      <div class="movie-info">
        <div class="movie-title">${item.title || item.name}</div>
        <div class="movie-date">${releaseDate}</div>
      </div>
    `;
    
    card.addEventListener('click', () => showDetails(item.id, currentMediaType));
    container.appendChild(card);
  });
}

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
  if (!movies || movies.length === 0) {
    showEmptyState(container);
    return;
  }

  container.innerHTML = movies.map(movie => `
    <div class="movie-card" onclick="showDetails(${movie.id}, '${currentMediaType}')">
      <img src="${tmdbPosterurl}/w342${movie.poster_path}" 
           alt="${movie.title || movie.name}"
           onerror="this.src='placeholder.jpg'">
      <div class="movie-info">
        <h3>${movie.title || movie.name}</h3>
        <div class="movie-meta">
          <span class="release-date">${getReleaseYear(movie)}</span>
          <span class="rating">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            ${(movie.vote_average * 10).toFixed(0)}%
          </span>
        </div>
      </div>
      ${movie.poster_path ? `
      <div class="hover-info">
        <p>${movie.overview.substring(0, 150)}${movie.overview.length > 150 ? '...' : ''}</p>
        <button class="btn btn-primary" onclick="event.stopPropagation(); addToWatchlist(${movie.id})">
          Add to Watchlist
        </button>
      </div>
      ` : ''}
    </div>
  `).join('');
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
  window.location.href = `details.html?id=${id}&type=${mediaType}`;
}

function handleSearchFormSubmit(event) {
  event.preventDefault();
  searchMovies();
}
