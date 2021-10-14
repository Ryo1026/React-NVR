import React from "react";
import "./App.css";
import DeviceTree from "./components/DeviceTree";
import DragDiv from "./components/DragDiv";

class MyApp extends React.Component {
  render() {
    return (
      <div className="myApp">
        <DeviceTree />
        <DragDiv />
      </div>
    );
  }
}
export default MyApp;
