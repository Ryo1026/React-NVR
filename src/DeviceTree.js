import React from "react";
import "./App.css";

class DeviceTree extends React.Component {
  componentDidMount() {
    async function getDataFromServer() {
      const request = new Request("http://localhost:80/Media/Device/getDevice");
      const response = await fetch(request, {
        headers: new Headers({
          Authorization: "Basic " + btoa("admin:123456"),
        }),
      });
      console.log(response);
    }
    getDataFromServer();
  }
  render() {
    return (
      <div className="aui-camera-channel-body">
        <div className="aui-camera-channel-bar">Device</div>
        <div className="aui-tree-area">
          <ul>
            <li className="tree-node layer-1">
              <div className="tree-node-main-node folder-layer">
                <div className="toggle-icon expand"></div>
                <div className="folder-icon"></div>
                <div className="node-text">All Devices</div>
              </div>
              <ul>
                <li className="tree-node layer-2"></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default DeviceTree;
