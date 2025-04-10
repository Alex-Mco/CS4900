import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Profile from "./pages/profile";
import Navbar from "./components/navbar";
import CollectionGallery from "./pages/collection_gallery";
import Explore from "./pages/explore";
import CollectionPage from "./pages/collection";

function ProtectedRoute({ element }) {
  const userSession = localStorage.getItem("userSession");
  return userSession ? element : <Login />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("redirect");

    fetch(`https://marvel-nexus-backend.click/auth/session`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.isAuthenticated) {
          localStorage.setItem("userSession", JSON.stringify(data.user));
          setIsAuthenticated(true);

          if (redirectPath) {
            window.history.replaceState({}, '', `/${redirectPath}`);
          }
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

  if (isAuthenticated === null) return <div>Loading...</div>; // optional loading spinner

  return (
    <Router>
      <div className="wrapper">
        <Navbar />
        <div className="content">
          <Routes>
            {/* Conditionally render profile or login directly */}
            <Route path="/" element={isAuthenticated ? <Profile /> : <Login />} />
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
