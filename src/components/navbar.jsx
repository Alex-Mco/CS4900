import React, { useState } from "react";
import { Link } from "react-router-dom";
import './css/navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_API_URL}/logout`, {
      method: "GET",
      credentials: "include",
    }).then(() => {
      localStorage.removeItem("userSession");
      window.location.href = "/";
    });
  };

  return (
    <nav className="navbar">
      <div className="nav-main">
        <div className="title">Marvel Nexus</div>
        <ul className="nav-links desktop">
          <li><Link to="/explore">Explore</Link></li>
          <li><Link to="/collections">Collections</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><button className="logout-button" onClick={handleLogout}>Logout</button></li>
        </ul>

        <button className="hamburger" onClick={toggleMenu}>
          {isOpen ? "✖" : "☰"}
        </button>
      </div>

      {isOpen && (
        <ul className="nav-links mobile">
          <li><Link to="/explore" onClick={() => setIsOpen(false)}>Explore</Link></li>
          <li><Link to="/collections" onClick={() => setIsOpen(false)}>Collections</Link></li>
          <li><Link to="/profile" onClick={() => setIsOpen(false)}>Profile</Link></li>
          <li><button className="logout-button" onClick={handleLogout}>Logout</button></li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
