import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Profile from './pages/profile';
import Navbar from './components/navbar';
import Login from './pages/login';
import CollectionGallery from './pages/collection_gallery';
import Explore from './pages/explore';
import CollectionPage from './pages/collection';  // Import the CollectionPage component

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <Router>
      <div className="wrapper">
        {isLoggedIn && <Navbar />}
        <div className="content">
          <Routes>
            <Route path="/" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/collections" element={<CollectionGallery />} />
            <Route path="/explore" element={<Explore />} />
            {/* Add the dynamic route for collection pages */}
            <Route path="/collection/:id" element={<CollectionPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
