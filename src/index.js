import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import DeviceTree from "./DeviceTree";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "./reducers/rootReducer";

let store = createStore(rootReducer);

ReactDOM.render(
  <Provider store={store}>
    <DeviceTree />
  </Provider>,
  document.getElementById("root")
);
