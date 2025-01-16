import React from 'react';
import { Link } from 'react-router-dom';  // Import Link from react-router-dom
import './collection_gallery.css';

const CollectionGallery = () => {
  const collections = [
    { id: 1, name: 'Collection 1', description: 'Description of collection 1' },
    { id: 2, name: 'Collection 2', description: 'Description of collection 2' },
    { id: 3, name: 'Collection 3', description: 'Description of collection 3' },
  ];

  return (
    <div className="collections-page">
      <h1 className="page-title">Collections</h1>
      <div className="collections-grid">
        {collections.map((collection) => (
          <Link to={`/collection/${collection.id}`} key={collection.id} className="collection-card-link">
            <div className="collection-card">
              <h2 className="collection-title">{collection.name}</h2>
              <p className="collection-description">{collection.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CollectionGallery;
