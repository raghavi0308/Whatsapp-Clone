import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reducer, { initialState } from "./components/ContextApi/reducer";
import { StateProvider } from "./components/ContextApi/StateProvider";

// Suppress harmless Firebase hosting 404 errors
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const errorMessage = args.join(" ");
  if (
    errorMessage.includes("favicon.ico") ||
    errorMessage.includes("__/firebase/init.json") ||
    (errorMessage.includes("404") && errorMessage.includes("firebaseapp.com")) ||
    errorMessage.includes("Cross-Origin-Opener-Policy") ||
    errorMessage.includes("window.close") ||
    errorMessage.includes("Slow network")
  ) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const warnMessage = args.join(" ");
  if (
    warnMessage.includes("favicon.ico") ||
    warnMessage.includes("__/firebase/init.json") ||
    (warnMessage.includes("404") && warnMessage.includes("firebaseapp.com")) ||
    warnMessage.includes("Slow network")
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Suppress network errors for Firebase hosting resources
window.addEventListener("error", (event) => {
  if (
    event.target &&
    (event.target.href?.includes("favicon.ico") ||
      event.target.href?.includes("__/firebase/init.json") ||
      event.target.href?.includes("firebaseapp.com"))
  ) {
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
