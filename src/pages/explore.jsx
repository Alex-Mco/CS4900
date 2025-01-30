import React, { useState, useEffect } from "react";
import axios from "axios";
import "./explore.css";

function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState(""); 
  const [comics, setComics] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [offset, setOffset] = useState(0);
  const [totalComics, setTotalComics] = useState(0);
  const [selectedComic, setSelectedComic] = useState(null);
  const [user, setUser] = useState(null); // To hold user data
  const [selectedCollection, setSelectedCollection] = useState(null); // To track selected collection
  const [error, setError] = useState(null); 

  // Fetch user data when the component mounts
  useEffect(() => {
    axios.get('http://localhost:5000/profile', { withCredentials: true })
      .then(response => setUser(response.data))
      .catch(error => console.error('Error fetching user:', error));
  }, []);

  // Handle the search form submission
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Perform the search when the user clicks the "Search" button
  const handleSearch = async () => {
    setLoading(true);
    setOffset(0);
    try {
      const response = await axios.get("http://localhost:5000/api/search", {
        params: { title: searchQuery, offset: 0 },
      });
      setComics(response.data.results);
      setTotalComics(response.data.total);
    } catch (error) {
      console.error("Error fetching comics:", error.response || error.message);
      setError("Failed to fetch comics");
    } finally {
      setLoading(false);
    }
  };

  // Load more comics when the "Next" button is clicked
  const loadMoreComics = async () => {
    setLoading(true);
    try {
      const newOffset = offset + 20; 
      const response = await axios.get("http://localhost:5000/api/search", {
        params: { title: searchQuery, offset: newOffset },
      });
      setComics((prevComics) => [...prevComics, ...response.data.results]);
      setOffset(newOffset); 
    } catch (error) {
      console.error("Error fetching more comics:", error.response || error.message);
      setError("Failed to fetch more comics");
    } finally {
      setLoading(false);
    }
  };

  // Load previous comics when the "Previous" button is clicked
  const loadPreviousComics = async () => {
    if (offset > 0) {
      setLoading(true);
      try {
        const newOffset = offset - 20;
        const response = await axios.get("http://localhost:5000/api/search", {
          params: { title: searchQuery, offset: newOffset },
        });
        setComics(response.data.results);
        setOffset(newOffset); 
      } catch (error) {
        console.error("Error fetching previous comics:", error.response || error.message);
        setError("Failed to fetch previous comics");
      } finally {
        setLoading(false);
      }
    }
  };

  // Show collection selection for the selected comic
  const handleAddToCollection = (comic) => {
    setSelectedComic(comic); 
  };

  // Handle the collection selection
  const handleCollectionChange = (collectionId) => {
    setSelectedCollection(collectionId);
  };

  // Handle the confirm button to add comic to selected collection
  const handleConfirmSelection = async () => {
    if (selectedCollection && selectedComic && user) {
      console.log(selectedComic.id)
      const comicData = { 
        title: selectedComic.title, 
        thumbnail: {
          path: selectedComic.thumbnail.path,
          extension: selectedComic.thumbnail.extension,
        },  
        issueNumber: selectedComic.issueNumber || 'N/A',
        creators: selectedComic.creators.items.map(creator => ({
          role: creator.role || 'Unknown',
          name: creator.name || 'Unknown',
        })),
        description: selectedComic.description || 'No description available',
        series: selectedComic.series.name,
      };
  
      try {
        await axios.post(`http://localhost:5000/users/${user._id}/collections/${selectedCollection}/comics`, comicData);
        alert("Comic added to collection!");
        setSelectedComic(null);
        setSelectedCollection(null);
      } catch (error) {
        console.error("Error adding comic to collection:", error.response || error.message);
        setError("Failed to add comic to collection");
      }
    } else {
      alert("Please select a collection.");
    }
  };

  return (
    <div className="explore-page">
      <h1>Explore</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for comics or characters..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <button type="button" onClick={handleSearch} disabled={loading}>
          Search
        </button>
      </div>

      {/* Search Results */}
      <div className="results">
        <h2>Search Results</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          comics.map((comic) => (
            <div key={comic.id} className="result-item">
              <img
                src={`${comic.thumbnail.path}.${comic.thumbnail.extension}`}
                alt={comic.title}
                className="thumbnail"
              />
              <div>
                <h3>{comic.title}</h3>
                <p>
                  {comic.creators.items.map((creator, index) => (
                    <span key={index}>
                      {creator.role}: {creator.name}
                      {index < comic.creators.items.length - 1 && ", "}
                    </span>
                  ))}
                </p>
                <p>{comic.description || "No description available."}</p>   
                <button onClick={() => handleAddToCollection(comic)}>
                  Add to Collection
                </button>

                {selectedComic && selectedComic.id === comic.id && user && (
                  <div className="collection-selector">
                    <h3>Select a Collection</h3>
                    <div>
                      {user.collections.map((collection) => (
                        <div key={collection._id}>
                          <input
                            type="radio"
                            id={`collection-${collection._id}`}
                            name="collection"
                            value={collection._id}
                            checked={selectedCollection === collection._id}
                            onChange={() => handleCollectionChange(collection._id)}
                          />
                          <label htmlFor={`collection-${collection._id}`}>
                            {collection.collectionName}
                          </label>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleConfirmSelection}>Confirm</button>
                    <button onClick={() => setSelectedComic(null)}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button
          className="exploreBtn"
          onClick={loadPreviousComics}
          disabled={offset === 0 || loading} 
        >
          Previous
        </button>
        <button
          className="exploreBtn"
          onClick={loadMoreComics}
          disabled={comics.length >= totalComics || loading} 
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ExplorePage;
