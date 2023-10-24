import ReactDom from "react-dom/client";
import React from "react";
import { App } from "./App";

const root = ReactDom.createRoot(document.getElementById("root")!);
root.render(React.createElement(App));
