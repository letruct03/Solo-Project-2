// api.js - API service layer for communicating with PHP backend

const API = {
    // Base URL - will use Netlify Functions in production
    baseURL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8888/.netlify/functions/api'
        : '/.netlify/functions/api',
    
    /**
     * GET /api/movies?page=1&genre=&status=
     */
    async getMovies(page = 1, genre = '', status = '') {
        const params = new URLSearchParams({
            path: 'movies',
            page: page.toString()
        });
        
        if (genre) params.append('genre', genre);
        if (status) params.append('status', status);
        
        const response = await fetch(`${this.baseURL}?${params.toString()}`);
        return this.handleResponse(response);
    },
    
    /**
     * GET /api/movies/{id}
     */
    async getMovie(id) {
        const response = await fetch(`${this.baseURL}?path=movies/${id}`);
        return this.handleResponse(response);
    },
    
    /**
     * POST /api/movies
     */
    async createMovie(movieData) {
        const response = await fetch(`${this.baseURL}?path=movies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movieData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * PUT /api/movies/{id}
     */
    async updateMovie(id, movieData) {
        const response = await fetch(`${this.baseURL}?path=movies/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movieData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * DELETE /api/movies/{id}
     */
    async deleteMovie(id) {
        const response = await fetch(`${this.baseURL}?path=movies/${id}`, {
            method: 'DELETE'
        });
        return this.handleResponse(response);
    },
    
    /**
     * GET /api/stats
     */
    async getStats() {
        const response = await fetch(`${this.baseURL}?path=stats`);
        return this.handleResponse(response);
    },
    
    /**
     * Handle API response
     */
    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    }
};
