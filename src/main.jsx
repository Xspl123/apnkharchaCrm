import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import store from "./store.js";
import App from "./App";
import SessionHandler from "./components/SessionHandler";
import "./index.css";
import "./styles/common.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <SessionHandler />
      <App />
    </Provider>
  </StrictMode>
);
