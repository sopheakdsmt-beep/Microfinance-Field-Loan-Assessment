import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { seedIfEmpty } from "./db/seed";
import "@fontsource/kantumruy-pro/khmer-400.css";
import "@fontsource/kantumruy-pro/khmer-500.css";
import "@fontsource/kantumruy-pro/khmer-600.css";
import "@fontsource/kantumruy-pro/khmer-700.css";
import "@fontsource/kantumruy-pro/latin-400.css";
import "@fontsource/kantumruy-pro/latin-500.css";
import "@fontsource/kantumruy-pro/latin-600.css";
import "@fontsource/kantumruy-pro/latin-700.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "./styles.css";

if (import.meta.env.PROD) registerSW({ immediate: true });

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");

void seedIfEmpty().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
