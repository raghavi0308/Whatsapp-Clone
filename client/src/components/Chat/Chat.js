import React, { useEffect, useState, useRef } from "react";
import "./Chat.css";
import { Avatar, IconButton, Menu, MenuItem } from "@mui/material";
import {
  AttachFile,
  InsertEmoticon,
  Mic,
  MoreVert,
  SearchOutlined,
  Block,
  Delete,
  Download,
  NotificationsOff,
  Close,
  Pause,
  PlayArrow,
  SendRounded,
  FiberManualRecord,
} from "@mui/icons-material";
import axios from "../../axios";
import { useParams } from "react-router-dom";
import { useStateValue } from "../ContextApi/StateProvider";
import Pusher from "pusher-js";
import { formatMessageTimestamp, getDateSeparator } from "../../utils/dateFormatter";
import EmojiPicker from "./EmojiPicker";

const VOICE_MESSAGE_PREFIX = "__PINGIT_VOICE__";

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const Chat = () => {
  const [input, setInput] = useState("");
  const { contactId } = useParams();
  const [contactName, setContactName] = useState("");
  const [contactPhoto, setContactPhoto] = useState("");
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const [{ user }] = useStateValue();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recorderStopResolvers = useRef([]);
  const shouldSaveRecordingRef = useRef(true);
  const [recordingStatus, setRecordingStatus] = useState("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioDataUrl, setRecordedAudioDataUrl] = useState("");
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);

  const recordingTimeRef = useRef(0);

  const focusMessageInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const startRecordingTimer = () => {
    clearRecordingTimer();
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const next = prev + 1;
        recordingTimeRef.current = next;
        return next;
      });
    }, 1000);
  };

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const resetRecordingUI = () => {
    clearRecordingTimer();
    setRecordingStatus("idle");
    setIsRecordingPaused(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    setRecordedAudioDataUrl("");
    audioChunksRef.current = [];
    shouldSaveRecordingRef.current = true;
  };

  const stopRecorder = (shouldSave = true) => {
    shouldSaveRecordingRef.current = shouldSave;
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve(recordedAudioDataUrl);
    }
    return new Promise((resolve) => {
      recorderStopResolvers.current.push((dataUrl) => {
        resolve(dataUrl);
      });
      recorder.stop();
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      shouldSaveRecordingRef.current = true;
      setRecordedAudioDataUrl("");
      setRecordingStatus("recording");
      setIsRecordingPaused(false);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      startRecordingTimer();

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        clearRecordingTimer();
        const resolvers = recorderStopResolvers.current;
        recorderStopResolvers.current = [];
        let dataUrl = "";

        if (shouldSaveRecordingRef.current && audioChunksRef.current.length > 0) {
          try {
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            dataUrl = await blobToDataUrl(blob);
            setRecordedAudioDataUrl(dataUrl);
          } catch (error) {
            console.error("Error processing voice recording:", error);
            dataUrl = "";
            setRecordedAudioDataUrl("");
          }
        } else {
          dataUrl = "";
          setRecordedAudioDataUrl("");
        }

        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setRecordingStatus("idle");
        setIsRecordingPaused(false);
        setRecordingTime((prev) => {
          recordingTimeRef.current = prev;
          return prev;
        });

        if (resolvers.length > 0) {
          resolvers.forEach((resolve) => resolve(dataUrl));
        }
      };

      recorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Unable to access the microphone. Please check your permissions and try again.");
      resetRecordingUI();
    }
  };

  const handleMicClick = async () => {
    if (recordingStatus !== "idle") {
      return;
    }
    await startRecording();
  };

  const handlePauseResumeRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      return;
    }

    if (recordingStatus === "recording") {
      recorder.pause();
      clearRecordingTimer();
      setRecordingStatus("paused");
      setIsRecordingPaused(true);
    } else if (recordingStatus === "paused") {
      recorder.resume();
      setRecordingStatus("recording");
      setIsRecordingPaused(false);
      startRecordingTimer();
    }
  };

  const handleDeleteRecording = async () => {
    if (recordingStatus === "idle" && !recordedAudioDataUrl) {
      return;
    }
    await stopRecorder(false);
    resetRecordingUI();
  };

  const createVoiceMessagePayload = (durationSeconds, dataUrl) =>
    `${VOICE_MESSAGE_PREFIX}${durationSeconds}|${dataUrl}`;

  const parseVoiceMessage = (messageString = "") => {
    if (typeof messageString !== "string") return null;
    if (!messageString.startsWith(VOICE_MESSAGE_PREFIX)) return null;
    const payload = messageString.slice(VOICE_MESSAGE_PREFIX.length);
    const separatorIndex = payload.indexOf("|");
    if (separatorIndex === -1) {
      return {
        duration: 0,
        dataUrl: payload,
      };
    }
    const duration = Number(payload.slice(0, separatorIndex)) || 0;
    const dataUrl = payload.slice(separatorIndex + 1);
    return { duration, dataUrl };
  };

  const getMessageSearchText = (msg = {}) => {
    const content = typeof msg?.message === "string" ? msg.message : "";
    if (content.startsWith(VOICE_MESSAGE_PREFIX)) {
      return "voice message";
    }
    return content;
  };

  const sendVoiceMessage = async (audioDataUrl, durationSeconds) => {
    if (!audioDataUrl || !contactId) {
      return;
    }

    if (!user || !user.displayName || !user.uid) {
      alert("Please sign in to send messages");
      return;
    }

    const messageText = createVoiceMessagePayload(durationSeconds, audioDataUrl);
    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date();

    const optimisticMessage = {
      _id: tempId,
      message: messageText,
      name: user.displayName,
      timestamp,
      uid: user.uid,
      roomId: contactId,
    };

    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
    setFilteredMessages((prev) => [...prev, optimisticMessage]);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const response = await axios.post(`/messages/new`, {
        message: messageText,
        name: user.displayName,
        timestamp,
        uid: user.uid,
        roomId: contactId,
      });

      if (response.data && response.data._id) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg._id === tempId ? response.data : msg))
        );
        setFilteredMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? response.data : msg))
        );
      }
    } catch (error) {
      console.error("Error sending voice message:", error);
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== tempId));
      setFilteredMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      alert("Failed to send voice message. Please try again.");
    }
  };

  const handleSendRecording = async () => {
    if (recordingStatus === "idle" && !recordedAudioDataUrl) {
      return;
    }

    if (!user || !user.displayName || !user.uid) {
      alert("Please sign in to send messages");
      resetRecordingUI();
      return;
    }

    let audioDataUrl = recordedAudioDataUrl;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      audioDataUrl = await stopRecorder(true);
    }

    if (!audioDataUrl) {
      resetRecordingUI();
      return;
    }

    const duration = recordingTimeRef.current;
    await sendVoiceMessage(audioDataUrl, duration);
    resetRecordingUI();
  };

  useEffect(() => {
    if (contactId) {
      // Fetch contact/room info
      axios
        .get(`/room/${contactId}`)
        .then((response) => {
          setContactName(response.data.name);
          setContactPhoto(response.data.photo || null);
          setUpdatedAt(response.data.updatedAt || new Date());
        })
        .catch((err) => {
          console.error("Error fetching contact:", err);
          // Set default name if fetch fails
          setContactName("Contact");
        });
      
      // Fetch messages
      axios
        .get(`/messages/${contactId}`)
        .then((response) => {
          setMessages(response.data);
          setFilteredMessages(response.data);
          
          // Mark messages as read when viewing chat
          if (user && response.data.length > 0) {
            const lastMessage = response.data[response.data.length - 1];
            localStorage.setItem(`lastRead_${contactId}`, lastMessage.timestamp);
          }
        })
        .catch((err) => {
          console.error("Error fetching messages:", err);
          setMessages([]);
          setFilteredMessages([]);
        });
    }
  }, [contactId, user]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
        } catch (error) {
          console.error("Error stopping media recorder on cleanup:", error);
        }
        const stream = mediaRecorderRef.current.stream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
    };
  }, []);

  // Filter messages based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMessages(messages);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = messages.filter((msg) =>
        getMessageSearchText(msg).toLowerCase().includes(lowerQuery)
      );
      setFilteredMessages(filtered);
    }
  }, [searchQuery, messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || !contactId) {
      return;
    }

    if (!user || !user.displayName || !user.uid) {
      alert("Please sign in to send messages");
      return;
    }

    const messageText = trimmedInput;
    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date();

    // Optimistically add message immediately
    const optimisticMessage = {
      _id: tempId,
      message: messageText,
      name: user.displayName,
      timestamp: timestamp,
      uid: user.uid,
      roomId: contactId,
    };

    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
    setFilteredMessages((prev) => [...prev, optimisticMessage]);
    setInput("");
    focusMessageInput();

    // Scroll to bottom after adding message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const response = await axios.post(`/messages/new`, {
        message: messageText,
        name: user.displayName,
        timestamp: timestamp,
        uid: user.uid,
        roomId: contactId, // Using contactId as roomId for backend compatibility
      });

      // Replace optimistic message with real one from server
      if (response.data && response.data._id) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg._id === tempId ? response.data : msg))
        );
        setFilteredMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? response.data : msg))
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove optimistic message on error
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== tempId));
      setFilteredMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      alert("Failed to send message. Make sure the server is running.");
    }
  };

  useEffect(() => {
    if (!contactId) return;

    const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY || "6fbb654a0e0b670de165", {
      cluster: process.env.REACT_APP_PUSHER_CLUSTER || "ap2",
    });

    const channel = pusher.subscribe("messages");
    channel.bind("inserted", function (newMessage) {
      // Only add message if it belongs to current contact/room
      if (newMessage.roomId === contactId) {
        // Check if message already exists (to avoid duplicates from optimistic updates)
        setMessages((prevMessages) => {
          const exists = prevMessages.some(msg => 
            msg._id === newMessage._id || 
            (msg._id && msg._id.startsWith('temp-') && 
             msg.message === newMessage.message && 
             msg.uid === newMessage.uid &&
             Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 5000)
          );
          if (exists) {
            // Replace optimistic message with real one
            return prevMessages.map(msg => {
              if (msg._id && msg._id.startsWith('temp-') && 
                  msg.message === newMessage.message && 
                  msg.uid === newMessage.uid) {
                return newMessage;
              }
              return msg;
            });
          }
          return [...prevMessages, newMessage];
        });
        
        // Update filtered messages if search is active
        const currentQuery = searchQuery.trim();
        const normalizedNewMessage = getMessageSearchText(newMessage).toLowerCase();
        const normalizedQuery = currentQuery.toLowerCase();
        if (currentQuery === "" || normalizedNewMessage.includes(normalizedQuery)) {
          setFilteredMessages((prev) => {
            const exists = prev.some(msg => 
              msg._id === newMessage._id || 
              (msg._id && msg._id.startsWith('temp-') && 
               msg.message === newMessage.message && 
               msg.uid === newMessage.uid)
            );
            if (exists) {
              return prev.map(msg => {
                if (msg._id && msg._id.startsWith('temp-') && 
                    msg.message === newMessage.message && 
                    msg.uid === newMessage.uid) {
                  return newMessage;
                }
                return msg;
              });
            }
            return [...prev, newMessage];
          });
        }
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [contactId, searchQuery]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  // Default view when no chat is selected
  if (!contactId) {
    return (
      <div className="chat chat__default">
        <div
          className="chat__defaultBg"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url(/icon.png)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "220px",
            opacity: 0.14,
            zIndex: 0,
          }}
        />
        <div className="chat__defaultContent">
          <h1>PingIt for Windows</h1>
          <p>Send and receive messages without keeping your phone online. Use PingIt on up to 4 linked devices and 1 phone at the same time.</p>
          <div className="chat__defaultFooter">
            <span>🔒</span>
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat">
      <div className="chat__header">
        <Avatar src={contactPhoto || `https://api.dicebear.com/6.x/adventurer/svg?seed=${contactId || 'default'}`} />

        <div className="chat__headerInfo">
          <h3>{contactName || "Welcome to PingIt"}</h3>
          <p>Last updated at {formatMessageTimestamp(updatedAt)}</p>
        </div>

        <div className="chat__headerRight">
          <IconButton onClick={() => setShowSearch(!showSearch)}>
            <SearchOutlined />
          </IconButton>
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <AttachFile />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                alert(`File selected: ${file.name}\nFile size: ${(file.size / 1024).toFixed(2)} KB\n\nFile upload functionality can be implemented with backend support.`);
                // Reset file input
                e.target.value = "";
              }
            }}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => { alert("Block functionality coming soon!"); setAnchorEl(null); }}>
              <Block style={{ marginRight: 8 }} /> Block
            </MenuItem>
            <MenuItem onClick={() => { 
              if (window.confirm("Are you sure you want to clear all messages in this chat?")) {
                setMessages([]);
                setFilteredMessages([]);
                alert("Chat cleared (local only - messages still in database)");
              }
              setAnchorEl(null);
            }}>
              <Delete style={{ marginRight: 8 }} /> Clear Chat
            </MenuItem>
            <MenuItem onClick={() => { 
              const chatData = {
                contactName,
                messages: messages.map(m => ({
                  name: m.name,
                  message: m.message,
                  timestamp: m.timestamp
                }))
              };
              const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${contactName}_chat_export.json`;
              a.click();
              URL.revokeObjectURL(url);
              setAnchorEl(null);
            }}>
              <Download style={{ marginRight: 8 }} /> Export Chat
            </MenuItem>
            <MenuItem onClick={() => { alert("Notifications muted for this chat"); setAnchorEl(null); }}>
              <NotificationsOff style={{ marginRight: 8 }} /> Mute Notifications
            </MenuItem>
          </Menu>
        </div>
      </div>

      {showSearch && (
        <div className="chat__search">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <IconButton onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
            <Close />
          </IconButton>
        </div>
      )}
      <div className="chat__body">
        {filteredMessages.length === 0 && searchQuery ? (
          <p style={{ textAlign: "center", padding: "20px", color: "gray" }}>
            No messages found matching "{searchQuery}"
          </p>
        ) : (
          filteredMessages.map((message, index) => {
            const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
            const showName = !prevMessage || prevMessage.uid !== message.uid;
            const isReceiver = message.uid === user.uid;
            const dateSeparator = getDateSeparator(
              message.timestamp,
              prevMessage?.timestamp
            );
            
            const voicePayload = parseVoiceMessage(message.message);
            const isVoiceMessage = Boolean(voicePayload);
            const messageClasses = `chat__message ${
              isReceiver ? "chat__receiver" : ""
            } ${showName ? "chat__message--withName" : ""} ${
              isVoiceMessage ? "chat__message--voice" : ""
            }`;

            const messageContent = isVoiceMessage ? (
              <div className={messageClasses}>
                <audio
                  className="chat__voiceAudio"
                  controls
                  preload="metadata"
                  src={voicePayload?.dataUrl}
                />
                <span className="chat__voiceDuration">
                  {formatDuration(voicePayload?.duration || 0)}
                </span>
              </div>
            ) : (
              <p className={messageClasses}>{message.message}</p>
            );

            return (
              <React.Fragment key={message?.id ? message?.id : index}>
                {dateSeparator && (
                  <div className="chat__dateSeparator">
                    <span>{dateSeparator}</span>
                  </div>
                )}
                <div
                  className={`chat__messageContainer ${
                    isReceiver ? "chat__messageContainer--receiver" : ""
                  }`}
                >
                  {showName && !isReceiver && (
                    <span className="chat__name">{message.name}</span>
                  )}
                  {messageContent}
                  <span className="chat__timestamp">
                    {formatMessageTimestamp(message.timestamp)}
                  </span>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {contactName && (
        <div
          className={`chat__footer ${
            recordingStatus !== "idle" ? "chat__footer--recording" : ""
          }`}
        >
          {recordingStatus === "idle" ? (
            <>
              <IconButton
                ref={emojiButtonRef}
                onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
              >
                <InsertEmoticon />
              </IconButton>
              <EmojiPicker
                anchorEl={emojiAnchorEl}
                open={Boolean(emojiAnchorEl)}
                onClose={() => {
                  setEmojiAnchorEl(null);
                  focusMessageInput();
                }}
                onEmojiClick={(emoji) => {
                  setInput((prev) => prev + emoji);
                  setEmojiAnchorEl(null);
                  focusMessageInput();
                }}
              />
              <form onSubmit={sendMessage} className="chat__form">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message"
                  type="text"
                />
                <IconButton
                  type="submit"
                  className="chat__sendButton"
                  disabled={!input.trim()}
                >
                  <SendRounded />
                </IconButton>
              </form>
              <IconButton
                className={`chat__micButton ${
                  recordingStatus !== "idle" ? "chat__micButton--active" : ""
                }`}
                onClick={handleMicClick}
                disabled={recordingStatus !== "idle"}
              >
                <Mic />
              </IconButton>
            </>
          ) : (
            <div className="chat__recording">
              <IconButton
                className="chat__recordingDelete"
                onClick={handleDeleteRecording}
              >
                <Delete />
              </IconButton>
              <div className="chat__recordingInfo">
                <FiberManualRecord className="chat__recordingDot" />
                <span className="chat__recordingTime">
                  {formatDuration(recordingTime)}
                </span>
                <div className="chat__recordingProgress" />
              </div>
              <IconButton
                className="chat__recordingPause"
                onClick={handlePauseResumeRecording}
              >
                {isRecordingPaused ? <PlayArrow /> : <Pause />}
              </IconButton>
              <IconButton
                className="chat__recordingSend"
                onClick={handleSendRecording}
              >
                <SendRounded />
              </IconButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;
