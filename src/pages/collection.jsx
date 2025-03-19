import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './collection.css';
import ComicCard from "../components/ComicCard";
import ComicDetail from "../components/ComicDetails.jsx";

function CollectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [comics, setComics] = useState([]);
  const [selectedComic, setSelectedComic] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the collection details
    axios.get(`http://localhost:5000/api/users/collections/${id}`)
      .then(response => setCollection(response.data))
      .catch(error => console.error('Error fetching collection:', error));
  }, [id]);

  const handleRemoveComic = (comicId) => {
    if (window.confirm("Are you sure you want to delete this comic from the collection?")) {
      axios
        .delete(`http://localhost:5000/api/users/collections/${id}/comics/${comicId}`)
        .then(() => {
          console.log("Comic successfully removed from backend");
          // Filter out the removed comic manually
          setCollection((prevCollection) => {
            if (!prevCollection) return null;
            const updatedComics = prevCollection.comics.filter((comic) => comic._id !== comicId);
            console.log("Updated comics after removal:", updatedComics);
            return { ...prevCollection, comics: [...updatedComics] };
          });
  
          // Close the modal if the removed comic is currently selected
          setSelectedComic((prevSelected) => (prevSelected?._id === comicId ? null : prevSelected));
  
          setError(null);
        })
        .catch((error) => {
          console.error("Error removing comic:", error);
          setError("Failed to remove comic");
        });
    }
  };
  
  const handleDeleteCollection = () => {
    if (window.confirm("Are you sure you want to delete this collection? All comics inside will be removed.")) {
      axios.delete(`http://localhost:5000/api/users/collections/${id}`)
        .then(() => {
          navigate("/collections");
        })
        .catch(error => console.error('Error deleting collection:', error));
    }
  };

  return (
    <div className="collection-page">
      {error && <p role="alert">{error}</p>}
      {collection ? (
        <div>
          <div className="header-container">
            <Link to="/collections">
              <button>Back to Collections</button>
            </Link>
            <h1 className="collection-title">{collection.collectionName}</h1>
            <button className="delete-btn" onClick={() => handleDeleteCollection(collection._id)}>
              Delete Collection
            </button>
          </div>
          
          <div className="comics-cards">
          <div className="comic-container">
            {collection.comics?.length > 0 ? (
              collection.comics.map((comic) => (
                <ComicCard
                  key={comic._id}
                  comic={comic}
                  onSelect={setSelectedComic}
                  showAddToCollection={false} // Ensure add button is hidden
                  showRemoveButton={true} // Show remove button
                  onRemove={() => handleRemoveComic(comic._id)}
                />
              ))
            ) : (
              <p>No comics in this collection.</p>
            )}
          </div>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
      {/* Comic Detail Modal */}
      {selectedComic && (
        <ComicDetail 
          comic={selectedComic} 
          onClose={() => setSelectedComic(null)} 
          showAddToCollection={false} // Hide add button
          showRemoveButton={true} // Show remove button
          onRemove={() => handleRemoveComic(selectedComic._id)}
        />
      )}
    </div>
  );
}

export default CollectionPage;
