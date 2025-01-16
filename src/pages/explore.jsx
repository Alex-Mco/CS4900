import React from "react";
import "./explore.css";

function ExplorePage() {
  return (
    <div className="explore-page">
      <h1>Explore</h1>
      <div className="search-bar">
        <input type="text" placeholder="Search for comics or characters..." />
        <button type="button">Search</button>
      </div>
      <div className="results">
        <h2>Search Results</h2>
        <div className="result-item">
          <img
            src="https://via.placeholder.com/80"
            alt="Item Thumbnail"
            className="thumbnail"
          />
          <div>
            <h3>Item Title</h3>
            <p>Short description of the item goes here.</p>
          </div>
        </div>
        <div className="result-item">
          <img
            src="https://via.placeholder.com/80"
            alt="Item Thumbnail"
            className="thumbnail"
          />
          <div>
            <h3>Item Title</h3>
            <p>Short description of the item goes here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExplorePage;
