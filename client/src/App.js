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
import { onAuthStateChanged } from "firebase/auth";
import { actionTypes } from "./components/ContextApi/reducer";

const App = () => {
  const [{ user }, dispatch] = useStateValue();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef(null);

  // Listen for authentication state changes
  useEffect(() => {
    let timeoutId;
    
    // Set a timeout to ensure loading doesn't stay forever (1.5 seconds)
    timeoutId = setTimeout(() => {
      setLoading(false);
    }, 1500);

    try {
      const unsubscribe = onAuthStateChanged(auth, (authUser) => {
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

      // Cleanup subscription on unmount
      return () => {
        clearTimeout(timeoutId);
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }
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
