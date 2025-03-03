import React, { useState, useEffect } from "react";
import axios from "axios";
import "./explore.css";
import ComicDetail from "../components/ComicDetails.jsx";
import ComicCard from "../components/ComicCard";

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

  const getSearchConfig = (type, offsetValue) => {
    let url = "http://localhost:5000/api/search";
    let params = { offset: offsetValue };

    if (type === "title") {
      // Using partial match search for comic titles
      params.title = searchQuery;
    } else if (type === "character") {
      // Call a dedicated endpoint for character search; backend should handle
      url = "http://localhost:5000/api/search/character";
      params.name = searchQuery;
    } else if (type === "series") {
      // Call a dedicated endpoint for series search; backend should handle
      url = "http://localhost:5000/api/search/series";
      params.series = searchQuery;
    }
    return { url, params };
  };

  // General search handler that accepts the type of search as an argument
  const handleSearch = async (type) => {
    setLoading(true);
    setOffset(0);
    try {
      const { url, params } = getSearchConfig(type, 0);
      const response = await axios.get(url, { params });
      setComics(response.data.results);
      setTotalComics(response.data.total);
    } catch (error) {
      console.error("Error fetching comics:", error.response || error.message);
      setError("Failed to fetch comics");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreComics = async () => {
    setLoading(true);
    try {
      const newOffset = offset + 20; 
      const response = await axios.get("http://localhost:5000/api/search", {
        params: { title: searchQuery, offset: newOffset },
      });
      setComics(response.data.results);
      setOffset(newOffset); 
      window.scrollTo({top:0, behavior: "smooth"});
    } catch (error) {
      console.error("Error fetching more comics:", error.response || error.message);
      setError("Failed to fetch more comics");
    } finally {
      setLoading(false);
    }
  };
  
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
        window.scrollTo({top:0, behavior: "smooth"});
      } catch (error) {
        console.error("Error fetching previous comics:", error.response || error.message);
        setError("Failed to fetch previous comics");
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Function to trigger adding to collection
  const handleAddToCollection = (comic) => {
    setSelectedComic(comic);
  };

  // Function to handle collection selection
  const handleCollectionChange = (collectionId) => {
    setSelectedCollection(collectionId);
  };

  // Function to confirm adding to collection
  const handleConfirmSelection = async () => {
    if (selectedCollection && selectedComic && user) {
      const comicData = { 
        title: selectedComic.title, 
        thumbnail: {
          path: selectedComic.thumbnail.path,
          extension: selectedComic.thumbnail.extension,
        },  
        issueNumber: selectedComic.issueNumber || 'N/A',
        creators: Array.isArray(selectedComic.creators?.items)
          ? selectedComic.creators.items.map(creator => ({
              role: creator.role || "Unknown",
              name: creator.name || "Unknown",
            }))
          : [],
        description: selectedComic.description || 'No description available',
        series: selectedComic.series.name,
      };

      try {
        await axios.post(`http://localhost:5000/api/users/${user._id}/collections/${selectedCollection}/comics`, comicData);
        alert("Comic added to collection!");
        setSelectedComic(null);
        setSelectedCollection(null);
      } catch (error) {
        console.error("Error adding comic to collection:", error);
        setError("Failed to add comic to collection");
      }
    } else {
      alert("Please select a collection.");
    }
  };


  return (
    <div className="explore-page">
      <h1>Explore Comics</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for comics or characters, characters, or series..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
         <div className="search-buttons">
          <button type="button" onClick={() => handleSearch("title")} disabled={loading}>
            Search by Title
          </button>
          <button type="button" onClick={() => handleSearch("character")} disabled={loading}>
            Search by Character
          </button>
          <button type="button" onClick={() => handleSearch("series")} disabled={loading}>
            Search by Series
          </button>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      <div className="comic-container">
        {loading ? (
          <p>Loading...</p>
        ) : (
          comics.map((comic) => (
            <ComicCard
              key={comic.id}
              comic={comic}
              onSelect={setSelectedComic}
              onAddToCollection={handleAddToCollection}
            />
          ))
        )}
      </div>

      {/* Comic Detail and Collection Selection Modal */}
      <ComicDetail 
        comic={selectedComic} 
        onClose={() => setSelectedComic(null)} 
        userCollections={user?.collections || []} 
        onCollectionChange={handleCollectionChange}
        onConfirmSelection={handleConfirmSelection}
      />
      {comics.length > 0 && (
        <div className="pagination">
          {offset > 0 && (
            <button
              className="exploreBtn"
              onClick={loadPreviousComics}
              disabled={loading}
            >
              Previous
            </button>
          )}
          {comics.length < totalComics && (
            <button
              className="exploreBtn"
              onClick={loadMoreComics}
              disabled={loading}
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ExplorePage;