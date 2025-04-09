import React from "react";
import "./login.css";

function Login() {
  // Redirect to the Google OAuth route
  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div>
      <h1>Login</h1>
      <p>Please log in using your Google account:</p>
      <div className="googleLogIn">
        <button onClick={login} className="login-button">
          Log in with Google
        </button>
      </div>
    </div>
  );
}

export default Login;