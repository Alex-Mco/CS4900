import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import Profile from "./pages/profile";
import Navbar from "./components/navbar";
import CollectionGallery from "./pages/collection_gallery";
import Explore from "./pages/explore";
import CollectionPage from "./pages/collection";

function App() {
  return (
      <Router>
        <div className="wrapper">
          <Navbar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/collections" element={<CollectionGallery />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/collection/:id" element={<CollectionPage />} />
            </Routes>
          </div>
        </div>
      </Router>
  );
}

export default App;
