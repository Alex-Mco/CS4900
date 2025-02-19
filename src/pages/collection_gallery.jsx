import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './collection_gallery.css'; 

function CollectionGallery() {
  const [user, setUser] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/profile', { withCredentials: true })
      .then(response => setUser(response.data))
      .catch(error => console.error('Error fetching user:', error));
  }, []);

  const handleAddCollection = () => {
    if (newCollectionName && user) {
      axios.post(`http://localhost:5000/users/${user._id}/collections`, { collectionName: newCollectionName })
        .then(response => {
          setUser(response.data);
          setNewCollectionName(''); 
        })
        .catch(error => console.error('Error adding collection:', error));
    }
  };

  return (
    <div>
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
            {user.collections.map((collection) => (
              <Link
                key={collection._id}
                to={`/collection/${collection._id}`}
                className="collection-card"
              >
                <div className="card-content">
                  <h3>{collection.collectionName}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className='loading'>Loading...</p>
      )}
    </div>
  );
}

export default CollectionGallery;
