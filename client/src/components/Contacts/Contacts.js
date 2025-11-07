import React, { useState, useEffect } from "react";
import "./Contacts.css";
import { Avatar, IconButton } from "@mui/material";
import { SearchOutlined, MoreVert } from "@mui/icons-material";
import { useStateValue } from "../ContextApi/StateProvider";
import axios from "../../axios";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { fetchGoogleContacts } from "../../services/googleContacts";

const Contacts = () => {
  const [{ user }] = useStateValue();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setLoading(false);
        setContacts([]);
        return;
      }

      try {
        // First, try to fetch Google Contacts (user's actual contacts)
        const accessToken = user.accessToken;
        if (accessToken) {
          const googleContacts = await fetchGoogleContacts(accessToken);
          if (googleContacts && googleContacts.length > 0) {
            setContacts(googleContacts);
            setLoading(false);
            return;
          }
        }

        // Fallback: If Google Contacts not available, show chat rooms as contacts
        // Also include deleted chats from localStorage
        const response = await axios.get(`/all/rooms`);
        const rooms = response.data || [];
        
        // Get all contacts from rooms
        const contactsFromRooms = rooms.map((room) => ({
          id: room._id,
          name: room.name,
          email: room.email || null,
          photo: room.photo || null,
        }));
        
        // Get deleted chat contacts from localStorage
        const deletedChatContacts = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('chat_prefs_')) {
            const roomId = key.replace('chat_prefs_', '');
            const prefs = JSON.parse(localStorage.getItem(key) || "{}");
            // Check if this is a deleted/hidden chat
            if (prefs.hidden || prefs.deleted) {
              // Try to get contact info from other localStorage keys
              const contactName = prefs.contactName || `Contact ${roomId.slice(0, 8)}`;
              deletedChatContacts.push({
                id: roomId,
                name: contactName,
                email: prefs.email || null,
                photo: prefs.photo || null,
              });
            }
          }
        }
        
        // Combine active and deleted contacts
        const allContacts = [...contactsFromRooms, ...deletedChatContacts];
        
        if (allContacts.length > 0) {
          setContacts(allContacts);
        } else {
          setContacts([]);
          if (!accessToken) {
            setError("Google Contacts API requires access token. Please sign in again.");
          }
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError(err.message || "Failed to load contacts");
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [user]);

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="contacts">
      <div className="contacts__header">
        <h2>Contacts</h2>
        <div className="contacts__headerRight">
          <IconButton>
            <MoreVert />
          </IconButton>
        </div>
      </div>
      <div className="contacts__search">
        <SearchOutlined />
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="contacts__list">
        {loading ? (
          <div className="contacts__empty">
            <p>Loading contacts...</p>
          </div>
        ) : error ? (
          <div className="contacts__empty">
            <p style={{ color: "#d32f2f" }}>Error: {error}</p>
            <p style={{ fontSize: "12px", color: "gray", marginTop: "10px" }}>
              Make sure the server is running on port 5000
            </p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="contacts__empty">
            <p>No contacts found</p>
            <p style={{ fontSize: "12px", color: "gray" }}>
              {searchQuery 
                ? "Try a different search term" 
                : contacts.length === 0
                  ? "Create a new chat from the sidebar to start messaging. Your chats will appear here as contacts."
                  : "No contacts match your search"}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div 
              key={contact.id} 
              className="contacts__item"
              onClick={() => navigate(`/chat/${contact.id}`)}
            >
              <Avatar src={contact.photo || `https://api.dicebear.com/6.x/adventurer/svg?seed=${contact.id}`} />
              <div className="contacts__info">
                <h3>{contact.name}</h3>
                <p>{contact.email || "Contact"}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Contacts;

