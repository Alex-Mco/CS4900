import React from "react";
import "./ComicCard.css";

const ComicCard = ({ comic, onSelect }) => {
  return (
    <div className="comic-cards" onClick={() => onSelect(comic)}> 
      <img
        src={`${comic.thumbnail.path}.${comic.thumbnail.extension}`}
        alt={comic.title}
        className="comic-thumbnail"
      />
      <h3 className="comic-title">{comic.title}</h3>
    </div>
  );
};

export default ComicCard;
