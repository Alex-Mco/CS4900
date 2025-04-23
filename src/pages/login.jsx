import React from "react";
import "./css/login.css";

function Login() {
  // Redirect to the Google OAuth route
  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="googleLogIn">
      <h1>Login</h1>
      <p className="login-p">Please log in using your Google account:</p>
      <div>
        <button onClick={login} className="login-button">
          Log in with Google
        </button>
      </div>
    </div>
  );
}

export default Login;