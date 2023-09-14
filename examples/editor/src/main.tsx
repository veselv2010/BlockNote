import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

window.React = React;

export function initializeEditor(initialContent?: string, readOnly?: boolean) {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <React.StrictMode>
      <App initialContent={initialContent} />
    </React.StrictMode>
  );
}

(window as any).initializeEditor = initializeEditor;

// initializeEditor()