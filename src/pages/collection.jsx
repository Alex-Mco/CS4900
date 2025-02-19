import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './collection.css';

function CollectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [comics, setComics] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the collection details
    axios.get(`http://localhost:5000/api/users/collections/${id}`)
      .then(response => setCollection(response.data))
      .catch(error => console.error('Error fetching collection:', error));
  }, [id]);

  const handleRemoveComic = (comicId) => {
    axios
      .delete(`http://localhost:5000/api/users/collections/${id}/comics/${comicId}`)
      .then(() => {
        // Filter out the removed comic manually
        setCollection((prevCollection) => ({
          ...prevCollection,
          comics: prevCollection.comics.filter((comic) => comic._id !== comicId),
        }));
        setError(null);
      })
      .catch((error) => {
        console.error("Error removing comic:", error);
        setError("Failed to remove comic");
      });
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
    <div>
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
            {collection.comics?.length > 0 ? (
              collection.comics.map((comic) => (
                <div key={comic._id} className="comic-card">
                  <h3>{comic.title}</h3>
                  <p>
                    {Array.isArray(comic.creators) && comic.creators.length > 0
                      ? comic.creators.map((creator, index) => (
                          <span key={index}>
                            {creator?.role ? `${creator.role}: ` : ""}{creator?.name || "Unknown"}
                            {index < comic.creators.length - 1 && ", "}
                          </span>
                        ))
                      : "Creators not available"}
                  </p>
                  <p>{comic.description || "No description available."}</p>
                  <button className="remove-btn" onClick={() => handleRemoveComic(comic._id)}>
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p>No comics in this collection.</p>
            )}
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default CollectionPage;
