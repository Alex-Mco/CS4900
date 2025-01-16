import React from "react";
import { Link } from "react-router-dom";  // Import Link from react-router-dom
import './navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="title">Marvel Nexus</div>
      <ul className="nav-links">
        {/* Use Link for navigation */}
        <li>
          <Link to="/profile" className="nav-link">Profile</Link>
        </li>
        <li>
          <Link to="/collections" className="nav-link">Collections</Link>
        </li>
        <li>
          <Link to="/explore" className="nav-link">Explore</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
