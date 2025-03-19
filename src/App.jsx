import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import Profile from "./pages/profile";
import Navbar from "./components/navbar";
import CollectionGallery from "./pages/collection_gallery";
import Explore from "./pages/explore";
import CollectionPage from "./pages/collection";

function ProtectedRoute({ element }) {
  const userSession = localStorage.getItem("userSession");
  return userSession ? element : <Navigate to="/" />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch("process.env.REACT_APP_API_URL/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.isAuthenticated) {
          localStorage.setItem("userSession", JSON.stringify(data.user));
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("userSession");
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        localStorage.removeItem("userSession");
        setIsAuthenticated(false);
      });
  }, []);

  return (
    <Router>
      <div className="wrapper">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/profile" /> : <Login />} />
            <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
            <Route path="/collections" element={<ProtectedRoute element={<CollectionGallery />} />} />
            <Route path="/explore" element={<ProtectedRoute element={<Explore />} />} />
            <Route path="/collection/:id" element={<ProtectedRoute element={<CollectionPage />} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;