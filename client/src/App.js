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

  // Handle authentication - check redirect result first, then listen for auth changes
  useEffect(() => {
    let timeoutId;
    let unsubscribe;
    
    // Set a timeout to ensure loading doesn't stay forever (2 seconds)
    timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // First, check for redirect result
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
          
          // Store access token in ref for later use
          if (accessToken) {
            accessTokenRef.current = accessToken;
            console.log("Access token obtained for Google Contacts API");
          } else {
            console.warn("No access token found. Google Contacts API will not work. This is normal with redirect flow.");
          }
          
          // User is authenticated from redirect - set user state immediately
          const userWithToken = {
            ...result.user,
            accessToken: accessTokenRef.current || null,
          };
          dispatch({
            type: actionTypes.SET_USER,
            user: userWithToken,
          });
          setLoading(false);
          clearTimeout(timeoutId);
        }
      })
      .catch((err) => {
        // Ignore errors - auth state listener will handle authentication
        if (err.code !== "auth/cancelled-popup-request") {
          console.error("Redirect result error:", err);
        }
      })
      .finally(() => {
        // Set up auth state listener after checking redirect result
        try {
          unsubscribe = onAuthStateChanged(auth, (authUser) => {
            clearTimeout(timeoutId);
            try {
              if (authUser) {
                // User is signed in - preserve accessToken if it exists
                const userWithToken = {
                  ...authUser,
                  accessToken: accessTokenRef.current || null,
                };
                dispatch({
                  type: actionTypes.SET_USER,
                  user: userWithToken,
                });
              } else {
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
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("Error setting up auth listener:", error);
          setLoading(false);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dispatch]);

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
