import React, { useState, useEffect } from "react";
import axios from "axios";
import "./home.css";
import ComicDetail from "../components/ComicDetails.jsx";
import ComicCard from "../components/ComicCard";

function HomePage() {
  const [comics, setComics] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [offset, setOffset] = useState(0);
  const [totalComics, setTotalComics] = useState(0);
  const [selectedComic, setSelectedComic] = useState(null);
  const [user, setUser] = useState(null); // To hold user data
  const [error, setError] = useState(null); 
  

  // Fetch user data when the component mounts
  useEffect(() => {
    axios.get('http://localhost:5000/profile', { withCredentials: true })
      .then(response => setUser(response.data))
      .catch(error => console.error('Error fetching user:', error));
  }, []);

  return (
    <div className="home-page">
      <h1>Home</h1>

      <div className="comic-container">
        {loading ? (
          <p>Loading...</p>
        ) : (
          comics.map((comic) => (
            <ComicCard
              key={comic.id}
              comic={comic}
              onSelect={setSelectedComic}
            />
          ))
        )}
      </div>

      {/* Comic Detail and Collection Selection Modal */}
      <ComicDetail 
        comic={selectedComic} 
        onClose={() => setSelectedComic(null)} 
        userCollections={user?.collections || []}
      />
    </div>
  );
}

export default HomePage;