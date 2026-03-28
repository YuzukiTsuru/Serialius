import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/globals.css";
import App from "./App";

// Prevent macOS WebView rubber-band / two-finger pan on the document itself.
// Individual scroll containers (log panel, port list, xterm) still scroll normally
// because their wheel events do not reach the document when content is scrollable.
document.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

