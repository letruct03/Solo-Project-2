"""
Test script to verify Movie Collection Manager functionality
Run this after starting the Flask server
"""

import requests
import json

BASE_URL = 'http://localhost:5000'

def test_api():
    print("🧪 Testing Movie Collection Manager API\n")
    
    # Test 1: Get all movies (first page)
    print("1️⃣ Testing GET /api/movies (page 1)...")
    response = requests.get(f'{BASE_URL}/api/movies?page=1')
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Success! Found {data['pagination']['totalMovies']} total movies")
        print(f"   📄 Page 1 has {len(data['movies'])} movies")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
    
    # Test 2: Get statistics
    print("\n2️⃣ Testing GET /api/stats...")
    response = requests.get(f'{BASE_URL}/api/stats')
    if response.status_code == 200:
        stats = response.json()
        print(f"   ✅ Success!")
        print(f"   📊 Total: {stats['total']}, Completed: {stats['completed']}")
        print(f"   ⭐ Average Rating: {stats['averageRating']}")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
    
    # Test 3: Create new movie
    print("\n3️⃣ Testing POST /api/movies...")
    new_movie = {
        'title': 'Test Movie',
        'director': 'Test Director',
        'releaseYear': 2024,
        'genre': 'Test',
        'runtime': 120,
        'watchStatus': 'Want to Watch',
        'personalRating': 8.0,
        'reviewNotes': 'This is a test movie'
    }
    response = requests.post(f'{BASE_URL}/api/movies', json=new_movie)
    if response.status_code == 201:
        created = response.json()
        movie_id = created['id']
        print(f"   ✅ Success! Created movie with ID: {movie_id}")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
        return
    
    # Test 4: Get single movie
    print(f"\n4️⃣ Testing GET /api/movies/{movie_id}...")
    response = requests.get(f'{BASE_URL}/api/movies/{movie_id}')
    if response.status_code == 200:
        movie = response.json()
        print(f"   ✅ Success! Retrieved: {movie['title']}")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
    
    # Test 5: Update movie
    print(f"\n5️⃣ Testing PUT /api/movies/{movie_id}...")
    update_data = {
        'title': 'Updated Test Movie',
        'director': 'Updated Director',
        'releaseYear': 2024,
        'genre': 'Updated Genre',
        'runtime': 125,
        'watchStatus': 'Completed',
        'personalRating': 9.0,
        'reviewNotes': 'Updated review'
    }
    response = requests.put(f'{BASE_URL}/api/movies/{movie_id}', json=update_data)
    if response.status_code == 200:
        updated = response.json()
        print(f"   ✅ Success! Updated title: {updated['title']}")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
    
    # Test 6: Delete movie
    print(f"\n6️⃣ Testing DELETE /api/movies/{movie_id}...")
    response = requests.delete(f'{BASE_URL}/api/movies/{movie_id}')
    if response.status_code == 200:
        print(f"   ✅ Success! Movie deleted")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
    
    # Test 7: Verify deletion
    print(f"\n7️⃣ Verifying deletion...")
    response = requests.get(f'{BASE_URL}/api/movies/{movie_id}')
    if response.status_code == 404:
        print(f"   ✅ Success! Movie no longer exists")
    else:
        print(f"   ❌ Unexpected status {response.status_code}")
    
    # Test 8: Test pagination
    print(f"\n8️⃣ Testing pagination...")
    response = requests.get(f'{BASE_URL}/api/movies?page=2')
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Success! Page 2 has {len(data['movies'])} movies")
        print(f"   📄 Page {data['pagination']['currentPage']} of {data['pagination']['totalPages']}")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
    
    # Test 9: Test filtering
    print(f"\n9️⃣ Testing filtering by genre...")
    response = requests.get(f'{BASE_URL}/api/movies?genre=Action')
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Success! Found {data['pagination']['totalMovies']} Action movies")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
    
    print("\n✨ All tests completed!\n")

if __name__ == '__main__':
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to server.")
        print("   Make sure Flask is running: python app.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
