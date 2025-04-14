import React from 'react';
import { Link } from 'react-router-dom';
import './css/CollectionCard.css'; 

function CollectionCard({ id, name, comicCount, onDelete }) {
    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(id);
    };
    return (
        <div className="collection-card">
            <Link to={`/collection/${id}`} className="card-content">
                <h3>{name}</h3>
                <p>{comicCount} comic{comicCount !== 1 ? 's' : ''}</p>
            </Link>
            <button className="delete-btn" onClick={handleDeleteClick}>
                Delete Collection
            </button>
        </div>
    );
}

export default CollectionCard;
