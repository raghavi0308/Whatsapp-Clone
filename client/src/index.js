import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reducer, { initialState } from "./components/ContextApi/reducer";
import { StateProvider } from "./components/ContextApi/StateProvider";

// Suppress harmless Firebase hosting 404 errors
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Override console methods to filter Firebase hosting errors
console.error = (...args) => {
  const errorMessage = args.join(" ");
  if (
    errorMessage.includes("favicon.ico") ||
    errorMessage.includes("__/firebase/init.json") ||
    (errorMessage.includes("404") && errorMessage.includes("firebaseapp.com")) ||
    errorMessage.includes("Cross-Origin-Opener-Policy") ||
    errorMessage.includes("window.close")
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
    (warnMessage.includes("404") && warnMessage.includes("firebaseapp.com"))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

console.log = (...args) => {
  const logMessage = args.join(" ");
  if (
    logMessage.includes("__/firebase/init.json") &&
    logMessage.includes("404")
  ) {
    return;
  }
  originalLog.apply(console, args);
};

// Intercept fetch requests to prevent Firebase init.json request
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0]?.toString() || "";
  if (url.includes("__/firebase/init.json") && url.includes("firebaseapp.com")) {
    // Prevent the request entirely by returning a resolved promise with 404
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    });
  }
  return originalFetch.apply(this, args);
};

// Intercept XMLHttpRequest to prevent Firebase init.json request
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  if (typeof url === "string" && url.includes("__/firebase/init.json") && url.includes("firebaseapp.com")) {
    // Store the URL to check in send
    this._shouldBlock = true;
    return;
  }
  return originalXHROpen.apply(this, [method, url, ...rest]);
};
XMLHttpRequest.prototype.send = function(...args) {
  if (this._shouldBlock) {
    // Prevent the request
    this._shouldBlock = false;
    return;
  }
  return originalXHRSend.apply(this, args);
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
