import React from "react";
import "./Login.css";
import { Button } from "@mui/material";
import { auth, provider } from "../../firebase";
import { useStateValue } from "../ContextApi/StateProvider";
import { actionTypes } from "../ContextApi/reducer";
import { signInWithPopup } from "firebase/auth";

const Login = () => {
  // eslint-disable-next-line
  const [state, dispatch] = useStateValue();

  const signIn = () => {
    // Add Google Contacts scope
    provider.addScope("https://www.googleapis.com/auth/contacts.readonly");
    provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
    provider.addScope("https://www.googleapis.com/auth/userinfo.email");
    
    signInWithPopup(auth, provider)
      .then((result) => {
        // Get the OAuth access token from the credential
        // Firebase Auth stores it in _tokenResponse
        const credential = result._tokenResponse;
        const accessToken = credential?.oauthAccessToken || credential?.accessToken;
        
        // Store user with access token
        const userWithToken = {
          ...result.user,
          accessToken: accessToken || null,
        };
        
        // Log for debugging (remove in production)
        if (accessToken) {
          console.log("Access token obtained for Google Contacts API");
        } else {
          console.warn("No access token found. Google Contacts API may not work.");
        }
        
        dispatch({
          type: actionTypes.SET_USER,
          user: userWithToken,
        });
      })
      .catch((err) => {
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
