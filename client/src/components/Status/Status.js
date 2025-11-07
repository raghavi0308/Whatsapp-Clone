import React from "react";
import "./Status.css";
import { Avatar, IconButton } from "@mui/material";
import { Add, MoreVert } from "@mui/icons-material";
import { useStateValue } from "../ContextApi/StateProvider";

const Status = () => {
  const [{ user }] = useStateValue();

  return (
    <div className="status">
      <div className="status__header">
        <h2>Status</h2>
        <div className="status__headerRight">
          <IconButton>
            <MoreVert />
          </IconButton>
        </div>
      </div>
      <div className="status__body">
        <div className="status__myStatus">
          <Avatar src={user?.photoURL} className="status__avatar" />
          <div className="status__info">
            <h3>My Status</h3>
            <p>Tap to add status update</p>
          </div>
          <IconButton className="status__add">
            <Add />
          </IconButton>
        </div>
        <div className="status__recent">
          <h4>Recent Updates</h4>
          <div className="status__empty">
            <p>No status updates</p>
            <p style={{ fontSize: "12px", color: "gray" }}>
              Status updates are visible for 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Status;

