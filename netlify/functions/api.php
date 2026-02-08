<?php
/**
 * Netlify PHP Function - Movie Collection API
 * Fixed for Netlify serverless environment
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors, return JSON

// Set headers FIRST before any output
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Data file path - use /tmp for Netlify serverless
$dataFile = '/tmp/movies.json';

// Initialize with sample data if file doesn't exist
if (!file_exists($dataFile)) {
    initializeSampleData($dataFile);
}

// Parse the request
$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? $_GET['path'] : (isset($argv[1]) ? $argv[1] : '');

// For Netlify, parse from request URI if needed
if (empty($path) && isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $parts = explode('/', trim($uri, '/'));
    // Remove 'api' or '.netlify/functions/api' from path
    $path = end($parts);
}

// Route the request
try {
    switch ($method) {
        case 'GET':
            if ($path === 'movies' || $path === 'api') {
                handleGetMovies();
            } elseif (preg_match('/^movies\/(\d+)$/', $path, $matches)) {
                handleGetMovie($matches[1]);
            } elseif ($path === 'stats') {
                handleGetStats();
            } else {
                handleGetMovies(); // Default to getting movies
            }
            break;
            
        case 'POST':
            handleCreateMovie();
            break;
            
        case 'PUT':
            if (preg_match('/^movies\/(\d+)$/', $path, $matches)) {
                handleUpdateMovie($matches[1]);
            } else {
                // Try to get ID from request body
                $input = json_decode(file_get_contents('php://input'), true);
                if (isset($input['id'])) {
                    handleUpdateMovie($input['id']);
                } else {
                    sendError('Invalid endpoint', 404);
                }
            }
            break;
            
        case 'DELETE':
            if (preg_match('/^movies\/(\d+)$/', $path, $matches)) {
                handleDeleteMovie($matches[1]);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}

/**
 * GET /api/movies?page=1
 */
function handleGetMovies() {
    $movies = readMovies();
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $perPage = 10;
    
    // Optional filters
    $genre = isset($_GET['genre']) ? $_GET['genre'] : null;
    $status = isset($_GET['status']) ? $_GET['status'] : null;
    
    // Apply filters
    if ($genre && $genre !== '') {
        $movies = array_filter($movies, function($m) use ($genre) {
            return isset($m['genre']) && $m['genre'] === $genre;
        });
    }
    
    if ($status && $status !== '') {
        $movies = array_filter($movies, function($m) use ($status) {
            return isset($m['watchStatus']) && $m['watchStatus'] === $status;
        });
    }
    
    // Re-index array
    $movies = array_values($movies);
    
    $total = count($movies);
    $totalPages = $total > 0 ? ceil($total / $perPage) : 1;
    $offset = ($page - 1) * $perPage;
    
    $paginatedMovies = array_slice($movies, $offset, $perPage);
    
    sendSuccess([
        'movies' => $paginatedMovies,
        'pagination' => [
            'currentPage' => $page,
            'totalPages' => $totalPages,
            'totalRecords' => $total,
            'perPage' => $perPage,
            'hasNext' => $page < $totalPages,
            'hasPrev' => $page > 1
        ]
    ]);
}

/**
 * GET /api/movies/{id}
 */
function handleGetMovie($id) {
    $movies = readMovies();
    
    foreach ($movies as $movie) {
        if ($movie['id'] == $id) {
            sendSuccess($movie);
            return;
        }
    }
    
    sendError('Movie not found', 404);
}

/**
 * POST /api/movies
 */
function handleCreateMovie() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON', 400);
        return;
    }
    
    // Server-side validation
    $errors = validateMovie($input);
    if (!empty($errors)) {
        sendError('Validation failed', 400, ['errors' => $errors]);
        return;
    }
    
    $movies = readMovies();
    
    // Generate new ID
    $maxId = 0;
    foreach ($movies as $movie) {
        if ($movie['id'] > $maxId) {
            $maxId = $movie['id'];
        }
    }
    
    $newMovie = [
        'id' => $maxId + 1,
        'title' => trim($input['title']),
        'director' => isset($input['director']) ? trim($input['director']) : '',
        'releaseYear' => isset($input['releaseYear']) ? intval($input['releaseYear']) : null,
        'genre' => isset($input['genre']) ? trim($input['genre']) : '',
        'runtime' => isset($input['runtime']) ? intval($input['runtime']) : null,
        'watchStatus' => isset($input['watchStatus']) ? $input['watchStatus'] : 'Want to Watch',
        'personalRating' => isset($input['personalRating']) ? floatval($input['personalRating']) : null,
        'reviewNotes' => isset($input['reviewNotes']) ? trim($input['reviewNotes']) : '',
        'dateAdded' => date('c')
    ];
    
    $movies[] = $newMovie;
    writeMovies($movies);
    
    sendSuccess($newMovie, 201);
}

/**
 * PUT /api/movies/{id}
 */
function handleUpdateMovie($id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON', 400);
        return;
    }
    
    // Server-side validation
    $errors = validateMovie($input);
    if (!empty($errors)) {
        sendError('Validation failed', 400, ['errors' => $errors]);
        return;
    }
    
    $movies = readMovies();
    $found = false;
    
    foreach ($movies as $key => $movie) {
        if ($movie['id'] == $id) {
            $movies[$key] = [
                'id' => intval($id),
                'title' => trim($input['title']),
                'director' => isset($input['director']) ? trim($input['director']) : '',
                'releaseYear' => isset($input['releaseYear']) ? intval($input['releaseYear']) : null,
                'genre' => isset($input['genre']) ? trim($input['genre']) : '',
                'runtime' => isset($input['runtime']) ? intval($input['runtime']) : null,
                'watchStatus' => isset($input['watchStatus']) ? $input['watchStatus'] : 'Want to Watch',
                'personalRating' => isset($input['personalRating']) ? floatval($input['personalRating']) : null,
                'reviewNotes' => isset($input['reviewNotes']) ? trim($input['reviewNotes']) : '',
                'dateAdded' => isset($movie['dateAdded']) ? $movie['dateAdded'] : date('c')
            ];
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        sendError('Movie not found', 404);
        return;
    }
    
    writeMovies($movies);
    sendSuccess($movies[$key]);
}

/**
 * DELETE /api/movies/{id}
 */
function handleDeleteMovie($id) {
    $movies = readMovies();
    $found = false;
    
    foreach ($movies as $key => $movie) {
        if ($movie['id'] == $id) {
            array_splice($movies, $key, 1);
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        sendError('Movie not found', 404);
        return;
    }
    
    writeMovies($movies);
    sendSuccess(['message' => 'Movie deleted successfully']);
}

/**
 * GET /api/stats
 */
function handleGetStats() {
    $movies = readMovies();
    
    $total = count($movies);
    $completed = 0;
    $watching = 0;
    $wantToWatch = 0;
    $totalRuntime = 0;
    $ratingSum = 0;
    $ratingCount = 0;
    $genres = [];
    $years = [];
    
    foreach ($movies as $movie) {
        if (isset($movie['watchStatus'])) {
            if ($movie['watchStatus'] === 'Completed') $completed++;
            if ($movie['watchStatus'] === 'Watching') $watching++;
            if ($movie['watchStatus'] === 'Want to Watch') $wantToWatch++;
        }
        
        if (isset($movie['runtime']) && $movie['runtime']) {
            $totalRuntime += $movie['runtime'];
        }
        
        if (isset($movie['personalRating']) && $movie['personalRating'] && $movie['personalRating'] > 0) {
            $ratingSum += $movie['personalRating'];
            $ratingCount++;
        }
        
        if (isset($movie['genre']) && $movie['genre']) {
            $genre = $movie['genre'];
            $genres[$genre] = isset($genres[$genre]) ? $genres[$genre] + 1 : 1;
        }
        
        if (isset($movie['releaseYear']) && $movie['releaseYear']) {
            $year = $movie['releaseYear'];
            $years[$year] = isset($years[$year]) ? $years[$year] + 1 : 1;
        }
    }
    
    sendSuccess([
        'total' => $total,
        'completed' => $completed,
        'watching' => $watching,
        'wantToWatch' => $wantToWatch,
        'averageRating' => $ratingCount > 0 ? round($ratingSum / $ratingCount, 1) : 0,
        'totalRuntime' => $totalRuntime,
        'genreBreakdown' => $genres,
        'yearBreakdown' => $years
    ]);
}

/**
 * Validate movie data
 */
function validateMovie($data) {
    $errors = [];
    
    if (!isset($data['title']) || empty(trim($data['title']))) {
        $errors[] = 'Title is required';
    }
    
    if (isset($data['releaseYear']) && $data['releaseYear']) {
        $year = intval($data['releaseYear']);
        if ($year < 1888 || $year > 2030) {
            $errors[] = 'Release year must be between 1888 and 2030';
        }
    }
    
    if (isset($data['runtime']) && $data['runtime']) {
        $runtime = intval($data['runtime']);
        if ($runtime <= 0) {
            $errors[] = 'Runtime must be a positive number';
        }
    }
    
    if (isset($data['personalRating']) && $data['personalRating']) {
        $rating = floatval($data['personalRating']);
        if ($rating < 0 || $rating > 10) {
            $errors[] = 'Rating must be between 0 and 10';
        }
    }
    
    return $errors;
}

/**
 * Read movies from JSON file
 */
function readMovies() {
    global $dataFile;
    
    if (!file_exists($dataFile)) {
        return [];
    }
    
    $content = @file_get_contents($dataFile);
    if ($content === false) {
        return [];
    }
    
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

/**
 * Write movies to JSON file
 */
function writeMovies($movies) {
    global $dataFile;
    
    $json = json_encode($movies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    @file_put_contents($dataFile, $json);
}

/**
 * Send success response
 */
function sendSuccess($data, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $code = 400, $extra = []) {
    http_response_code($code);
    echo json_encode(array_merge(['success' => false, 'error' => $message], $extra), JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Initialize with 30 sample movies
 */
function initializeSampleData($dataFile) {
    $sampleMovies = [
        ['id' => 1, 'title' => 'Dune: Part Two', 'director' => 'Denis Villeneuve', 'releaseYear' => 2024, 'genre' => 'Sci-Fi', 'runtime' => 166, 'watchStatus' => 'Completed', 'personalRating' => 9.2, 'reviewNotes' => 'Epic continuation of the saga. Stunning visuals and performances.', 'dateAdded' => '2024-03-01T10:00:00Z'],
        ['id' => 2, 'title' => 'The Wild Robot', 'director' => 'Chris Sanders', 'releaseYear' => 2024, 'genre' => 'Animation', 'runtime' => 102, 'watchStatus' => 'Completed', 'personalRating' => 8.8, 'reviewNotes' => 'Heartwarming story about a robot adapting to nature.', 'dateAdded' => '2024-09-27T10:00:00Z'],
        ['id' => 3, 'title' => 'Inside Out 2', 'director' => 'Kelsey Mann', 'releaseYear' => 2024, 'genre' => 'Animation', 'runtime' => 96, 'watchStatus' => 'Completed', 'personalRating' => 8.5, 'reviewNotes' => 'Excellent sequel exploring teenage emotions.', 'dateAdded' => '2024-06-14T10:00:00Z'],
        ['id' => 4, 'title' => 'Deadpool & Wolverine', 'director' => 'Shawn Levy', 'releaseYear' => 2024, 'genre' => 'Action', 'runtime' => 128, 'watchStatus' => 'Completed', 'personalRating' => 8.3, 'reviewNotes' => 'Hilarious team-up with great chemistry.', 'dateAdded' => '2024-07-26T10:00:00Z'],
        ['id' => 5, 'title' => 'Wicked', 'director' => 'Jon M. Chu', 'releaseYear' => 2024, 'genre' => 'Musical', 'runtime' => 160, 'watchStatus' => 'Completed', 'personalRating' => 8.9, 'reviewNotes' => 'Stunning musical adaptation. Cynthia and Ariana are perfect.', 'dateAdded' => '2024-11-22T10:00:00Z'],
        ['id' => 6, 'title' => 'Gladiator II', 'director' => 'Ridley Scott', 'releaseYear' => 2024, 'genre' => 'Action', 'runtime' => 148, 'watchStatus' => 'Completed', 'personalRating' => 8.0, 'reviewNotes' => 'Solid sequel with impressive action sequences.', 'dateAdded' => '2024-11-15T10:00:00Z'],
        ['id' => 7, 'title' => 'A Quiet Place: Day One', 'director' => 'Michael Sarnoski', 'releaseYear' => 2024, 'genre' => 'Horror', 'runtime' => 99, 'watchStatus' => 'Completed', 'personalRating' => 7.8, 'reviewNotes' => 'Tense prequel showing the invasion beginning.', 'dateAdded' => '2024-06-28T10:00:00Z'],
        ['id' => 8, 'title' => 'Furiosa: A Mad Max Saga', 'director' => 'George Miller', 'releaseYear' => 2024, 'genre' => 'Action', 'runtime' => 148, 'watchStatus' => 'Watching', 'personalRating' => 8.4, 'reviewNotes' => 'Anya Taylor-Joy is phenomenal as young Furiosa.', 'dateAdded' => '2024-05-24T10:00:00Z'],
        ['id' => 9, 'title' => 'Twisters', 'director' => 'Lee Isaac Chung', 'releaseYear' => 2024, 'genre' => 'Action', 'runtime' => 122, 'watchStatus' => 'Completed', 'personalRating' => 7.5, 'reviewNotes' => 'Fun summer blockbuster with great storm effects.', 'dateAdded' => '2024-07-19T10:00:00Z'],
        ['id' => 10, 'title' => 'Nosferatu', 'director' => 'Robert Eggers', 'releaseYear' => 2024, 'genre' => 'Horror', 'runtime' => 132, 'watchStatus' => 'Want to Watch', 'personalRating' => null, 'reviewNotes' => '', 'dateAdded' => '2024-12-25T10:00:00Z'],
        ['id' => 11, 'title' => 'Beetlejuice Beetlejuice', 'director' => 'Tim Burton', 'releaseYear' => 2024, 'genre' => 'Comedy', 'runtime' => 104, 'watchStatus' => 'Completed', 'personalRating' => 7.9, 'reviewNotes' => 'Nostalgic fun with classic Burton weirdness.', 'dateAdded' => '2024-09-06T10:00:00Z'],
        ['id' => 12, 'title' => 'The Fall Guy', 'director' => 'David Leitch', 'releaseYear' => 2024, 'genre' => 'Action', 'runtime' => 126, 'watchStatus' => 'Completed', 'personalRating' => 7.6, 'reviewNotes' => 'Ryan Gosling brings charm to action-comedy.', 'dateAdded' => '2024-05-03T10:00:00Z'],
        ['id' => 13, 'title' => 'Oppenheimer', 'director' => 'Christopher Nolan', 'releaseYear' => 2024, 'genre' => 'Drama', 'runtime' => 180, 'watchStatus' => 'Completed', 'personalRating' => 9.5, 'reviewNotes' => 'Masterpiece. Cillian Murphy performance is incredible.', 'dateAdded' => '2024-01-15T10:00:00Z'],
        ['id' => 14, 'title' => 'Civil War', 'director' => 'Alex Garland', 'releaseYear' => 2024, 'genre' => 'Thriller', 'runtime' => 109, 'watchStatus' => 'Completed', 'personalRating' => 8.2, 'reviewNotes' => 'Intense journalism thriller with thought-provoking themes.', 'dateAdded' => '2024-04-12T10:00:00Z'],
        ['id' => 15, 'title' => 'Bad Boys: Ride or Die', 'director' => 'Adil & Bilall', 'releaseYear' => 2024, 'genre' => 'Action', 'runtime' => 115, 'watchStatus' => 'Completed', 'personalRating' => 7.4, 'reviewNotes' => 'Will Smith and Martin Lawrence still have it.', 'dateAdded' => '2024-06-07T10:00:00Z'],
        ['id' => 16, 'title' => 'Longlegs', 'director' => 'Osgood Perkins', 'releaseYear' => 2024, 'genre' => 'Horror', 'runtime' => 101, 'watchStatus' => 'Completed', 'personalRating' => 8.1, 'reviewNotes' => 'Nicolas Cage delivers a creepy performance.', 'dateAdded' => '2024-07-12T10:00:00Z'],
        ['id' => 17, 'title' => 'Kung Fu Panda 4', 'director' => 'Mike Mitchell', 'releaseYear' => 2024, 'genre' => 'Animation', 'runtime' => 94, 'watchStatus' => 'Completed', 'personalRating' => 7.3, 'reviewNotes' => 'Fun addition to the franchise for kids.', 'dateAdded' => '2024-03-08T10:00:00Z'],
        ['id' => 18, 'title' => 'Challengers', 'director' => 'Luca Guadagnino', 'releaseYear' => 2024, 'genre' => 'Romance', 'runtime' => 131, 'watchStatus' => 'Watching', 'personalRating' => 8.0, 'reviewNotes' => 'Stylish love triangle drama with tennis backdrop.', 'dateAdded' => '2024-04-26T10:00:00Z'],
        ['id' => 19, 'title' => 'The Substance', 'director' => 'Coralie Fargeat', 'releaseYear' => 2024, 'genre' => 'Horror', 'runtime' => 140, 'watchStatus' => 'Completed', 'personalRating' => 8.6, 'reviewNotes' => 'Demi Moore is fearless. Body horror at its finest.', 'dateAdded' => '2024-09-20T10:00:00Z'],
        ['id' => 20, 'title' => 'Moana 2', 'director' => 'David Derrick Jr.', 'releaseYear' => 2024, 'genre' => 'Animation', 'runtime' => 100, 'watchStatus' => 'Completed', 'personalRating' => 7.7, 'reviewNotes' => 'Beautiful animation and catchy songs.', 'dateAdded' => '2024-11-27T10:00:00Z'],
        ['id' => 21, 'title' => 'Alien: Romulus', 'director' => 'Fede Alvarez', 'releaseYear' => 2024, 'genre' => 'Horror', 'runtime' => 119, 'watchStatus' => 'Completed', 'personalRating' => 8.3, 'reviewNotes' => 'Return to form for the Alien franchise.', 'dateAdded' => '2024-08-16T10:00:00Z'],
        ['id' => 22, 'title' => 'Smile 2', 'director' => 'Parker Finn', 'releaseYear' => 2024, 'genre' => 'Horror', 'runtime' => 127, 'watchStatus' => 'Want to Watch', 'personalRating' => null, 'reviewNotes' => '', 'dateAdded' => '2024-10-18T10:00:00Z'],
        ['id' => 23, 'title' => 'Wicked Little Letters', 'director' => 'Thea Sharrock', 'releaseYear' => 2024, 'genre' => 'Comedy', 'runtime' => 100, 'watchStatus' => 'Completed', 'personalRating' => 7.8, 'reviewNotes' => 'Olivia Colman is delightful in this mystery comedy.', 'dateAdded' => '2024-02-23T10:00:00Z'],
        ['id' => 24, 'title' => 'The Beekeeper', 'director' => 'David Ayer', 'releaseYear' => 2024, 'genre' => 'Action', 'runtime' => 105, 'watchStatus' => 'Completed', 'personalRating' => 7.1, 'reviewNotes' => 'Jason Statham doing what he does best.', 'dateAdded' => '2024-01-12T10:00:00Z'],
        ['id' => 25, 'title' => 'Mufasa: The Lion King', 'director' => 'Barry Jenkins', 'releaseYear' => 2024, 'genre' => 'Animation', 'runtime' => 118, 'watchStatus' => 'Want to Watch', 'personalRating' => null, 'reviewNotes' => '', 'dateAdded' => '2024-12-20T10:00:00Z'],
        ['id' => 26, 'title' => 'The Apprentice', 'director' => 'Ali Abbasi', 'releaseYear' => 2024, 'genre' => 'Drama', 'runtime' => 120, 'watchStatus' => 'Watching', 'personalRating' => 7.6, 'reviewNotes' => 'Sebastian Stan transformation is impressive.', 'dateAdded' => '2024-10-11T10:00:00Z'],
        ['id' => 27, 'title' => 'Terrifier 3', 'director' => 'Damien Leone', 'releaseYear' => 2024, 'genre' => 'Horror', 'runtime' => 125, 'watchStatus' => 'Completed', 'personalRating' => 7.2, 'reviewNotes' => 'Not for the faint of heart. Extremely gory.', 'dateAdded' => '2024-10-11T10:00:00Z'],
        ['id' => 28, 'title' => 'Speak No Evil', 'director' => 'James Watkins', 'releaseYear' => 2024, 'genre' => 'Horror', 'runtime' => 110, 'watchStatus' => 'Completed', 'personalRating' => 7.9, 'reviewNotes' => 'Tense psychological thriller that keeps you on edge.', 'dateAdded' => '2024-09-13T10:00:00Z'],
        ['id' => 29, 'title' => 'Migration', 'director' => 'Benjamin Renner', 'releaseYear' => 2024, 'genre' => 'Animation', 'runtime' => 83, 'watchStatus' => 'Completed', 'personalRating' => 7.4, 'reviewNotes' => 'Charming family film about ducks migrating.', 'dateAdded' => '2024-01-19T10:00:00Z'],
        ['id' => 30, 'title' => 'Sonic the Hedgehog 3', 'director' => 'Jeff Fowler', 'releaseYear' => 2024, 'genre' => 'Action', 'runtime' => 109, 'watchStatus' => 'Want to Watch', 'personalRating' => null, 'reviewNotes' => '', 'dateAdded' => '2024-12-20T10:00:00Z']
    ];
    
    @file_put_contents($dataFile, json_encode($sampleMovies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
