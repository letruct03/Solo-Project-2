// app.js - Main application logic with API integration and pagination

let currentPage = 1;
let currentGenre = '';
let currentStatus = '';
let paginationData = null;

document.addEventListener('DOMContentLoaded', function() {
    // Load and display movies
    loadMovies();
    
    // Populate genre filter
    populateGenreFilter();
    
    // Setup event listeners
    setupEventListeners();
});

async function loadMovies() {
    showLoading(true);
    hideError();
    
    try {
        const result = await API.getMovies(currentPage, currentGenre, currentStatus);
        
        if (result.success) {
            displayMovies(result.data.movies);
            paginationData = result.data.pagination;
            displayPagination(paginationData);
        } else {
            showError('Failed to load movies');
        }
    } catch (error) {
        showError('Error loading movies: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function displayMovies(movies) {
    const grid = document.getElementById('moviesGrid');
    
    if (movies.length === 0) {
        grid.innerHTML = '<p class="no-results">No movies found. Start by adding your first movie!</p>';
        return;
    }
    
    grid.innerHTML = movies.map(movie => `
        <div class="movie-card">
            <h3>${escapeHtml(movie.title)}</h3>
            <p class="movie-meta">
                <strong>${escapeHtml(movie.director || 'Unknown Director')}</strong> ${movie.releaseYear ? `(${movie.releaseYear})` : ''}
            </p>
            ${movie.genre ? `<p class="movie-genre">${escapeHtml(movie.genre)}</p>` : ''}
            ${movie.runtime ? `<p class="movie-runtime">${movie.runtime} min</p>` : ''}
            
            <div class="movie-status">
                <span class="status-badge status-${movie.watchStatus.toLowerCase().replace(/\s+/g, '-')}">
                    ${escapeHtml(movie.watchStatus)}
                </span>
            </div>
            
            ${movie.personalRating ? `
                <div class="movie-rating">
                    ⭐ ${movie.personalRating}/10
                </div>
            ` : ''}
            
            ${movie.reviewNotes ? `
                <p class="movie-review">"${escapeHtml(movie.reviewNotes.substring(0, 100))}${movie.reviewNotes.length > 100 ? '...' : ''}"</p>
            ` : ''}
            
            <div class="movie-actions">
                <a href="edit.html?id=${movie.id}" class="btn btn-small">Edit</a>
                <button onclick="deleteMovie(${movie.id})" class="btn btn-small btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

function displayPagination(pagination) {
    const container = document.getElementById('paginationControls');
    
    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    
    // Previous button
    if (pagination.hasPrev) {
        html += `<button onclick="goToPage(${pagination.currentPage - 1})" class="btn btn-small">← Previous</button>`;
    } else {
        html += `<button class="btn btn-small" disabled>← Previous</button>`;
    }
    
    // Page info
    html += `<span class="page-info">Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalRecords} total movies)</span>`;
    
    // Next button
    if (pagination.hasNext) {
        html += `<button onclick="goToPage(${pagination.currentPage + 1})" class="btn btn-small">Next →</button>`;
    } else {
        html += `<button class="btn btn-small" disabled>Next →</button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function populateGenreFilter() {
    try {
        // Fetch all movies to get unique genres
        const result = await API.getMovies(1, '', '');
        
        if (result.success) {
            const genres = new Set();
            
            // We need to fetch all pages to get all genres
            const totalPages = result.data.pagination.totalPages;
            for (let page = 1; page <= totalPages; page++) {
                const pageResult = await API.getMovies(page, '', '');
                if (pageResult.success) {
                    pageResult.data.movies.forEach(m => {
                        if (m.genre) genres.add(m.genre);
                    });
                }
            }
            
            const genreFilter = document.getElementById('genreFilter');
            const sortedGenres = Array.from(genres).sort();
            
            sortedGenres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre;
                genreFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

function setupEventListeners() {
    document.getElementById('genreFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
}

function applyFilters() {
    currentGenre = document.getElementById('genreFilter').value;
    currentStatus = document.getElementById('statusFilter').value;
    currentPage = 1; // Reset to first page when filtering
    loadMovies();
}

function clearFilters() {
    document.getElementById('genreFilter').value = '';
    document.getElementById('statusFilter').value = '';
    currentGenre = '';
    currentStatus = '';
    currentPage = 1;
    loadMovies();
}

async function deleteMovie(id) {
    if (!confirm('Are you sure you want to delete this movie? This action cannot be undone.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await API.deleteMovie(id);
        
        if (result.success) {
            // If we deleted the last item on a page, go back one page
            if (paginationData && paginationData.currentPage > 1) {
                // Check if this was the last item on the current page
                const moviesOnPage = document.querySelectorAll('.movie-card').length;
                if (moviesOnPage === 1) {
                    currentPage = Math.max(1, currentPage - 1);
                }
            }
            
            loadMovies();
        } else {
            showError('Failed to delete movie');
        }
    } catch (error) {
        showError('Error deleting movie: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const loader = document.getElementById('loadingIndicator');
    loader.style.display = show ? 'block' : 'none';
}

function showError(message) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `
        <div class="alert alert-error">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function hideError() {
    document.getElementById('errorContainer').innerHTML = '';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
