import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import Login from "./components/Login/Login";
import Chat from "./components/Chat/Chat";
import Sidebar from "./components/Sidebar/Sidebar";
import Status from "./components/Status/Status";
import Contacts from "./components/Contacts/Contacts";
import Pusher from "pusher-js";
import axios from "./axios";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useStateValue } from "./components/ContextApi/StateProvider";
import { auth } from "./firebase";
import { onAuthStateChanged, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { actionTypes } from "./components/ContextApi/reducer";

const App = () => {
  const [{ user }, dispatch] = useStateValue();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef(null);

  // Handle authentication - set up auth state listener immediately, then check redirect result
  useEffect(() => {
    let timeoutId;
    let unsubscribe;
    let userSet = false;
    
    // Set a timeout to ensure loading doesn't stay forever (3 seconds)
    timeoutId = setTimeout(() => {
      if (!userSet) {
        console.log("Auth check timeout");
        setLoading(false);
      }
    }, 3000);

    // Set up auth state listener immediately - this will fire right away if user is already authenticated
    console.log("Setting up auth state listener...");
    unsubscribe = onAuthStateChanged(auth, (authUser) => {
      clearTimeout(timeoutId);
      try {
        if (authUser) {
          console.log("Auth state changed - user signed in:", authUser.displayName);
          // User is signed in - preserve accessToken if it exists
          const userWithToken = {
            ...authUser,
            accessToken: accessTokenRef.current || null,
          };
          dispatch({
            type: actionTypes.SET_USER,
            user: userWithToken,
          });
          userSet = true;
        } else {
          console.log("Auth state changed - user signed out");
          // User is signed out
          accessTokenRef.current = null;
          dispatch({
            type: actionTypes.SET_USER,
            user: null,
          });
        }
      } catch (dispatchError) {
        console.error("Error dispatching user state:", dispatchError);
      } finally {
        setLoading(false);
      }
    });

    // Also check for redirect result to get access token
    console.log("Checking for redirect result...");
    getRedirectResult(auth)
      .then((result) => {
        console.log("Redirect result:", result ? "User authenticated" : "No redirect result");
        if (result) {
          // Try to get OAuth access token from credential
          const credential = GoogleAuthProvider.credentialFromResult(result);
          let accessToken = null;
          
          // Try multiple ways to get the access token
          if (result._tokenResponse) {
            accessToken = result._tokenResponse.oauthAccessToken || result._tokenResponse.accessToken;
          }
          
          // Store access token in ref for later use
          if (accessToken) {
            accessTokenRef.current = accessToken;
            console.log("Access token obtained for Google Contacts API");
            
            // The auth state listener will have already set the user, so we just need to update with access token
            // We'll update the user state with the access token
            const currentUser = auth.currentUser;
            if (currentUser) {
              const userWithToken = {
                ...currentUser,
                accessToken: accessToken,
              };
              dispatch({
                type: actionTypes.SET_USER,
                user: userWithToken,
              });
            }
          } else {
            console.warn("No access token found. Google Contacts API will not work. This is normal with redirect flow.");
          }
        }
      })
      .catch((err) => {
        // Ignore errors - auth state listener already handled authentication
        if (err.code !== "auth/cancelled-popup-request") {
          console.error("Redirect result error:", err);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update accessToken ref when user changes
  useEffect(() => {
    if (user?.accessToken) {
      accessTokenRef.current = user.accessToken;
    }
  }, [user?.accessToken]);

  // useEffect(() => {
  //   axios
  //     .get("/messages/sync")
  //     .then((response) => {
  //       setMessages(response.data);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // }, []);

  // useEffect(() => {
  //   const pusher = new Pusher("6fbb654a0e0b670de165", {
  //     cluster: "ap2",
  //   });

  //   const channel = pusher.subscribe("messages");
  //   channel.bind("inserted", function (newMessage) {
  //     // alert(JSON.stringify(newMessage));
  //     setMessages([...messages, newMessage]);
  //   });

  //   return () => {
  //     channel.unbind_all();
  //     channel.unsubscribe();
  //   };
  // }, [messages]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="app" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        width: '100vw',
        backgroundColor: '#dadbd3',
        color: '#000'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Initializing PingIt...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        {!user ? (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <div className="app__body">
            <Sidebar />
            <Routes>
              <Route path="/chat/:contactId" element={<Chat />} />
              <Route path="/rooms/:roomId" element={<Chat />} />
              <Route path="/status" element={<Status />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/" element={<Chat />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
