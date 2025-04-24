import React from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import "./css/ComicCard.css";

const getValidThumbnailUrl = (thumbnail) => {
  if (!thumbnail || !thumbnail.url) {
    return "/images/default_book_cover.webp";
  }
  return thumbnail.url;
};


const ComicCard = ({ 
  comic, 
  onSelect, 
  showRemoveButton = false, 
  onRemove,
}) => {
  return (
    <div className="comic-cards" onClick={() => onSelect(comic)} style={{ position: 'relative' }}>
      <img 
        src={comic.thumbnail.url || `${comic.thumbnail.path}.${comic.thumbnail.extension}`} 
        alt={comic.title} 
      />
      <h3 className="comic-title">{comic.title}</h3>

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
