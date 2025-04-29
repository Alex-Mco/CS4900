import React from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import "./css/ComicCard.css";

const getValidThumbnailUrl = (thumbnail) => {
  if (!thumbnail) return "/images/default_book_cover.webp";
  if (thumbnail.url) return thumbnail.url;
  if (thumbnail.path && thumbnail.extension) {
    return `${thumbnail.path}.${thumbnail.extension}`;
  }
  return "/images/default_book_cover.webp";
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
        src={getValidThumbnailUrl(comic.thumbnail)} 
        alt={comic.title || "Comic"} 
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
