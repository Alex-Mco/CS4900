import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/explore.css";
import ComicDetail from "../components/ComicDetails.jsx";
import ComicCard from "../components/ComicCard";

function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [comics, setComics] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [offset, setOffset] = useState(0);
  const [total, setTotalComics] = useState(0);
  const [selectedComic, setSelectedComic] = useState(null);
  const [user, setUser] = useState(null); // To hold user data
  const [selectedCollections, setSelectedCollections] = useState(new Set()); // To track selected collection
  const [error, setError] = useState(null); 
  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);


  // Fetch user data when the component mounts
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/profile`, { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(err => {
        console.error("Failed to load user:", err);
        setError("Failed to load user data");
      });

    const savedHistory = JSON.parse(localStorage.getItem("searchHistory"));
    if (savedHistory) setSearchHistory(savedHistory);
  }, []);

  const getSearchConfig = (type, offsetValue) => {
    let url = `${import.meta.env.VITE_API_URL}/api/search`;
    let params = { offset: offsetValue };

    if (type === "title") {
      params.title = searchQuery;
    } else if (type === "character") {
      url = `${import.meta.env.VITE_API_URL}/api/search/character`;
      params.name = searchQuery;
    }

    return { url, params };
  };

  const transformComicVineData = (results) => {
    if (!Array.isArray(results)) return [];

    return results.map(item => {
      const rawTitle = item.name || "";
      const seriesName = item.volume?.name || "Unknown Series";
      const issueNumber = item.issue_number || "N/A";
      const composedTitle = rawTitle.trim() ? rawTitle : `${seriesName} #${issueNumber}`;
      const plainDescription = item.description ? item.description.replace(/<[^>]+>/g, '') : "No description available";

      return {
        id: item.id,
        title: composedTitle,
        issueNumber,
        creators: {
          items: (item.person_credits || []).map(person => ({
            role: person.role || "Unknown",
            name: person.name || "Unknown"
          }))
        },
        description: plainDescription,
        thumbnail: {
          url: item.image?.original_url
        },
        series: { name: seriesName }
      };
    });
  };

  const handleSearch = async (type) => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query.");
      return;
    }

    if (!searchHistory.includes(searchQuery)) {
      const updatedHistory = [searchQuery, ...searchHistory.slice(0, 9)];
      setSearchHistory(updatedHistory);
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    }

    setLoading(true);
    setOffset(0);

    try {
      const { url, params } = getSearchConfig(type, 0);
      const response = await axios.get(url, { params });
      const formattedComics = transformComicVineData(response.data.results || []);
      setComics(formattedComics);
      setError(null);
    } catch (error) {
      console.error("Error fetching comics:", error.response || error.message);
      setError("Failed to fetch comics");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreComics = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    const newOffset = offset + 20;

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/search`, {
        params: { title: searchQuery, offset: newOffset },
      });
      const formattedComics = transformComicVineData(response.data.results || []);
      setComics(formattedComics);
      setOffset(newOffset);
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error fetching more comics:", error.response || error.message);
      setError("Failed to fetch more comics");
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousComics = async () => {
    if (!searchQuery.trim() || offset <= 0) return;

    setLoading(true);
    const newOffset = offset - 20;

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/search`, {
        params: { title: searchQuery, offset: newOffset },
      });
      const formattedComics = transformComicVineData(response.data.results || []);
      setComics(formattedComics);
      setOffset(newOffset);
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error fetching previous comics:", error.response || error.message);
      setError("Failed to fetch previous comics");
    } finally {
      setLoading(false);
    }
  };
  

  // Function to handle collection selection
  const handleCollectionChange = (collectionId, isChecked) => {
    setSelectedCollections(prev => {
      const updated = new Set(prev);
      if (isChecked) {
        updated.add(collectionId);
      } else {
        updated.delete(collectionId);
      }
      return updated;
    });
  };  

  // Function to confirm adding to collection
  const handleConfirmSelection = async () => {
    if (selectedCollections.size > 0 && selectedComic && user) {
      const comicData = { 
        title: selectedComic.title, 
        thumbnail: {
          url: selectedComic.thumbnail?.url || "/images/default_book_cover.webp"
        },  
        issueNumber: selectedComic.issueNumber || '1',
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
        await axios.post(`${import.meta.env.VITE_API_URL}/api/users/${user._id}/comics/add-to-collections`, {
          collectionIds: Array.from(selectedCollections),
          comic: comicData
        });
  
        alert("Comic added to selected collections!");
        setSelectedComic(null);
        setSelectedCollections(new Set());
      } catch (error) {
        console.error("Error adding comic to collection:", error);
        setError("Failed to add comic to collection");
      }
    } else {
      alert("Please select at least one collection.");
    }
  };
  
  return (
    <div className="explore-page">
      <h1>Explore Comics</h1>
      <div className="search-bar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // allows click
          />

          {showSuggestions && searchQuery && (
            <ul className="suggestion-list">
              {searchHistory
                .filter(q => q.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((suggestion, i) => (
                  <li key={i} onClick={() => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                  }}>
                    {suggestion}
                  </li>
                ))
              }
            </ul>
          )}
        </div>
        <div className="search-buttons">
          <button type="button" onClick={() => handleSearch("title")} disabled={loading}>
            Search by Title
          </button>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}
      {!loading && comics.length > 0 && (
        <p className="comic-count">
          Showing {offset + 1}–{offset + comics.length}
        </p>
      )}


      <div className="comic-container">
        {loading ? (
          <p>Loading...</p>
        ) : !user ? (
          <p>Loading user...</p>
        ) : (
          comics.map((comic) => (
            <ComicCard
              key={comic.id}
              comic={comic}
              onSelect={setSelectedComic}
              isFavorite={favorites.includes(comic._id ?? comic.id)}
              onToggleFavorite={(c) => toggleFavorite(user._id, c, setFavorites)}
            />
          ))
        )}
      </div>

      <ComicDetail 
        comic={selectedComic} 
        onClose={() => setSelectedComic(null)} 
        userCollections={user?.collections || []} 
        onCollectionChange={handleCollectionChange}
        onConfirmSelection={handleConfirmSelection}
      />
      <p><br></br></p>
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
            <button className="exploreBtn" onClick={loadMoreComics} disabled={loading}>
              Next
            </button>
        </div>
      )}
    </div>
  );
}

export default ExplorePage;