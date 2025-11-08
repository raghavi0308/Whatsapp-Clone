import React, { useState, useEffect, useRef } from "react";
import "./SidebarChat.css";
import { Avatar, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  PushPin,
  Star,
  NotificationsOff,
  DeleteSweep,
  Delete,
  OpenInNew,
  Close,
} from "@mui/icons-material";
import axios from "../../axios";

const SidebarChat = ({ addNewChat, id, name, photo, email, onChatUpdate }) => {
  const [seed, setSeed] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const chatRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 5000));
  }, []);

  // Load chat preferences from localStorage
  const getChatPreferences = () => {
    if (!id) return { pinned: false, favorite: false, muted: false };
    const prefs = localStorage.getItem(`chat_prefs_${id}`);
    return prefs ? JSON.parse(prefs) : { pinned: false, favorite: false, muted: false };
  };

  const [preferences, setPreferences] = useState(getChatPreferences());

  // Reload preferences when id changes
  useEffect(() => {
    if (id) {
      const prefs = localStorage.getItem(`chat_prefs_${id}`);
      const parsedPrefs = prefs ? JSON.parse(prefs) : { pinned: false, favorite: false, muted: false };
      setPreferences(parsedPrefs);
    }
  }, [id]);

  const createChat = async () => {
    const contactName = prompt("Please enter contact name");
    if (contactName) {
      try {
        await axios.post("/group/create", {
          groupName: contactName,
        });
        // The chat will appear automatically via Pusher real-time update
      } catch (err) {
        console.error("Error creating chat:", err);
        alert("Failed to create chat. Make sure the server is running on port 5000.");
      }
    }
  };

  const handleContextMenu = (e) => {
    if (addNewChat) return;
    e.preventDefault();
    e.stopPropagation();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    setContextMenu({
      mouseX: mouseX,
      mouseY: mouseY,
    });
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const updatePreferences = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem(`chat_prefs_${id}`, JSON.stringify(newPrefs));
    if (onChatUpdate) {
      onChatUpdate();
    }
    handleClose();
  };

  const handlePinToTop = () => {
    updatePreferences("pinned", !preferences.pinned);
  };

  const handleFavorite = () => {
    updatePreferences("favorite", !preferences.favorite);
  };

  const handleMute = () => {
    const newMutedState = !preferences.muted;
    updatePreferences("muted", newMutedState);
    if (newMutedState) {
      alert(`${name} has been muted. You won't receive notifications.`);
    } else {
      alert(`${name} has been unmuted.`);
    }
  };

  const handleClearMessages = async () => {
    if (window.confirm(`Are you sure you want to clear all messages with ${name}?`)) {
      try {
        await axios.delete(`/messages/${id}`);
        alert("Messages cleared successfully!");
        handleClose();
      } catch (err) {
        console.error("Error clearing messages:", err);
        alert("Failed to clear messages. Make sure the server is running.");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the chat with ${name}? This action cannot be undone.`)) {
      try {
        // Delete room from backend
        await axios.delete(`/room/${id}`);
        // Clear local preferences
        localStorage.removeItem(`chat_prefs_${id}`);
        alert("Chat deleted successfully!");
        handleClose();
        // Navigate away if currently viewing this chat
        if (window.location.pathname.includes(`/chat/${id}`)) {
          navigate("/");
        }
        if (onChatUpdate) {
          onChatUpdate();
        }
      } catch (err) {
        console.error("Error deleting chat:", err);
        if (err.response) {
          // Server responded with error status
          if (err.response.status === 404) {
            alert(`Chat not found. It may have already been deleted. The chat will be removed from your list.`);
            // Still remove from local storage and refresh
            localStorage.removeItem(`chat_prefs_${id}`);
            if (onChatUpdate) {
              onChatUpdate();
            }
          } else {
            alert(`Failed to delete chat: ${err.response.data?.error || err.message}`);
          }
        } else if (err.request) {
          // Request was made but no response received
          alert("Failed to delete chat. Make sure the server is running on port 5000.");
        } else {
          alert(`Failed to delete chat: ${err.message}`);
        }
      }
    }
  };

  const handlePopUpChat = () => {
    const popup = window.open(
      `/chat/${id}`,
      `chat_${id}`,
      "width=400,height=600,resizable=yes,scrollbars=yes"
    );
    if (popup) {
      alert("Chat opened in a new window!");
    } else {
      alert("Please allow pop-ups for this site to use this feature.");
    }
    handleClose();
  };

  const handleCloseChat = () => {
    // Store contact info before hiding
    const prefs = JSON.parse(localStorage.getItem(`chat_prefs_${id}`) || "{}");
    prefs.contactName = name;
    prefs.email = email;
    prefs.photo = photo;
    prefs.hidden = true;
    localStorage.setItem(`chat_prefs_${id}`, JSON.stringify(prefs));
    
    // Remove from sidebar (hide chat)
    updatePreferences("hidden", true);
    // Navigate away if currently viewing this chat
    if (window.location.pathname.includes(`/chat/${id}`)) {
      navigate("/");
    }
  };

  // Use provided photo or generate consistent avatar
  const avatarSrc = photo || `https://api.dicebear.com/6.x/adventurer/svg?seed=${id || seed}`;

  // Always show chats unless actually deleted; ignore hidden flag

  return !addNewChat ? (
    <>
      <div
        ref={chatRef}
        className={`sidebarChat ${preferences.pinned ? "sidebarChat--pinned" : ""} ${preferences.muted ? "sidebarChat--muted" : ""}`}
        onContextMenu={handleContextMenu}
        onClick={() => navigate(`/chat/${id}`)}
      >
        <Avatar src={avatarSrc} />
        <div className="sidebarChat__info">
          <h2>
            {preferences.pinned && <PushPin className="sidebarChat__pinIcon" />}
            {preferences.favorite && <Star className="sidebarChat__starIcon" />}
            {name}
          </h2>
          {email && <p>{email}</p>}
        </div>
      </div>
      {contextMenu && (
        <Menu
          open={true}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={{
            top: contextMenu.mouseY,
            left: contextMenu.mouseX,
          }}
          MenuListProps={{
            "aria-labelledby": "context-menu",
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          PaperProps={{
            style: {
              maxHeight: 48 * 7,
              width: '20ch',
            },
          }}
        >
        <MenuItem onClick={handlePinToTop}>
          <PushPin style={{ marginRight: 8, transform: preferences.pinned ? "rotate(45deg)" : "none" }} />
          {preferences.pinned ? "Unpin" : "Pin to top"}
        </MenuItem>
        <MenuItem onClick={handleFavorite}>
          <Star style={{ marginRight: 8, color: preferences.favorite ? "#ffc107" : "inherit" }} />
          {preferences.favorite ? "Remove from Favourites" : "Add to Favourites"}
        </MenuItem>
        <MenuItem onClick={handleMute}>
          <NotificationsOff style={{ marginRight: 8 }} />
          {preferences.muted ? "Unmute" : "Mute"}
        </MenuItem>
        <MenuItem onClick={handleClearMessages}>
          <DeleteSweep style={{ marginRight: 8 }} />
          Clear messages
        </MenuItem>
        <MenuItem onClick={handleDelete} style={{ color: "#d32f2f" }}>
          <Delete style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
        <MenuItem onClick={handlePopUpChat}>
          <OpenInNew style={{ marginRight: 8 }} />
          Pop-up chat
        </MenuItem>
        <MenuItem onClick={handleCloseChat}>
          <Close style={{ marginRight: 8 }} />
          Close chat
        </MenuItem>
        </Menu>
      )}
    </>
  ) : (
    <div onClick={createChat} className="sidebarChat">
      <h2>Add new Chat</h2>
    </div>
  );
};

export default SidebarChat;
