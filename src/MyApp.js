import React from "react";
import "./App.css";
import DeviceTree from "./components/DeviceTree";
import DragDiv from "./components/DragDiv";
import TitleBar from "./components/TitleBar";
import LiveViewBody from "./components/LiveViewBody";
import EventPanel from "./components/EventPanel";

class MyApp extends React.Component {
  render() {
    const onSelectedDevice = new window.aui.lang.Delegate(
      "onSelectedDevice",
      this
    );
    let isDraging = false;
    return (
      <div className="myApp">
        <div className="aui-container">
          <TitleBar />
          <DeviceTree
            onSelectedDevice={onSelectedDevice}
            isDraging={isDraging}
          />
          <EventPanel />
          <div className="aui-tree-footer"></div>
        </div>
        <LiveViewBody
          onSelectedDevice={onSelectedDevice}
          isDraging={isDraging}
        />
        <DragDiv />
      </div>
    );
  }
}
export default MyApp;
