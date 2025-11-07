import React from "react";
import "./Login.css";
import { Button } from "@mui/material";
import { auth, provider } from "../../firebase";
import { useStateValue } from "../ContextApi/StateProvider";
import { actionTypes } from "../ContextApi/reducer";
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";

const Login = () => {
  // eslint-disable-next-line
  const [state, dispatch] = useStateValue();

  // Handle redirect result when user returns from Google
  React.useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // Try to get OAuth access token from credential
          const credential = GoogleAuthProvider.credentialFromResult(result);
          let accessToken = null;
          
          // Try multiple ways to get the access token
          if (result._tokenResponse) {
            accessToken = result._tokenResponse.oauthAccessToken || result._tokenResponse.accessToken;
          }
          
          // If still no token, try to get it from the credential
          if (!accessToken && credential) {
            // For redirect flow, we might need to extract from ID token or make separate request
            // For now, we'll proceed without it - Contacts API will show a message
            console.warn("OAuth access token not available in redirect flow. Google Contacts API may not work.");
          }
          
          // Store user with access token
          const userWithToken = {
            ...result.user,
            accessToken: accessToken || null,
          };
          
          // Log for debugging
          if (accessToken) {
            console.log("Access token obtained for Google Contacts API");
          } else {
            console.warn("No access token found. Google Contacts API will not work. This is normal with redirect flow.");
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
