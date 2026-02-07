"""
Flask Backend for Movie Collection Manager
Solo Project 2 - Cloud Collection Manager
Backend Language: Python (Flask)
Data Storage: Server-side JSON files
"""

from flask import Flask, request, jsonify, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='static', template_folder='templates')

# Configuration
DATA_FILE = 'data/movies.json'
ITEMS_PER_PAGE = 10

# Initialize data directory and file
os.makedirs('data', exist_ok=True)

def load_movies():
    """Load movies from JSON file"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []

def save_movies(movies):
    """Save movies to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(movies, f, indent=2)

def validate_movie(data):
    """Server-side validation for movie data"""
    errors = []
    
    # Required field validation
    if not data.get('title') or not data.get('title').strip():
        errors.append('Title is required')
    
    # Release year validation
    if data.get('releaseYear'):
        try:
            year = int(data['releaseYear'])
            if year < 1888 or year > 2030:
                errors.append('Release year must be between 1888 and 2030')
        except (ValueError, TypeError):
            errors.append('Release year must be a valid number')
    
    # Runtime validation
    if data.get('runtime'):
        try:
            runtime = int(data['runtime'])
            if runtime <= 0:
                errors.append('Runtime must be a positive number')
        except (ValueError, TypeError):
            errors.append('Runtime must be a valid number')
    
    # Rating validation
    if data.get('personalRating'):
        try:
            rating = float(data['personalRating'])
            if rating < 0 or rating > 10:
                errors.append('Rating must be between 0 and 10')
        except (ValueError, TypeError):
            errors.append('Rating must be a valid number')
    
    return errors

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/')
def index():
    """Serve the main page"""
    return send_from_directory('templates', 'index.html')

@app.route('/<path:path>')
def serve_page(path):
    """Serve HTML pages"""
    if path.endswith('.html'):
        return send_from_directory('templates', path)
    return "Not found", 404

# ============================================================================
# CRUD API ENDPOINTS
# ============================================================================

@app.route('/api/movies', methods=['GET'])
def get_movies():
    """
    GET all movies with pagination support
    Query params:
    - page: page number (default: 1)
    - genre: filter by genre
    - status: filter by watch status
    """
    movies = load_movies()
    
    # Apply filters
    genre_filter = request.args.get('genre', '')
    status_filter = request.args.get('status', '')
    
    if genre_filter:
        movies = [m for m in movies if m.get('genre') == genre_filter]
    if status_filter:
        movies = [m for m in movies if m.get('watchStatus') == status_filter]
    
    # Pagination
    page = int(request.args.get('page', 1))
    total_movies = len(movies)
    total_pages = (total_movies + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE
    
    start_idx = (page - 1) * ITEMS_PER_PAGE
    end_idx = start_idx + ITEMS_PER_PAGE
    
    paginated_movies = movies[start_idx:end_idx]
    
    return jsonify({
        'movies': paginated_movies,
        'pagination': {
            'currentPage': page,
            'totalPages': total_pages,
            'totalMovies': total_movies,
            'itemsPerPage': ITEMS_PER_PAGE,
            'hasNext': page < total_pages,
            'hasPrev': page > 1
        }
    })

@app.route('/api/movies/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    """GET single movie by ID"""
    movies = load_movies()
    movie = next((m for m in movies if m['id'] == movie_id), None)
    
    if movie:
        return jsonify(movie)
    return jsonify({'error': 'Movie not found'}), 404

@app.route('/api/movies', methods=['POST'])
def create_movie():
    """CREATE new movie"""
    data = request.json
    
    # Server-side validation
    errors = validate_movie(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    movies = load_movies()
    
    # Generate new ID
    new_id = max([m['id'] for m in movies], default=0) + 1
    
    new_movie = {
        'id': new_id,
        'title': data.get('title', '').strip(),
        'director': data.get('director', '').strip(),
        'releaseYear': int(data['releaseYear']) if data.get('releaseYear') else None,
        'genre': data.get('genre', '').strip(),
        'runtime': int(data['runtime']) if data.get('runtime') else None,
        'watchStatus': data.get('watchStatus', 'Want to Watch'),
        'personalRating': float(data['personalRating']) if data.get('personalRating') else None,
        'reviewNotes': data.get('reviewNotes', '').strip(),
        'dateAdded': datetime.utcnow().isoformat() + 'Z'
    }
    
    movies.append(new_movie)
    save_movies(movies)
    
    return jsonify(new_movie), 201

@app.route('/api/movies/<int:movie_id>', methods=['PUT'])
def update_movie(movie_id):
    """UPDATE existing movie"""
    data = request.json
    
    # Server-side validation
    errors = validate_movie(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    movies = load_movies()
    movie = next((m for m in movies if m['id'] == movie_id), None)
    
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
    
    # Update movie fields
    movie['title'] = data.get('title', '').strip()
    movie['director'] = data.get('director', '').strip()
    movie['releaseYear'] = int(data['releaseYear']) if data.get('releaseYear') else None
    movie['genre'] = data.get('genre', '').strip()
    movie['runtime'] = int(data['runtime']) if data.get('runtime') else None
    movie['watchStatus'] = data.get('watchStatus', 'Want to Watch')
    movie['personalRating'] = float(data['personalRating']) if data.get('personalRating') else None
    movie['reviewNotes'] = data.get('reviewNotes', '').strip()
    
    save_movies(movies)
    
    return jsonify(movie)

@app.route('/api/movies/<int:movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    """DELETE movie"""
    movies = load_movies()
    original_length = len(movies)
    
    movies = [m for m in movies if m['id'] != movie_id]
    
    if len(movies) == original_length:
        return jsonify({'error': 'Movie not found'}), 404
    
    save_movies(movies)
    
    return jsonify({'message': 'Movie deleted successfully'}), 200

# ============================================================================
# STATS AND UTILITY ENDPOINTS
# ============================================================================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """GET collection statistics"""
    movies = load_movies()
    
    completed = [m for m in movies if m.get('watchStatus') == 'Completed']
    watching = [m for m in movies if m.get('watchStatus') == 'Watching']
    want_to_watch = [m for m in movies if m.get('watchStatus') == 'Want to Watch']
    
    # Calculate average rating
    rated_movies = [m for m in movies if m.get('personalRating') and m['personalRating'] > 0]
    avg_rating = sum(m['personalRating'] for m in rated_movies) / len(rated_movies) if rated_movies else 0
    
    # Total runtime
    total_runtime = sum(m.get('runtime', 0) or 0 for m in movies)
    
    # Genre breakdown
    genre_breakdown = {}
    for movie in movies:
        genre = movie.get('genre', 'Unknown')
        if genre:
            genre_breakdown[genre] = genre_breakdown.get(genre, 0) + 1
    
    # Year breakdown
    year_breakdown = {}
    for movie in movies:
        year = movie.get('releaseYear')
        if year:
            year_breakdown[str(year)] = year_breakdown.get(str(year), 0) + 1
    
    return jsonify({
        'total': len(movies),
        'completed': len(completed),
        'watching': len(watching),
        'wantToWatch': len(want_to_watch),
        'averageRating': round(avg_rating, 1),
        'totalRuntime': total_runtime,
        'genreBreakdown': genre_breakdown,
        'yearBreakdown': year_breakdown
    })

@app.route('/api/genres', methods=['GET'])
def get_genres():
    """GET all unique genres"""
    movies = load_movies()
    genres = sorted(set(m.get('genre', '') for m in movies if m.get('genre')))
    return jsonify(genres)

@app.route('/api/init', methods=['POST'])
def initialize_data():
    """Initialize database with sample data (for testing)"""
    if os.path.exists(DATA_FILE):
        return jsonify({'message': 'Data already exists'}), 400
    
    # Load sample data from request
    sample_data = request.json.get('movies', [])
    save_movies(sample_data)
    
    return jsonify({'message': f'Initialized with {len(sample_data)} movies'}), 201

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Initialize with sample data if empty
    if not os.path.exists(DATA_FILE) or len(load_movies()) == 0:
        print("No data found. Please use /api/init endpoint to load sample data.")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
