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
    axios.get('http://localhost:5000/profile', { withCredentials: true })
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
      if (profilePic) {
        formData.append('profilePic', profilePic); 
      }
  
      axios.put(`http://localhost:5000/update-profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      })
        .then(response => {
          setUser(response.data);
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
    <div className="profile-page">
      <h1>Profile</h1>
      {user ? (
        <div className="profile-container">
           <p>{isEditing ? (
              <>
              <label htmlFor="profilePic">Profile Picture</label>
                <input
                id="profilePic"
                  type="file"
                  accept="image/*"
                  className="profile-input"
                  onChange={handleFileChange}
                />
                {previewPic && <img src={previewPic} alt="Preview" className="profile-picture" />}
                </>
              ) : (
                <img src={user.profilePic} alt="Profile" className="profile-picture" />
              )}</p>
          <p>Name: {isEditing ? (
            <input
              type="text"
              className="profile-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : (
            user.name
          )}</p>
          <p>Username: {isEditing ? (
            <input
              type="text"
              className="profile-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          ) : (
            user.username
          )}</p>
          {!isEditing && <p>Email: {user.email}</p>}
          <div>
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
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Profile;
