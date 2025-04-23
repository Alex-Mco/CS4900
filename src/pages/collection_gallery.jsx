import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/collection_gallery.css';
import CollectionCard from '../components/CollectionCard'; 

function CollectionGallery() {
  const [user, setUser] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/profile`, { withCredentials: true })
      .then(response => setUser(response.data))
      .catch(error => console.error('Error fetching user:', error));
  }, []);

  const handleAddCollection = () => {
    if (newCollectionName && user) {
      axios.post(`${import.meta.env.VITE_API_URL}/api/users/${user._id}/collections`, { collectionName: newCollectionName })
        .then(response => {
          setUser(response.data);
          setNewCollectionName(''); 
        })
        .catch(error => console.error('Error adding collection:', error));
    }
  };

  const handleDeleteCollection = (id) => {
    if (window.confirm("Are you sure you want to delete this collection? All comics inside will be removed.")) {
      axios.delete(`${import.meta.env.VITE_API_URL}/api/users/collections/${id}`)
        .then(() => {
          setUser(response.data);
        })
        .catch(error => console.error('Error deleting collection:', error));
    }
  };

  return (
    <div className="collection-gallery">
      <h1>Collections</h1>
      {user ? (
        <div className='collection-container'>
          <div className="title-entry">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Enter title for new collection"
            />
            <button onClick={handleAddCollection}>Add Collection</button>
          </div>


          <div className="collection-cards">
            {user?.collections?.length > 0 ? (
              user.collections.map((collection) => (
                <CollectionCard
                  key={collection._id}
                  id={collection._id}
                  name={collection.collectionName}
                  comicCount={collection.comics?.length || 0}
                  onDelete={handleDeleteCollection}
                />
              ))) : (
                <p>No collections yet.</p>
            )}
          </div>
        </div>
      ) : (
        <p className='loading'>Loading...</p>
      )}
    </div>
  );
}


export default CollectionGallery;

