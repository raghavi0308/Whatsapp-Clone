import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import Login from "./components/Login/Login";
import Chat from "./components/Chat/Chat";
import Sidebar from "./components/Sidebar/Sidebar";
import Status from "./components/Status/Status";
import Contacts from "./components/Contacts/Contacts";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useStateValue } from "./components/ContextApi/StateProvider";
import { auth } from "./firebase";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { actionTypes } from "./components/ContextApi/reducer";

const App = () => {
  const [{ user }, dispatch] = useStateValue();
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef(null);

  // Handle authentication - check current user first, then set up listeners
  useEffect(() => {
    let timeoutId;
    let unsubscribe;
    let isInitialized = false;
    
    // Set a timeout to ensure loading doesn't stay forever (5 seconds)
    timeoutId = setTimeout(() => {
      if (!isInitialized) {
        setLoading(false);
      }
    }, 5000);

    // Check if user is already authenticated (immediate check)
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("User already authenticated:", currentUser.email);
      const userWithToken = {
        ...currentUser,
        accessToken: accessTokenRef.current || null,
      };
      dispatch({
        type: actionTypes.SET_USER,
        user: userWithToken,
      });
      isInitialized = true;
      setLoading(false);
      clearTimeout(timeoutId);
    }

    // Set up auth state listener - fires immediately and on changes
    unsubscribe = onAuthStateChanged(auth, (authUser) => {
      clearTimeout(timeoutId);
      isInitialized = true;
      try {
        if (authUser) {
          const userWithToken = {
            ...authUser,
            accessToken: accessTokenRef.current || null,
          };
          dispatch({
            type: actionTypes.SET_USER,
            user: userWithToken,
          });
        } else {
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

    // Check for redirect result to get access token
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // Try to get OAuth access token
          let accessToken = null;
          if (result._tokenResponse) {
            accessToken = result._tokenResponse.oauthAccessToken || result._tokenResponse.accessToken;
          }
          
          if (accessToken) {
            accessTokenRef.current = accessToken;
            
            // Update user with access token
            if (auth.currentUser) {
              const userWithToken = {
                ...auth.currentUser,
                accessToken: accessToken,
              };
              dispatch({
                type: actionTypes.SET_USER,
                user: userWithToken,
              });
            }
          }
        }
      })
      .catch((err) => {
        // Silently ignore redirect errors
        if (err.code && !err.code.includes("cancelled")) {
          console.error("Auth redirect error:", err.message);
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
