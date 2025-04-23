import React from "react";
import "./css/ComicDetails.css";

const getValidThumbnailUrl = (thumbnail) => {
  if (
    !thumbnail ||
    !thumbnail.path ||
    thumbnail.path.includes("image_not_available") ||
    thumbnail.path.includes("4c002e0305708") // known broken ID from Marvel sometimes
  ) {
    return "/images/default_book_cover.webp";
  }
  return `${thumbnail.path.replace(/^http:/, 'https:')}.${thumbnail.extension}`;
};

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
      <button className="close-button" onClick={onClose}>✖</button>

      <div className="comic-header">
      <img
        src={getValidThumbnailUrl(comic.thumbnail)}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/images/default_book_cover.webp";
        }}
        alt={comic.title}
        className="comic-thumbnail"
      />

      </div>

      <div className="comic-details">
        <h2>{comic.title}</h2>
        <p><strong>Creators:</strong> {comic.creators?.items?.length > 0 ? comic.creators.items.map(c => c.name).join(", ") : "Unknown"}</p>
        <p><strong>Description:</strong> {comic.description || "No description available."}</p>
        <p><strong>Series:</strong> {comic.series?.name || "Unknown"}</p>
      </div>

      {userCollections.length > 0 && (
        <div className="collection-selector">
          <h3>Add to Collection:</h3>
          {userCollections.map((collection) => (
            <label key={collection._id}>
              <input
                type="checkbox"
                value={collection._id}
                onChange={(e) => onCollectionChange(collection._id, e.target.checked)}
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
