# Movie Collection Manager - Solo Project 2

## 🌐 Live Application

**Netlify URL:** https://solo-project-2.netlify.app  
*(Replace with your actual Netlify URL after deployment)*

## 🛠️ Backend Language

**Node.js (JavaScript)** - Netlify Serverless Functions

## 💾 JSON Persistence

Data is stored in **server-side JSON files** using Node.js file system operations. The backend maintains a `movies.json` file in `/tmp/` directory that persists movie data across requests. All CRUD operations read from and write to this JSON file, ensuring data is stored on the server rather than in the browser's localStorage.

**Key Points:**
- Data is stored server-side in JSON format
- File location: `/tmp/movies.json` (writable in Netlify serverless environment)
- Initializes automatically with 30 sample movies on first run
- All create, read, update, and delete operations modify this server-side file
- Data persists across browser sessions and page refreshes

## 📁 Project Architecture

### Frontend (Static HTML/CSS/JS)
```
public/
├── index.html          # Movie list with pagination (10 per page)
├── add.html            # Add new movie form
├── edit.html           # Edit existing movie form
├── stats.html          # Collection statistics
├── css/
│   └── style.css       # Complete styling
└── js/
    ├── api.js          # API service layer - handles all HTTP requests
    └── app.js          # Main application logic and pagination
```

### Backend (Node.js Serverless Function)
```
netlify/
└── functions/
    └── api.js          # Single serverless function handling all API endpoints
```

## 📊 Technical Details

**Data Flow:**
1. User interacts with frontend (HTML/CSS/JS)
2. Frontend calls API via `fetch()` requests in `api.js`
3. Netlify routes request to serverless function `api.js`
4. Function reads/writes to `movies.json` file
5. Function returns JSON response
6. Frontend updates UI based on response

**Server-Side Validation:**
- Title is required
- Release year must be between 1888-2030
- Runtime must be positive number
- Rating must be between 0-10

**Pagination:**
- Fixed page size of 10 records
- Next/Previous navigation buttons
- Current page indicator
- Works correctly with filters and CRUD operations

## 🔗 GitHub Repository

**Repository URL:** https://github.com/letruct03/Solo-Project-2  
