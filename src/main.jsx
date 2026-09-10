import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import store from "./store.js";
import App from "./App";
import SessionHandler from "./components/SessionHandler";
import "./index.css";
import "./styles/common.css";

// 👇 ADD THIS
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker Registered:", registration.scope);
    } catch (error) {
      console.error("❌ Service Worker Registration Failed:", error);
    }
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <SessionHandler />
      <App />
    </Provider>
  </StrictMode>
);