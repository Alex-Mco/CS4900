import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './collection.css';

function CollectionPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [comics, setComics] = useState([]);
  const [showAddComicModal, setShowAddComicModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the collection details
    axios.get(`http://localhost:5000/collections/${id}`)
      .then(response => setCollection(response.data))
      .catch(error => console.error('Error fetching collection:', error));

    // Fetch all comics available to add
    axios.get('http://localhost:5000/comics')
      .then(response => setComics(response.data))
      .catch(error => console.error('Error fetching comics:', error));
  }, [id]);

  const handleAddComic = (comicId) => {
    axios.post(`http://localhost:5000/collections/${id}/add-comic`, { comicId })
      .then(response => {
        setCollection(response.data); 
        setShowAddComicModal(false); 
        setError(null)
      })
      .catch(error => {
        console.error('Error adding comic:', error)
        setError("Failed to add comic");
      });
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
          </div>
          
          <div className="comics-cards">
            {collection.comics?.length > 0 ? (
              collection.comics.map((comic) => (
                <div key={comic._id} className="comic-card">
                  <h3>{comic.title}</h3>
                  <p>
                    {comic.creators?.length > 0
                      ? comic.creators.map((creator, index) => (
                          <span key={index}>
                            {creator.role}: {creator.name}
                            {index < comic.creators.length - 1 && ", "}
                          </span>
                        ))
                      : "Unknown Creators"}
                  </p>
                  <p>{comic.description || "No description available."}</p>
                </div>
              ))
            ) : (
              <p>No comics in this collection.</p>
            )}
          </div>
          <div className="add-container">
            <button className="add-button" onClick={() => setShowAddComicModal(true)}>Add Comic</button>
            {showAddComicModal && (
              <div className="modal">
                <h2>Select a Comic to Add</h2>
                <div className="comics-list">
                  {comics.length > 0 ? (
                    comics.map((comic) => (
                      <div key={comic._id} className="comic-item">
                        <h3>{comic.title}</h3>
                        <button onClick={() => handleAddComic(comic._id)}>Add to Collection</button>
                      </div>
                    ))
                  ) : (
                    <p>No comics available to add.</p>
                  )}
                </div>
                <button onClick={() => setShowAddComicModal(false)}>Close</button>
              </div>
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
