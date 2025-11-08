import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reducer, { initialState } from "./components/ContextApi/reducer";
import { StateProvider } from "./components/ContextApi/StateProvider";

// Suppress harmless Firebase and browser errors for clean experience
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const msg = args.join(" ");
  if (
    msg.includes("__/firebase/init.json") ||
    msg.includes("favicon.ico") ||
    msg.includes("firebaseapp.com") ||
    msg.includes("Slow network") ||
    msg.includes("Cross-Origin-Opener-Policy")
  ) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const msg = args.join(" ");
  if (
    msg.includes("__/firebase/init.json") ||
    msg.includes("favicon.ico") ||
    msg.includes("firebaseapp.com") ||
    msg.includes("Slow network")
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Suppress network errors silently
window.addEventListener("error", (event) => {
  if (event.target && (
    event.target.href?.includes("favicon.ico") ||
    event.target.href?.includes("__/firebase/init.json") ||
    event.target.href?.includes("firebaseapp.com")
  )) {
    event.preventDefault();
    return false;
  }
}, true);

ReactDOM.render(
  <React.StrictMode>
    <StateProvider initialState={initialState} reducer={reducer}>
      <App />
    </StateProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
