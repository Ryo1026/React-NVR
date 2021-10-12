import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import DeviceTree from "./DeviceTree";
import { Provider } from "react-redux";
import { createStore } from "redux";

ReactDOM.render(
  <React.StrictMode>
    <DeviceTree />
  </React.StrictMode>,
  document.getElementById("root")
);
