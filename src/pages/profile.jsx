//Profile page component for the website. Includes a basic profile layout. 

import React from "react";
import './profile.css';

export const Profile = () => {
  // filler user data 
  const user = {
    username: "John Doe",
    email: "john.doe@example.com",
  };

  const editProfile = () => {
    /*logic to edit the profile (same page but it changes options to editable*/
  };

  return (
    <div className ="container">
      <h1>Profile</h1>
      <img className= "profilePicture"
        alt={`${user.username}'s profile`}
      />
      <div className = "usernameContainer"> 
        <h3>Username:</h3>
        <h2 className = "username">{user.username}</h2>
      </div>
      <div className = "emailContainer">
        <h3>Email:</h3>
        <p className = "email">{user.email}</p>
      </div>
      <button className = "editProfileBtn" onClick={editProfile}>
        Edit Profile
      </button>
    </div>
  );
};


export default Profile;