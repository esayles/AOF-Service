import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL } from "../API";

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const styles = {
    container: {
      maxWidth: "400px",
      margin: "60px auto",
      padding: "20px",
      textAlign: "center",
      border: "1px solid #ddd",
      borderRadius: "8px",
    },
    message: {
      marginTop: "12px",
      color: "red",
      fontSize: "14px",
    },
  };

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

      // Adjust these keys if your backend uses different names
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

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
    <div style={styles.container}>
      <h2>Login</h2>
      <p>Sign in with your school Google account</p>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        {/*The call to the google o Auth*/}
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          prompt="select_account"
        />
      </div>

      {loading && <p style={{ marginTop: "12px" }}>Signing you in...</p>}
      {error && <p style={styles.message}>{error}</p>}
    </div>
  );
}

export default LoginPage;