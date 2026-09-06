import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import CatSample from "./preview/CatSample";
import "./styles.css";

const catPreview = new URLSearchParams(window.location.search).get("preview") === "cat";
if (catPreview) document.documentElement.dataset.preview = "cat";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{catPreview ? <CatSample /> : <App />}</StrictMode>
);
