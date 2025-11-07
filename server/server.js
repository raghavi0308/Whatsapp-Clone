require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Rooms = require("./dbRooms");
const Pusher = require("pusher");
const cors = require("cors");
const Messages = require("./dbMessages");

const app = express();
const port = process.env.PORT || 5000;

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "1330597",
  key: process.env.PUSHER_KEY || "6fbb654a0e0b670de165",
  secret: process.env.PUSHER_SECRET || "a96c94ba1f510bc260e2",
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

// Parse CORS origins from environment variable or use defaults
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

const corsOptions = {
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

const dbUrl = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/";

mongoose.connect(dbUrl);

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");

  const roomCollection = db.collection("rooms");
  const changeStream = roomCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const roomDetails = change.fullDocument;
      pusher.trigger("room", "inserted", roomDetails);
    } else {
      console.log("Not a expected event to trigger");
    }
  });
  changeStream.on("error", (err) => {
    console.log("Room changeStream error:", err && (err.codeName || err.message));
    try {
      changeStream.close();
    } catch (e) {}
  });

  const msgCollection = db.collection("messages");
  const changeStream1 = msgCollection.watch();

  changeStream1.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", messageDetails);
    } else {
      console.log("Not a expected event to trigger");
    }
  });
  changeStream1.on("error", (err) => {
    console.log("Messages changeStream error:", err && (err.codeName || err.message));
    try {
      changeStream1.close();
    } catch (e) {}
  });
});

app.get("/", (req, res) => {
  return res.status(200).send("Api is working");
});

app.get("/room/:id", (req, res) => {
  Rooms.find({ _id: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data[0]);
    }
  });
});

app.get("/messages/:id", (req, res) => {
  Messages.find({ roomId: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

app.post("/group/create", (req, res) => {
  const name = req.body.groupName;
  Rooms.create({ name }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

app.get("/all/rooms", (req, res) => {
  Rooms.find({}, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.delete("/room/:id", (req, res) => {
  const roomId = req.params.id;
  console.log(`Attempting to delete room: ${roomId}`);
  
  // Use findOneAndDelete to match the pattern used in other routes
  Rooms.findOneAndDelete({ _id: roomId }, (err, data) => {
    if (err) {
      console.error("Error deleting room:", err);
      return res.status(500).send({ error: "Error deleting room", details: err.message });
    }
    
    if (!data) {
      console.log(`Room not found: ${roomId}`);
      return res.status(404).send({ error: "Room not found", roomId: roomId });
    }
    
    // Also delete all messages in this room
    Messages.deleteMany({ roomId: roomId }, (msgErr, msgResult) => {
      if (msgErr) {
        console.error("Error deleting messages:", msgErr);
      } else {
        console.log(`Deleted ${msgResult.deletedCount} messages for room ${roomId}`);
      }
    });
    
    console.log(`Successfully deleted room: ${roomId}`);
    return res.status(200).send({ 
      message: "Room deleted successfully", 
      roomId: roomId,
      deletedRoom: data 
    });
  });
});

app.delete("/messages/:id", (req, res) => {
  Messages.deleteMany({ roomId: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send({ message: "Messages cleared successfully", deletedCount: data.deletedCount });
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on localhost:${port}`);
});
