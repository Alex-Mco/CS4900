import React from "react";
import "./login.css";

function Login() {
  // Redirect to the Google OAuth route
  const login = () => {
    window.location.href = `https://marvel-nexus-env.eba-teusv34s.us-west-2.elasticbeanstalk.com/auth/google`; // have to update the once AWS is up
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
