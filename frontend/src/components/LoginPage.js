import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL } from "../API";
import { setAuthTokens } from "../auth/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
  

    try {
      //attempt to send the google id to the back end
      const response = await fetch(`${API_URL}/api/auth/google/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        //the body request contains the id token from google
        body: JSON.stringify({
          id_token: credentialResponse.credential
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Google login failed");
      }

      setAuthTokens({ access: data.access, refresh: data.refresh }, data.user);

      // Redirect to the leaderboard after successful login
      navigate("/leaderboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was unsuccessful");
  };


  //the actual login page the user interacts with
  return (
    <div className="login-page">
      <div className="portal-surface">
      <p className="page-eyebrow">AOF Service</p>
      <h2 className="page-heading">Sign in</h2>
      <p className="page-description">Sign in with your school Google account.</p>

      <div className="mt-3">
        {/*The call to the google o Auth*/}
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          prompt="select_account"
        />
      </div>

      {loading && <p className="text-muted mt-3 mb-0">Signing you in...</p>}
      {error && <p className="text-danger small mt-3 mb-0">{error}</p>}
      </div>
    </div>
  );
}

export default LoginPage;
