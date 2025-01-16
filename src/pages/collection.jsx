import React from 'react';
import { useParams } from 'react-router-dom';

// Example data for collections
const collectionsData = [
  { id: 1, name: 'Collection 1', comics: [{ id: 1, title: 'Comic 1' }, { id: 2, title: 'Comic 2' }] },
  { id: 2, name: 'Collection 2', comics: [{ id: 3, title: 'Comic 3' }, { id: 4, title: 'Comic 4' }] },
  { id: 3, name: 'Collection 3', comics: [{ id: 5, title: 'Comic 5' }, { id: 6, title: 'Comic 6' }] },
];

const CollectionPage = () => {
  const { id } = useParams();  // Get the collection ID from the URL
  const collection = collectionsData.find((col) => col.id === parseInt(id));  // Find the collection based on the ID

  if (!collection) {
    return <div>Collection not found</div>;
  }

  return (
    <div className="collection-page">
      <h1>{collection.name}</h1>
      <div className="comics-list">
        {collection.comics.map((comic) => (
          <div key={comic.id} className="comic-card">
            <h2>{comic.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionPage;
