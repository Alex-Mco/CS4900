import React from "react";
import "./ComicCard.css";

const ComicCard = ({ comic, onSelect, showRemoveButton = false, onRemove }) => {
  return (
    <div className="comic-cards" onClick={() => onSelect(comic)}> 
      <img
        src={`${comic.thumbnail.path.replace(/^http:/, 'https:')}.${comic.thumbnail.extension}`}
        alt={comic.title}
        className="comic-thumbnail"
      />
      <h3 className="comic-title">{comic.title}</h3>
      
      {/* Conditionally render the Remove button */}
      {showRemoveButton && (
        <button 
          className="remove-btn" 
          onClick={(e) => {
            e.stopPropagation(); 
            onRemove();
          }}
        >
          Remove from Collection
        </button>
      )}
    </div>
  );
};

export default ComicCard;
