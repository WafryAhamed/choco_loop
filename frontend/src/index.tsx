import "./index.css";
import { createRoot, type Root } from "react-dom/client";
import { App } from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

const rootKey = "__chocoloop_react_root__";
const w = window as Window & { [rootKey]?: Root };

if (!w[rootKey]) {
  w[rootKey] = createRoot(container);
}
w[rootKey]!.render(<App />);
