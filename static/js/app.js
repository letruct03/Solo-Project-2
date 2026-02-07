// app.js - Main application logic with pagination and API integration

let currentPage = 1;
let currentGenreFilter = '';
let currentStatusFilter = '';

document.addEventListener('DOMContentLoaded', function() {
    // Load and display movies
    loadMovies();
    
    // Populate genre filter
    populateGenreFilter();
    
    // Setup event listeners
    setupEventListeners();
});

async function loadMovies(page = 1) {
    try {
        currentPage = page;
        
        // Show loading state
        const grid = document.getElementById('moviesGrid');
        grid.innerHTML = '<p class="no-results">Loading movies...</p>';
        
        // Fetch movies with pagination
        const data = await API.getMovies(page, currentGenreFilter, currentStatusFilter);
        
        displayMovies(data.movies, data.pagination);
        
    } catch (error) {
        console.error('Error loading movies:', error);
        const grid = document.getElementById('moviesGrid');
        grid.innerHTML = '<p class="no-results">Error loading movies. Please try again.</p>';
    }
}

function displayMovies(movies, pagination) {
    const grid = document.getElementById('moviesGrid');
    
    if (movies.length === 0) {
        grid.innerHTML = '<p class="no-results">No movies found. Start by adding your first movie!</p>';
        updatePaginationControls(pagination);
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
    
    updatePaginationControls(pagination);
}

function updatePaginationControls(pagination) {
    // Remove existing pagination if present
    let paginationContainer = document.getElementById('paginationControls');
    if (paginationContainer) {
        paginationContainer.remove();
    }
    
    // Create new pagination controls
    if (pagination.totalPages > 1) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationControls';
        paginationContainer.className = 'pagination-controls';
        
        let html = '<div class="pagination-inner">';
        
        // Previous button
        if (pagination.hasPrev) {
            html += `<button onclick="loadMovies(${pagination.currentPage - 1})" class="btn btn-small">← Previous</button>`;
        } else {
            html += `<button class="btn btn-small" disabled>← Previous</button>`;
        }
        
        // Page indicator
        html += `<span class="page-indicator">Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalMovies} total movies)</span>`;
        
        // Next button
        if (pagination.hasNext) {
            html += `<button onclick="loadMovies(${pagination.currentPage + 1})" class="btn btn-small">Next →</button>`;
        } else {
            html += `<button class="btn btn-small" disabled>Next →</button>`;
        }
        
        html += '</div>';
        paginationContainer.innerHTML = html;
        
        const grid = document.getElementById('moviesGrid');
        grid.parentNode.insertBefore(paginationContainer, grid.nextSibling);
    }
}

async function populateGenreFilter() {
    try {
        const genres = await API.getGenres();
        
        const genreFilter = document.getElementById('genreFilter');
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });
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
    currentGenreFilter = document.getElementById('genreFilter').value;
    currentStatusFilter = document.getElementById('statusFilter').value;
    loadMovies(1); // Reset to page 1 when filters change
}

function clearFilters() {
    document.getElementById('genreFilter').value = '';
    document.getElementById('statusFilter').value = '';
    currentGenreFilter = '';
    currentStatusFilter = '';
    loadMovies(1);
}

async function deleteMovie(id) {
    if (confirm('Are you sure you want to delete this movie? This action cannot be undone.')) {
        try {
            await API.deleteMovie(id);
            
            // Reload current page, or go to previous page if current is empty
            loadMovies(currentPage);
            
        } catch (error) {
            console.error('Error deleting movie:', error);
            alert('Failed to delete movie. Please try again.');
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
