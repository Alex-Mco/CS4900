import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './profile.css'

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [previewPic, setPreviewPic] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('process.env.REACT_APP_API_URL/profile', { withCredentials: true })
      .then(response => {
        setUser(response.data);
        setName(response.data.name);
        setUsername(response.data.username);
        setProfilePic(response.data.profilePic);
      })
      .catch(error => {
        if(error.response && error.response.status === 401){
          navigate('/')
        }else{
          console.error('Error fetching user data:', error);
        }
      });
  }, [navigate]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveChanges = () => {
    if (user) {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('username', username);
      if(profilePic && profilePic instanceof File){
        formData.append('profilePic', profilePic)
      }
  
      axios.put(`process.env.REACT_APP_API_URL/profile-update`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      })
        .then(response => {
          setUser(response.data);
          setProfilePic(response.data.profilePic)
          setIsEditing(false);
        })
        .catch(error => {
          console.error('Error saving changes:', error);
        });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewPic(reader.result);
        setProfilePic(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div classNmae="profile-container">
      <div className="profile-page">
        <h1>Profile</h1>
        {user ? (
          <div className="profile-container">
            <p>{isEditing ? (
                <div className="profile-picture-container">
                <label htmlFor="profilePic" className="hidden-label">Profile Picture</label>
                  <img
                      src={previewPic || user.profilePic}
                      alt="Profile"
                      className="profile-picture"
                  />
                  <label htmlFor="profilePic" className="edit-overlay">Edit</label>
                  <input
                      id="profilePic"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                  />
                  </div>
                ) : (
                  <img src={user.profilePic} alt="Profile" className="profile-picture" />
                )}</p>
            <p className="profile-info">Name: <span>{isEditing ? (
              <input
                type="text"
                className="profile-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : user.name}</span></p>

            <p className="profile-info">Username: <span>{isEditing ? (
              <input
                type="text"
                className="profile-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            ) : user.username}</span></p>

            {!isEditing && (
              <p className="profile-info">Email: <span>{user.email}</span></p>
            )}
            <div className="button-group">
              {isEditing ? (
                <button className="edit-profile-btn" onClick={handleSaveChanges}>
                  Save Changes
                </button>
              ) : (
                <button className="edit-profile-btn" onClick={handleEditClick}>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className='loading'>Loading...</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
