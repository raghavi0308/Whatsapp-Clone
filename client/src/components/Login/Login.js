import React from "react";
import "./Login.css";
import { Button } from "@mui/material";
import { auth, provider } from "../../firebase";
import { useStateValue } from "../ContextApi/StateProvider";
import { actionTypes } from "../ContextApi/reducer";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";

const Login = () => {
  // eslint-disable-next-line
  const [state, dispatch] = useStateValue();

  // Handle redirect result when user returns from Google
  React.useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // Get the OAuth access token from the credential
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
        }
      })
      .catch((err) => {
        console.error("Sign in error:", err);
        // Only show alert if it's not a cancelled redirect
        if (err.code !== "auth/cancelled-popup-request") {
          alert(err.message);
        }
      });
  }, [dispatch]);

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
