import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    //custom styles for login page, can be changed for furure design. 
    const styles = {
        container: {
            maxWidth: "400px",
            margin: "60px auto",
            padding: "20px",
            textAlign: "center",
            border: "1px solid #ddd",
            borderRadius: "8px",
        },
        form: {
            display: "flex",
            flexDirection: "column",
            gap: "10px",
        },
        input: {
            padding: "8px",
            fontSize: "16px",
        },
        button: {
            padding: "10px",
            fontSize: "16px",
            cursor: "pointer",
        },
        };
    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const handleSubmit = (e) => {
        e.preventDefault();

    console.log("Email submitted:", email);
    navigate("/student-dashboard");
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Email</label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your school email"
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button}>
          Continue
        </button>
      </form>
    </div>
  );
}

export default LoginPage;