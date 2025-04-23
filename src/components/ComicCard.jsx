import React from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import "./css/ComicCard.css";

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
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/images/default_book_cover.webp";
        }}
        alt={comic.title}
        className="comic-thumbnail"
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
