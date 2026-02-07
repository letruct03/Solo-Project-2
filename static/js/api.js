// api.js - API client for backend communication

const API_BASE = window.location.origin + '/api';

const API = {
    /**
     * GET all movies with pagination and filters
     */
    async getMovies(page = 1, genre = '', status = '') {
        const params = new URLSearchParams();
        params.append('page', page);
        if (genre) params.append('genre', genre);
        if (status) params.append('status', status);
        
        const response = await fetch(`${API_BASE}/movies?${params}`);
        if (!response.ok) throw new Error('Failed to fetch movies');
        return await response.json();
    },
    
    /**
     * GET single movie by ID
     */
    async getMovie(id) {
        const response = await fetch(`${API_BASE}/movies/${id}`);
        if (!response.ok) throw new Error('Movie not found');
        return await response.json();
    },
    
    /**
     * CREATE new movie
     */
    async createMovie(movieData) {
        const response = await fetch(`${API_BASE}/movies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movieData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors ? data.errors.join(', ') : 'Failed to create movie');
        }
        
        return data;
    },
    
    /**
     * UPDATE existing movie
     */
    async updateMovie(id, movieData) {
        const response = await fetch(`${API_BASE}/movies/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movieData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors ? data.errors.join(', ') : 'Failed to update movie');
        }
        
        return data;
    },
    
    /**
     * DELETE movie
     */
    async deleteMovie(id) {
        const response = await fetch(`${API_BASE}/movies/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete movie');
        }
        
        return await response.json();
    },
    
    /**
     * GET statistics
     */
    async getStats() {
        const response = await fetch(`${API_BASE}/stats`);
        if (!response.ok) throw new Error('Failed to fetch statistics');
        return await response.json();
    },
    
    /**
     * GET all genres
     */
    async getGenres() {
        const response = await fetch(`${API_BASE}/genres`);
        if (!response.ok) throw new Error('Failed to fetch genres');
        return await response.json();
    },
    
    /**
     * Initialize database with sample data
     */
    async initializeData(movies) {
        const response = await fetch(`${API_BASE}/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ movies })
        });
        
        if (!response.ok) throw new Error('Failed to initialize data');
        return await response.json();
    }
};
