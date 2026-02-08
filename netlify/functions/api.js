// Netlify serverless function (Node.js)
// Movie Collection API with JSON storage

const fs = require('fs').promises;
const path = require('path');

// Data file path - use /tmp for serverless
const DATA_FILE = '/tmp/movies.json';

// Sample data
const SAMPLE_MOVIES = [
  {id: 1, title: 'Dune: Part Two', director: 'Denis Villeneuve', releaseYear: 2024, genre: 'Sci-Fi', runtime: 166, watchStatus: 'Completed', personalRating: 9.2, reviewNotes: 'Epic continuation of the saga. Stunning visuals and performances.', dateAdded: '2024-03-01T10:00:00Z'},
  {id: 2, title: 'The Wild Robot', director: 'Chris Sanders', releaseYear: 2024, genre: 'Animation', runtime: 102, watchStatus: 'Completed', personalRating: 8.8, reviewNotes: 'Heartwarming story about a robot adapting to nature.', dateAdded: '2024-09-27T10:00:00Z'},
  {id: 3, title: 'Inside Out 2', director: 'Kelsey Mann', releaseYear: 2024, genre: 'Animation', runtime: 96, watchStatus: 'Completed', personalRating: 8.5, reviewNotes: 'Excellent sequel exploring teenage emotions.', dateAdded: '2024-06-14T10:00:00Z'},
  {id: 4, title: 'Deadpool & Wolverine', director: 'Shawn Levy', releaseYear: 2024, genre: 'Action', runtime: 128, watchStatus: 'Completed', personalRating: 8.3, reviewNotes: 'Hilarious team-up with great chemistry.', dateAdded: '2024-07-26T10:00:00Z'},
  {id: 5, title: 'Wicked', director: 'Jon M. Chu', releaseYear: 2024, genre: 'Musical', runtime: 160, watchStatus: 'Completed', personalRating: 8.9, reviewNotes: 'Stunning musical adaptation. Cynthia and Ariana are perfect.', dateAdded: '2024-11-22T10:00:00Z'},
  {id: 6, title: 'Gladiator II', director: 'Ridley Scott', releaseYear: 2024, genre: 'Action', runtime: 148, watchStatus: 'Completed', personalRating: 8.0, reviewNotes: 'Solid sequel with impressive action sequences.', dateAdded: '2024-11-15T10:00:00Z'},
  {id: 7, title: 'A Quiet Place: Day One', director: 'Michael Sarnoski', releaseYear: 2024, genre: 'Horror', runtime: 99, watchStatus: 'Completed', personalRating: 7.8, reviewNotes: 'Tense prequel showing the invasion beginning.', dateAdded: '2024-06-28T10:00:00Z'},
  {id: 8, title: 'Furiosa: A Mad Max Saga', director: 'George Miller', releaseYear: 2024, genre: 'Action', runtime: 148, watchStatus: 'Watching', personalRating: 8.4, reviewNotes: 'Anya Taylor-Joy is phenomenal as young Furiosa.', dateAdded: '2024-05-24T10:00:00Z'},
  {id: 9, title: 'Twisters', director: 'Lee Isaac Chung', releaseYear: 2024, genre: 'Action', runtime: 122, watchStatus: 'Completed', personalRating: 7.5, reviewNotes: 'Fun summer blockbuster with great storm effects.', dateAdded: '2024-07-19T10:00:00Z'},
  {id: 10, title: 'Nosferatu', director: 'Robert Eggers', releaseYear: 2024, genre: 'Horror', runtime: 132, watchStatus: 'Want to Watch', personalRating: null, reviewNotes: '', dateAdded: '2024-12-25T10:00:00Z'},
  {id: 11, title: 'Beetlejuice Beetlejuice', director: 'Tim Burton', releaseYear: 2024, genre: 'Comedy', runtime: 104, watchStatus: 'Completed', personalRating: 7.9, reviewNotes: 'Nostalgic fun with classic Burton weirdness.', dateAdded: '2024-09-06T10:00:00Z'},
  {id: 12, title: 'The Fall Guy', director: 'David Leitch', releaseYear: 2024, genre: 'Action', runtime: 126, watchStatus: 'Completed', personalRating: 7.6, reviewNotes: 'Ryan Gosling brings charm to action-comedy.', dateAdded: '2024-05-03T10:00:00Z'},
  {id: 13, title: 'Oppenheimer', director: 'Christopher Nolan', releaseYear: 2024, genre: 'Drama', runtime: 180, watchStatus: 'Completed', personalRating: 9.5, reviewNotes: 'Masterpiece. Cillian Murphy performance is incredible.', dateAdded: '2024-01-15T10:00:00Z'},
  {id: 14, title: 'Civil War', director: 'Alex Garland', releaseYear: 2024, genre: 'Thriller', runtime: 109, watchStatus: 'Completed', personalRating: 8.2, reviewNotes: 'Intense journalism thriller with thought-provoking themes.', dateAdded: '2024-04-12T10:00:00Z'},
  {id: 15, title: 'Bad Boys: Ride or Die', director: 'Adil & Bilall', releaseYear: 2024, genre: 'Action', runtime: 115, watchStatus: 'Completed', personalRating: 7.4, reviewNotes: 'Will Smith and Martin Lawrence still have it.', dateAdded: '2024-06-07T10:00:00Z'},
  {id: 16, title: 'Longlegs', director: 'Osgood Perkins', releaseYear: 2024, genre: 'Horror', runtime: 101, watchStatus: 'Completed', personalRating: 8.1, reviewNotes: 'Nicolas Cage delivers a creepy performance.', dateAdded: '2024-07-12T10:00:00Z'},
  {id: 17, title: 'Kung Fu Panda 4', director: 'Mike Mitchell', releaseYear: 2024, genre: 'Animation', runtime: 94, watchStatus: 'Completed', personalRating: 7.3, reviewNotes: 'Fun addition to the franchise for kids.', dateAdded: '2024-03-08T10:00:00Z'},
  {id: 18, title: 'Challengers', director: 'Luca Guadagnino', releaseYear: 2024, genre: 'Romance', runtime: 131, watchStatus: 'Watching', personalRating: 8.0, reviewNotes: 'Stylish love triangle drama with tennis backdrop.', dateAdded: '2024-04-26T10:00:00Z'},
  {id: 19, title: 'The Substance', director: 'Coralie Fargeat', releaseYear: 2024, genre: 'Horror', runtime: 140, watchStatus: 'Completed', personalRating: 8.6, reviewNotes: 'Demi Moore is fearless. Body horror at its finest.', dateAdded: '2024-09-20T10:00:00Z'},
  {id: 20, title: 'Moana 2', director: 'David Derrick Jr.', releaseYear: 2024, genre: 'Animation', runtime: 100, watchStatus: 'Completed', personalRating: 7.7, reviewNotes: 'Beautiful animation and catchy songs.', dateAdded: '2024-11-27T10:00:00Z'},
  {id: 21, title: 'Alien: Romulus', director: 'Fede Alvarez', releaseYear: 2024, genre: 'Horror', runtime: 119, watchStatus: 'Completed', personalRating: 8.3, reviewNotes: 'Return to form for the Alien franchise.', dateAdded: '2024-08-16T10:00:00Z'},
  {id: 22, title: 'Smile 2', director: 'Parker Finn', releaseYear: 2024, genre: 'Horror', runtime: 127, watchStatus: 'Want to Watch', personalRating: null, reviewNotes: '', dateAdded: '2024-10-18T10:00:00Z'},
  {id: 23, title: 'Wicked Little Letters', director: 'Thea Sharrock', releaseYear: 2024, genre: 'Comedy', runtime: 100, watchStatus: 'Completed', personalRating: 7.8, reviewNotes: 'Olivia Colman is delightful in this mystery comedy.', dateAdded: '2024-02-23T10:00:00Z'},
  {id: 24, title: 'The Beekeeper', director: 'David Ayer', releaseYear: 2024, genre: 'Action', runtime: 105, watchStatus: 'Completed', personalRating: 7.1, reviewNotes: 'Jason Statham doing what he does best.', dateAdded: '2024-01-12T10:00:00Z'},
  {id: 25, title: 'Mufasa: The Lion King', director: 'Barry Jenkins', releaseYear: 2024, genre: 'Animation', runtime: 118, watchStatus: 'Want to Watch', personalRating: null, reviewNotes: '', dateAdded: '2024-12-20T10:00:00Z'},
  {id: 26, title: 'The Apprentice', director: 'Ali Abbasi', releaseYear: 2024, genre: 'Drama', runtime: 120, watchStatus: 'Watching', personalRating: 7.6, reviewNotes: 'Sebastian Stan transformation is impressive.', dateAdded: '2024-10-11T10:00:00Z'},
  {id: 27, title: 'Terrifier 3', director: 'Damien Leone', releaseYear: 2024, genre: 'Horror', runtime: 125, watchStatus: 'Completed', personalRating: 7.2, reviewNotes: 'Not for the faint of heart. Extremely gory.', dateAdded: '2024-10-11T10:00:00Z'},
  {id: 28, title: 'Speak No Evil', director: 'James Watkins', releaseYear: 2024, genre: 'Horror', runtime: 110, watchStatus: 'Completed', personalRating: 7.9, reviewNotes: 'Tense psychological thriller that keeps you on edge.', dateAdded: '2024-09-13T10:00:00Z'},
  {id: 29, title: 'Migration', director: 'Benjamin Renner', releaseYear: 2024, genre: 'Animation', runtime: 83, watchStatus: 'Completed', personalRating: 7.4, reviewNotes: 'Charming family film about ducks migrating.', dateAdded: '2024-01-19T10:00:00Z'},
  {id: 30, title: 'Sonic the Hedgehog 3', director: 'Jeff Fowler', releaseYear: 2024, genre: 'Action', runtime: 109, watchStatus: 'Want to Watch', personalRating: null, reviewNotes: '', dateAdded: '2024-12-20T10:00:00Z'}
];

// Read movies from storage
async function readMovies() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist, initialize with sample data
    await writeMovies(SAMPLE_MOVIES);
    return SAMPLE_MOVIES;
  }
}

// Write movies to storage
async function writeMovies(movies) {
  await fs.writeFile(DATA_FILE, JSON.stringify(movies, null, 2));
}

// Validate movie data
function validateMovie(data) {
  const errors = [];
  
  if (!data.title || !data.title.trim()) {
    errors.push('Title is required');
  }
  
  if (data.releaseYear && (data.releaseYear < 1888 || data.releaseYear > 2030)) {
    errors.push('Release year must be between 1888 and 2030');
  }
  
  if (data.runtime && data.runtime <= 0) {
    errors.push('Runtime must be a positive number');
  }
  
  if (data.personalRating && (data.personalRating < 0 || data.personalRating > 10)) {
    errors.push('Rating must be between 0 and 10');
  }
  
  return errors;
}

// Main handler
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    const method = event.httpMethod;
    const path = event.queryStringParameters?.path || '';
    const pathParts = path.split('/').filter(Boolean);
    
    // Route requests
    if (method === 'GET') {
      if (path === 'movies' || pathParts[0] === 'movies') {
        // GET /api/movies
        if (pathParts.length === 1 || !pathParts[1]) {
          const movies = await readMovies();
          const page = parseInt(event.queryStringParameters?.page || '1');
          const genre = event.queryStringParameters?.genre || '';
          const status = event.queryStringParameters?.status || '';
          const perPage = 10;
          
          // Apply filters
          let filtered = movies;
          if (genre) {
            filtered = filtered.filter(m => m.genre === genre);
          }
          if (status) {
            filtered = filtered.filter(m => m.watchStatus === status);
          }
          
          const total = filtered.length;
          const totalPages = Math.ceil(total / perPage) || 1;
          const offset = (page - 1) * perPage;
          const paginated = filtered.slice(offset, offset + perPage);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: {
                movies: paginated,
                pagination: {
                  currentPage: page,
                  totalPages,
                  totalRecords: total,
                  perPage,
                  hasNext: page < totalPages,
                  hasPrev: page > 1
                }
              }
            })
          };
        }
        
        // GET /api/movies/:id
        const id = parseInt(pathParts[1]);
        const movies = await readMovies();
        const movie = movies.find(m => m.id === id);
        
        if (!movie) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Movie not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: movie })
        };
      }
      
      if (path === 'stats') {
        const movies = await readMovies();
        const stats = {
          total: movies.length,
          completed: movies.filter(m => m.watchStatus === 'Completed').length,
          watching: movies.filter(m => m.watchStatus === 'Watching').length,
          wantToWatch: movies.filter(m => m.watchStatus === 'Want to Watch').length,
          totalRuntime: movies.reduce((sum, m) => sum + (m.runtime || 0), 0),
          averageRating: 0,
          genreBreakdown: {},
          yearBreakdown: {}
        };
        
        const rated = movies.filter(m => m.personalRating);
        if (rated.length > 0) {
          stats.averageRating = parseFloat(
            (rated.reduce((sum, m) => sum + m.personalRating, 0) / rated.length).toFixed(1)
          );
        }
        
        movies.forEach(m => {
          if (m.genre) {
            stats.genreBreakdown[m.genre] = (stats.genreBreakdown[m.genre] || 0) + 1;
          }
          if (m.releaseYear) {
            stats.yearBreakdown[m.releaseYear] = (stats.yearBreakdown[m.releaseYear] || 0) + 1;
          }
        });
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: stats })
        };
      }
    }
    
    if (method === 'POST' && path === 'movies') {
      const input = JSON.parse(event.body);
      const errors = validateMovie(input);
      
      if (errors.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Validation failed', errors })
        };
      }
      
      const movies = await readMovies();
      const maxId = Math.max(...movies.map(m => m.id), 0);
      
      const newMovie = {
        id: maxId + 1,
        title: input.title.trim(),
        director: input.director?.trim() || '',
        releaseYear: input.releaseYear || null,
        genre: input.genre?.trim() || '',
        runtime: input.runtime || null,
        watchStatus: input.watchStatus || 'Want to Watch',
        personalRating: input.personalRating || null,
        reviewNotes: input.reviewNotes?.trim() || '',
        dateAdded: new Date().toISOString()
      };
      
      movies.push(newMovie);
      await writeMovies(movies);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, data: newMovie })
      };
    }
    
    if (method === 'PUT' && pathParts[0] === 'movies' && pathParts[1]) {
      const id = parseInt(pathParts[1]);
      const input = JSON.parse(event.body);
      const errors = validateMovie(input);
      
      if (errors.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Validation failed', errors })
        };
      }
      
      const movies = await readMovies();
      const index = movies.findIndex(m => m.id === id);
      
      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: 'Movie not found' })
        };
      }
      
      movies[index] = {
        ...movies[index],
        title: input.title.trim(),
        director: input.director?.trim() || '',
        releaseYear: input.releaseYear || null,
        genre: input.genre?.trim() || '',
        runtime: input.runtime || null,
        watchStatus: input.watchStatus || 'Want to Watch',
        personalRating: input.personalRating || null,
        reviewNotes: input.reviewNotes?.trim() || ''
      };
      
      await writeMovies(movies);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: movies[index] })
      };
    }
    
    if (method === 'DELETE' && pathParts[0] === 'movies' && pathParts[1]) {
      const id = parseInt(pathParts[1]);
      const movies = await readMovies();
      const filtered = movies.filter(m => m.id !== id);
      
      if (filtered.length === movies.length) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: 'Movie not found' })
        };
      }
      
      await writeMovies(filtered);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: { message: 'Movie deleted successfully' } })
      };
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: 'Endpoint not found' })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
