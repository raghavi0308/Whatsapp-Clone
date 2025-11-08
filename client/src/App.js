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

  // Handle authentication - check redirect result first, then set up auth state listener
  useEffect(() => {
    let timeoutId;
    let unsubscribe;
    let isInitialized = false;
    
    // Set up auth state listener function (defined first so it can be called)
    const setupAuthListener = () => {
      if (isInitialized) return;
      isInitialized = true;
      clearTimeout(timeoutId);
      
      console.log("Setting up auth state listener...");
      unsubscribe = onAuthStateChanged(auth, (authUser) => {
        clearTimeout(timeoutId);
        try {
          if (authUser) {
            console.log("Auth state changed - user signed in:", authUser.displayName || authUser.email);
            const userWithToken = {
              ...authUser,
              accessToken: accessTokenRef.current || null,
            };
            dispatch({
              type: actionTypes.SET_USER,
              user: userWithToken,
            });
          } else {
            console.log("Auth state changed - user signed out");
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
    };

    // Set a timeout to ensure loading doesn't stay forever (5 seconds)
    timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.log("Auth check timeout - initializing auth state listener");
        setupAuthListener();
      }
    }, 5000);

    // First, check for redirect result (this is critical for redirect flow)
    console.log("Checking for redirect result...");
    getRedirectResult(auth)
      .then((result) => {
        console.log("Redirect result:", result ? "User authenticated" : "No redirect result");
        
        if (result) {
          isInitialized = true;
          clearTimeout(timeoutId);
          
          // Try to get OAuth access token from credential
          let accessToken = null;
          if (result._tokenResponse) {
            accessToken = result._tokenResponse.oauthAccessToken || result._tokenResponse.accessToken;
          }
          
          // Store access token in ref
          if (accessToken) {
            accessTokenRef.current = accessToken;
            console.log("Access token obtained for Google Contacts API");
          }
          
          // User is authenticated from redirect - set user state immediately
          const userWithToken = {
            ...result.user,
            accessToken: accessTokenRef.current || null,
          };
          console.log("Dispatching user from redirect result:", userWithToken.displayName || userWithToken.email);
          dispatch({
            type: actionTypes.SET_USER,
            user: userWithToken,
          });
          setLoading(false);
        } else {
          // No redirect result - set up auth state listener to check current auth state
          console.log("No redirect result - checking current auth state");
          if (!isInitialized) {
            setupAuthListener();
          }
        }
      })
      .catch((err) => {
        console.error("Redirect result error:", err);
        // Set up auth state listener even if redirect check fails
        if (!isInitialized) {
          setupAuthListener();
        }
      });

    // Also set up auth listener as fallback (in case redirect result takes time)
    // But delay it slightly to give redirect result priority
    const fallbackTimeout = setTimeout(() => {
      if (!isInitialized) {
        setupAuthListener();
      }
    }, 1000);

    // Cleanup subscription on unmount
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(fallbackTimeout);
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
