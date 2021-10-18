import React from "react";
import "./App.css";
import DeviceTree from "./components/DeviceTree";
import DragDiv from "./components/DragDiv";
import TitleBar from "./components/TitleBar";

class MyApp extends React.Component {
  render() {
    return (
      <div className="myApp">
        <div className="aui-container">
          <TitleBar />
          <DeviceTree />
        </div>
        <DragDiv />
      </div>
    );
  }
}
export default MyApp;
