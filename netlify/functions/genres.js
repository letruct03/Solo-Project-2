// Genres API endpoint
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
    const genres = [...new Set(movies.map(m => m.genre).filter(Boolean))].sort();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(genres)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
