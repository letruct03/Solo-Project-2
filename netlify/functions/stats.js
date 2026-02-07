// Stats API endpoint
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'movies.json');

function loadMovies() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading movies:', error);
  }
  return [];
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const movies = loadMovies();
    
    const completed = movies.filter(m => m.watchStatus === 'Completed');
    const watching = movies.filter(m => m.watchStatus === 'Watching');
    const wantToWatch = movies.filter(m => m.watchStatus === 'Want to Watch');
    
    // Calculate average rating
    const rated = movies.filter(m => m.personalRating && m.personalRating > 0);
    const avgRating = rated.length > 0 
      ? (rated.reduce((sum, m) => sum + m.personalRating, 0) / rated.length).toFixed(1)
      : 0;
    
    // Total runtime
    const totalRuntime = movies.reduce((sum, m) => sum + (m.runtime || 0), 0);
    
    // Genre breakdown
    const genreBreakdown = {};
    movies.forEach(movie => {
      if (movie.genre) {
        genreBreakdown[movie.genre] = (genreBreakdown[movie.genre] || 0) + 1;
      }
    });
    
    // Year breakdown
    const yearBreakdown = {};
    movies.forEach(movie => {
      if (movie.releaseYear) {
        yearBreakdown[movie.releaseYear] = (yearBreakdown[movie.releaseYear] || 0) + 1;
      }
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        total: movies.length,
        completed: completed.length,
        watching: watching.length,
        wantToWatch: wantToWatch.length,
        averageRating: parseFloat(avgRating),
        totalRuntime: totalRuntime,
        genreBreakdown: genreBreakdown,
        yearBreakdown: yearBreakdown
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
