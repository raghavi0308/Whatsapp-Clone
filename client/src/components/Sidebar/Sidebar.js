import React, { useEffect, useState, useRef } from "react";
import "./Sidebar.css";
import {
  DonutLarge,
  Chat,
  MoreVert,
  SearchOutlined,
  Group,
  Groups,
  Star,
  AccountBalanceWallet,
  Settings,
  Person,
  Language,
  Logout,
  Phone,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { IconButton, Avatar, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import SidebarChat from "../SidebarChat/SidebarChat";
import { useStateValue } from "../ContextApi/StateProvider";
import { actionTypes } from "../ContextApi/reducer";
import Pusher from "pusher-js";
import axios from "../../axios";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

const Sidebar = () => {
  const [rooms, setRooms] = useState([]);
  const [{ user }, dispatch] = useStateValue();
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [activeNav, setActiveNav] = useState("chats");
  const [refreshKey, setRefreshKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const profilePicRef = useRef(null);
  
  // Get language from localStorage or default to English
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem("app_language") || "English"
  );
  
  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "ru", name: "Русский" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "zh", name: "中文" },
    { code: "ar", name: "العربية" },
    { code: "hi", name: "हिन्दी" },
  ];

  const fetchRooms = () => {
    axios
      .get(`/all/rooms`)
      .then((response) => {
        // Sort rooms: pinned first, then favorites, then regular
        const sortedRooms = response.data.sort((a, b) => {
          const prefsA = JSON.parse(localStorage.getItem(`chat_prefs_${a._id}`) || "{}");
          const prefsB = JSON.parse(localStorage.getItem(`chat_prefs_${b._id}`) || "{}");
          
          // Pinned chats first
          if (prefsA.pinned && !prefsB.pinned) return -1;
          if (!prefsA.pinned && prefsB.pinned) return 1;
          
          // Then favorites
          if (prefsA.favorite && !prefsB.favorite) return -1;
          if (!prefsA.favorite && prefsB.favorite) return 1;
          
          // Then by timestamp (newest first)
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        });
        setRooms(sortedRooms);
        
        // Calculate unread count
        calculateUnreadCount(sortedRooms);
      })
      .catch((err) => {
        console.error("Error fetching rooms:", err);
        // If server is not running, show empty array
        setRooms([]);
        setUnreadCount(0);
      });
  };

  const calculateUnreadCount = async (roomsList) => {
    if (!user || !roomsList || roomsList.length === 0) {
      setUnreadCount(0);
      return;
    }

    let totalUnread = 0;
    
    for (const room of roomsList) {
      try {
        // Get last read timestamp for this room
        const lastRead = localStorage.getItem(`lastRead_${room._id}`);
        const prefs = JSON.parse(localStorage.getItem(`chat_prefs_${room._id}`) || "{}");
        
        // Skip muted chats
        if (prefs.muted) continue;
        
        // Fetch messages for this room
        const response = await axios.get(`/messages/${room._id}`);
        const messages = response.data || [];
        
        // Count unread messages (messages after last read that are not from current user)
        const unreadMessages = messages.filter(msg => {
          if (msg.uid === user.uid) return false; // Don't count own messages
          if (!lastRead) return true; // If never read, count all
          return new Date(msg.timestamp) > new Date(lastRead);
        });
        
        totalUnread += unreadMessages.length;
      } catch (err) {
        // Ignore errors for individual rooms
        console.error(`Error calculating unread for room ${room._id}:`, err);
      }
    }
    
    setUnreadCount(totalUnread);
  };

  useEffect(() => {
    fetchRooms();
  }, [refreshKey]);

  // Recalculate unread count when rooms change or messages update
  useEffect(() => {
    if (rooms.length > 0 && user) {
      calculateUnreadCount(rooms);
    }
  }, [rooms, user, refreshKey]);
  
  // Listen for new messages to update unread count in real-time
  useEffect(() => {
    if (!user) return;
    
    const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY || "6fbb654a0e0b670de165", {
      cluster: process.env.REACT_APP_PUSHER_CLUSTER || "ap2",
    });

    const channel = pusher.subscribe("messages");
    channel.bind("inserted", function (newMessage) {
      // Update unread count if message is not from current user
      if (newMessage.uid !== user.uid) {
        // Check if chat is currently open
        const currentPath = window.location.pathname;
        const isCurrentChat = currentPath.includes(`/chat/${newMessage.roomId}`);
        
        if (!isCurrentChat) {
          // Recalculate unread count
          fetchRooms();
        }
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [user]);

  // Load profile picture from localStorage on mount if user exists
  useEffect(() => {
    if (user) {
      const savedProfilePic = localStorage.getItem("user_profile_picture");
      if (savedProfilePic && savedProfilePic !== user.photoURL) {
        const updatedUser = {
          ...user,
          photoURL: savedProfilePic,
        };
        dispatch({
          type: actionTypes.SET_USER,
          user: updatedUser,
        });
      }
    }
  }, [user, dispatch]);

  const handleChatUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateChat = async (chatName) => {
    if (!chatName) return;
    try {
      await axios.post("/group/create", {
        groupName: chatName,
      });
      setSearchQuery("");
      // The chat will appear automatically via Pusher real-time update
    } catch (err) {
      console.error("Error creating chat:", err);
      alert("Failed to create chat. Make sure the server is running on port 5000.");
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file only.");
        e.target.value = "";
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB.");
        e.target.value = "";
        return;
      }
      
      // Read file and convert to base64 or create object URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result;
        
        // Update user profile picture in context
        const updatedUser = {
          ...user,
          photoURL: imageDataUrl,
        };
        
        dispatch({
          type: actionTypes.SET_USER,
          user: updatedUser,
        });
        
        // Store in localStorage for persistence
        localStorage.setItem("user_profile_picture", imageDataUrl);
        
        alert("Profile picture updated successfully!");
      };
      
      reader.onerror = () => {
        alert("Error reading the image file. Please try again.");
      };
      
      reader.readAsDataURL(file);
    }
    
    // Reset file input
    e.target.value = "";
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await signOut(auth);
        // Clear user from context
        dispatch({
          type: actionTypes.SET_USER,
          user: null,
        });
        // Clear localStorage
        localStorage.removeItem("user_profile_picture");
        // Navigate to login
        navigate("/login");
        setSettingsAnchorEl(null);
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Failed to logout. Please try again.");
      }
    }
  };

  useEffect(() => {
    const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY || "6fbb654a0e0b670de165", {
      cluster: process.env.REACT_APP_PUSHER_CLUSTER || "ap2",
    });

    const channel = pusher.subscribe("room");
    channel.bind("inserted", function (room) {
      setRefreshKey(prev => prev + 1);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  const closeAllMenus = () => {
    setAnchorEl(null);
    setSettingsAnchorEl(null);
    setLanguageAnchorEl(null);
  };

  const handleNavSelection = (nav) => {
    if (activeNav === nav) {
      setActiveNav("");
    } else {
      setActiveNav(nav);
    }
    closeAllMenus();
  };

  useEffect(() => {
    if (location.pathname.startsWith("/status")) {
      if (activeNav !== "status") {
        setActiveNav("status");
      }
    } else if (location.pathname.startsWith("/contacts")) {
      if (activeNav !== "contacts") {
        setActiveNav("contacts");
      }
    } else if (activeNav === "status" || activeNav === "contacts") {
      setActiveNav("chats");
    }
  }, [location.pathname, activeNav]);

  return (
    <div className="sidebar">
      {/* Navigation Sidebar */}
      <div className="sidebar__navigation">
        <div 
          className={`sidebar__navIcon ${activeNav === "chats" ? "sidebar__navIcon--active" : ""}`}
          onClick={() => handleNavSelection("chats")}
        >
          <Chat />
          {unreadCount > 0 && (
            <span className="sidebar__navBadge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </div>
        <div 
          className={`sidebar__navIcon ${activeNav === "calls" ? "sidebar__navIcon--active" : ""}`}
          onClick={() => {
            handleNavSelection("calls");
            if (window.confirm("Start a call?")) {
              alert("Call feature coming soon!");
            }
          }}
        >
          <Phone />
        </div>
        <div 
          className={`sidebar__navIcon ${activeNav === "status" ? "sidebar__navIcon--active" : ""}`}
          onClick={() => {
            closeAllMenus();
            if (location.pathname.startsWith("/status") || activeNav === "status") {
              setActiveNav("chats");
              navigate("/");
            } else {
              setActiveNav("status");
              navigate("/status");
            }
          }}
        >
          <DonutLarge />
        </div>
        <div 
          className={`sidebar__navIcon ${activeNav === "settings" ? "sidebar__navIcon--active" : ""}`}
          onClick={(e) => {
            const wasActive = activeNav === "settings";
            handleNavSelection("settings");
            if (!wasActive) {
              setSettingsAnchorEl(e.currentTarget);
            }
          }}
        >
          <Settings />
        </div>
        <div 
          className={`sidebar__navIcon ${activeNav === "profile" ? "sidebar__navIcon--active" : ""}`}
          onClick={() => {
            handleNavSelection("profile");
            profilePicRef.current?.click();
          }}
        >
          <Avatar src={localStorage.getItem("user_profile_picture") || user.photoURL} sx={{ width: 32, height: 32 }} />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="sidebar__content">
        <div className="sidebar__header">
          <div className="sidebar__headerLeft">
            <IconButton 
              onClick={() => {
                closeAllMenus();
                if (location.pathname.startsWith("/contacts") || activeNav === "contacts") {
                  setActiveNav("chats");
                  navigate("/");
                } else {
                  setActiveNav("contacts");
                  navigate("/contacts");
                }
              }} 
              sx={{ color: "#8696a0", padding: "8px" }}
            >
              <MenuIcon />
            </IconButton>
            <div className="sidebar__headerTitle">
              <h1>PingIt</h1>
              <h2>Chats</h2>
            </div>
          </div>
          <div className="sidebar__headerRight">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVert />
            </IconButton>
          </div>
        </div>
        
        {/* Menus - outside of header div */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => { alert("New group feature coming soon!"); setAnchorEl(null); }}>
            <Group style={{ marginRight: 8 }} /> New Group
          </MenuItem>
          <MenuItem onClick={() => { alert("New community feature coming soon!"); setAnchorEl(null); }}>
            <Groups style={{ marginRight: 8 }} /> New Community
          </MenuItem>
          <MenuItem onClick={() => { alert("Starred messages feature coming soon!"); setAnchorEl(null); }}>
            <Star style={{ marginRight: 8 }} /> Starred
          </MenuItem>
          <MenuItem onClick={() => { alert("Payments feature coming soon!"); setAnchorEl(null); }}>
            <AccountBalanceWallet style={{ marginRight: 8 }} /> Payments
          </MenuItem>
          <MenuItem 
            onClick={(e) => { 
              setAnchorEl(null);
              setSettingsAnchorEl(e.currentTarget);
            }}
          >
            <Settings style={{ marginRight: 8 }} /> Settings
          </MenuItem>
        </Menu>
        
        {/* Settings Submenu */}
        <Menu
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={() => setSettingsAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          container={() => document.querySelector('.sidebar')}
          style={{ zIndex: 1300 }}
          PaperProps={{
            style: {
              maxHeight: 48 * 3,
              width: '20ch',
            },
          }}
        >
          <MenuItem 
            onClick={() => {
              fileInputRef.current?.click();
              setSettingsAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={(e) => {
              setSettingsAnchorEl(null);
              setLanguageAnchorEl(e.currentTarget);
            }}
          >
            <ListItemIcon>
              <Language fontSize="small" />
            </ListItemIcon>
            <ListItemText>Language</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={handleLogout}
            sx={{ color: '#d32f2f' }}
          >
            <ListItemIcon>
              <Logout fontSize="small" sx={{ color: '#d32f2f' }} />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
        
        {/* Language Selection Submenu */}
        <Menu
          anchorEl={languageAnchorEl}
          open={Boolean(languageAnchorEl)}
          onClose={() => setLanguageAnchorEl(null)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          container={() => document.querySelector('.sidebar')}
          style={{ zIndex: 1301 }}
          PaperProps={{
            style: {
              maxHeight: 48 * 12,
              width: '20ch',
            },
          }}
        >
          {languages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => {
                setSelectedLanguage(lang.name);
                localStorage.setItem("app_language", lang.name);
                localStorage.setItem("app_language_code", lang.code);
                setLanguageAnchorEl(null);
                alert(`Language changed to ${lang.name}`);
              }}
              selected={selectedLanguage === lang.name}
            >
              <ListItemText primary={lang.name} />
              {selectedLanguage === lang.name && (
                <span style={{ marginLeft: 16, color: '#25d366' }}>✓</span>
              )}
            </MenuItem>
          ))}
        </Menu>
        
        {/* Hidden file input for profile picture */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleProfilePictureChange}
        />
        <input
          ref={profilePicRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleProfilePictureChange}
        />
        <div className="sidebar__search">
          <div className="sidebar__searchContainer">
            <SearchOutlined />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                // If user presses Enter or clicks, create new chat
                if (value.trim() && e.key === "Enter") {
                  handleCreateChat(value.trim());
                  setSearchQuery("");
                }
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  handleCreateChat(searchQuery.trim());
                  setSearchQuery("");
                }
              }}
            />
          </div>
        </div>
        <div className="sidebar__chats">
        {rooms
          .filter(room => {
            if (!searchQuery.trim()) return true;
            return room.name.toLowerCase().includes(searchQuery.toLowerCase());
          })
          .map((room) => (
          <SidebarChat 
            key={room._id} 
            id={room._id} 
            name={room.name}
            photo={room.photo}
            email={room.email}
            onChatUpdate={handleChatUpdate}
          />
        ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
