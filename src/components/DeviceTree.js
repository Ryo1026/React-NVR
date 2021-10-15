import React from "react";
import {
  getDevices,
  focusDeviceId,
  toggleFolder,
  dragDevice,
} from "../actions/actionCreator";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return {
    folderOpen: state.folderOpen,
    focusDeviceId: state.focusDeviceId,
    devicesInfo: state.devicesInfo,
    dragDevice: state.dragDevice,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onDataReceived: (devicesInfo) => {
      dispatch(getDevices(devicesInfo));
    },
    onFocusDevice: (id) => {
      dispatch(focusDeviceId(id));
    },
    onToggleFolder: () => {
      dispatch(toggleFolder());
    },
    onDeviceDrag: (deviceName) => {
      dispatch(dragDevice(deviceName));
    },
  };
};

class DeviceTreeUI extends React.Component {
  componentDidMount() {
    const { onDataReceived } = this.props;
    async function getDataAndDispatch() {
      const requestURL = new Request(
        "http://localhost:80/Media/Device/getDevice"
      );
      await fetch(requestURL, {
        headers: new Headers({
          Authorization: "Basic " + btoa("admin:123456"),
        }),
      })
        .then((res) => res.text())
        .then((data) => {
          const parser = new DOMParser();
          const xml = parser.parseFromString(data, "application/xml");
          // parse 為 DOM 物件可以使用內建的方法
          // console.log(xml.getElementsByTagName("Device"));
          const dispatchData = []; // 準備放 deviceList 的Array
          for (let i = 0; i < xml.getElementsByTagName("Device").length; i++) {
            // 擷取回傳的資料中需要的部分，並包裝成obj再放入redux中
            const obj = {
              id: i,
              name: xml
                .getElementsByTagName("Device")
                [i].getElementsByTagName("Name")[0].innerHTML,
            };
            dispatchData.push(obj); // 逐個放入device
          }
          onDataReceived(dispatchData); // 整個 deviceList Array dispatch 到 Redux
        });
    }
    getDataAndDispatch();
  }
  dragEvent = (e, onDeviceDrag) => {
    const dragDiv = document.getElementById("dragDiv");
    dragDiv.style.top = e.clientY + 5 + "px";
    dragDiv.style.left = e.clientX + 5 + "px";
    const mouseMoveEvent = function (e) {
      dragDiv.style.top = e.clientY + 5 + "px";
      dragDiv.style.left = e.clientX + 5 + "px";
    };
    const mouseUpEvent = function () {
      document.body.removeEventListener("mousemove", mouseMoveEvent);
      document.body.removeEventListener("mouseup", mouseUpEvent);
      onDeviceDrag("");
    };
    document.body.addEventListener("mousemove", mouseMoveEvent);
    document.body.addEventListener("mouseup", mouseUpEvent);
  };
  render() {
    const {
      devicesInfo,
      onDataReceived,
      focusDeviceId,
      onFocusDevice,
      folderOpen,
      onToggleFolder,
      onDeviceDrag,
    } = this.props;
    async function getDataAndDispatch() {
      const requestURL = new Request(
        "http://localhost:80/Media/Device/getDevice"
      );
      await fetch(requestURL, {
        headers: new Headers({
          Authorization: "Basic " + btoa("admin:123456"),
        }),
      })
        .then((res) => res.text())
        .then((data) => {
          const parser = new DOMParser();
          const xml = parser.parseFromString(data, "application/xml");
          const dispatchData = [];
          for (let i = 0; i < xml.getElementsByTagName("Device").length; i++) {
            const obj = {
              id: i,
              name: xml
                .getElementsByTagName("Device")
                [i].getElementsByTagName("Name")[0].innerHTML,
            };
            dispatchData.push(obj);
          }
          onDataReceived(dispatchData);
        });
    }
    return (
      <div className="aui-camera-channel-body">
        <div className="aui-camera-channel-bar">Device</div>
        <div className="aui-tree-area">
          <ul>
            <li className="tree-node layer-1">
              <div className="tree-node-main-node folder-layer">
                <div
                  className={`toggle-icon ${folderOpen ? "expand" : ""}`}
                  onClick={() => {
                    onToggleFolder();
                  }}
                ></div>
                <div className="folder-icon"></div>
                <div
                  className={`node-text ${
                    focusDeviceId === -1 ? "selected" : ""
                  }`}
                  onClick={() => {
                    onFocusDevice(-1);
                  }}
                >
                  All Devices
                </div>
              </div>
              <ul>
                <li
                  className={`tree-node layer-2 ${folderOpen ? "" : "hidden"}`}
                >
                  {devicesInfo.map((v, i) => {
                    return (
                      <div key={i} className="tree-node-main-node device-layer">
                        <div className="node-record"></div>
                        <div className="node-icon camera-icon"></div>
                        <div
                          className={`node-text ${
                            focusDeviceId === i ? "selected" : ""
                          }`}
                          onClick={() => {
                            onFocusDevice(i);
                          }}
                          onMouseDown={(e) => {
                            onDeviceDrag(`${i + 1} ${v.name}`);
                            this.dragEvent(e, onDeviceDrag);
                          }}
                        >
                          {i + 1 + " " + v.name}
                        </div>
                      </div>
                    );
                  })}
                </li>
              </ul>
            </li>
          </ul>
          <div className="get-data-btn">
            <button
              onClick={() => {
                getDataAndDispatch();
              }}
            >
              Get Devices
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const DeviceTree = connect(mapStateToProps, mapDispatchToProps)(DeviceTreeUI);
export default DeviceTree;
