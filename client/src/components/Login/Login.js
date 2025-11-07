import React from "react";
import "./Login.css";
import { Button } from "@mui/material";
import { auth, provider } from "../../firebase";
import { useStateValue } from "../ContextApi/StateProvider";
import { actionTypes } from "../ContextApi/reducer";
import { signInWithRedirect } from "firebase/auth";

const Login = () => {
  // eslint-disable-next-line
  const [state, dispatch] = useStateValue();

  // Redirect result is now handled in App.js

  const signIn = () => {
    // Add Google Contacts scope
    provider.addScope("https://www.googleapis.com/auth/contacts.readonly");
    provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
    provider.addScope("https://www.googleapis.com/auth/userinfo.email");
    
    // Use redirect instead of popup to avoid COOP issues
    signInWithRedirect(auth, provider).catch((err) => {
      console.error("Sign in error:", err);
      alert(err.message);
    });
  };

  return (
    <div className="login">
      <div className="login__container">
        <img src="/icon.png" alt="PingIt Logo" />
        <h1>Sign in to PingIt</h1>
        <p>Connect with your friends and family</p>
        <Button type="submit" onClick={signIn}>
          Sign In With Google
        </Button>
      </div>
    </div>
  );
};

export default Login;
