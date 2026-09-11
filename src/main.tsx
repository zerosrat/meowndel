import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import CatSample from "./preview/CatSample";
import CatStudy from "./preview3d/CatStudy";
import CatIllustration from "./preview2d/CatIllustration";
import LayerStudy from "./preview2d/layers/LayerStudy";
import "./styles.css";

const preview = new URLSearchParams(window.location.search).get("preview");
if (preview === "cat" || preview === "cat3d" || preview === "cat2d" || preview === "catlayers") document.documentElement.dataset.preview = preview;

createRoot(document.getElementById("root")!).render(
  <StrictMode>{preview === "catlayers" ? <LayerStudy /> : preview === "cat2d" ? <CatIllustration /> : preview === "cat3d" ? <CatStudy /> : preview === "cat" ? <CatSample /> : <App />}</StrictMode>
);
