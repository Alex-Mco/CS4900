import React from "react";
import "./ComicDetails.css";

const ComicDetails = ({ 
  comic, 
  onClose, 
  userCollections = [], 
  onCollectionChange, 
  onConfirmSelection, 
  showRemoveButton = false, 
  onRemove 
}) => {
  if (!comic) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button (Top Right) */}
        <button className="close-button" onClick={onClose}>✖</button>
        
        <div className="comic-header">
          <img
            src={`${comic.thumbnail.path.replace(/^http:/, 'https:')}.${comic.thumbnail.extension}`}
            alt={comic.title}
            className="comic-image"
          />
          <h2>{comic.title}</h2>
        </div>

        <p className="comicDets"><strong>Creators:</strong> 
          {comic.creators?.items?.length > 0 
            ? comic.creators.items.map(c => c.name).join(", ") 
            : "Unknown"}
        </p>
        <p className="comicDets"><strong>Description:</strong> {comic.description || "No description available."}</p>
        <p className="comicDets"><strong>Series: </strong> {comic.series?.name || "Unknown"}</p>

        {/* Collection Selection Section (Only show if collections exist) */}
        {userCollections.length > 0 && (
          <div className="collection-selector">
            <h3>Select a Collection to Add this Comic to:</h3>
            {userCollections.map((collection) => (
              <label key={collection._id}>
                <input 
                  type="radio" 
                  name="collection" 
                  value={collection._id} 
                  onChange={() => onCollectionChange(collection._id)} 
                />
                {collection.collectionName}
              </label>
            ))}
            <button onClick={onConfirmSelection}>Confirm</button>
          </div>
        )}

        {/* Remove Button (Only show if applicable) */}
        {showRemoveButton && (
          <button 
            className="remove-btn" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent closing the modal when clicking the button
              onRemove();
            }}
          >
            Remove from Collection
          </button>
        )}

      </div>
    </div>
  );
};

export default ComicDetails;
