import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/noto-sans-arabic/arabic-400.css";
import "@fontsource/noto-sans-arabic/arabic-600.css";
import App from "./companion/CompanionApp";
import tokens from "./system/tokens.json";
import { resolveToken } from "./system/contract";
import "./styles.css";

for (const role of Object.keys(tokens.semantic))
  document.documentElement.style.setProperty(
    `--${role.replaceAll(".", "-")}`,
    resolveToken(role).value,
  );
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
