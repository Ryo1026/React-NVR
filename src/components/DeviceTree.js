import React from "react";
import {
  getDevices,
  focusDeviceId,
  toggleFolder,
} from "../actions/actionCreator";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return {
    devicesInfo: state.devicesInfo,
    focusDeviceId: state.focusDeviceId,
    folderOpen: state.folderOpen,
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
  };
};

class DeviceTreeUI extends React.Component {
  constructor() {
    super();
    this.state = {
      listOpen: true,
    };
  }
  componentDidMount() {
    this.getDataAndDispatch();
  }
  getDataAndDispatch = async function () {
    const { onDataReceived } = this.props;
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
        // parse into DOM物件可以使用內建的方法 ex:xml.getElementsById()
        // console.log(xml.getElementsByTagName("Device"));
        const dispatchData = []; // 準備放 deviceList 的Array
        for (let i = 0; i < xml.getElementsByTagName("Device").length; i++) {
          // 擷取回傳的資料中需要的部分，並包裝成obj再放入redux中
          const obj = {
            id: i + 1,
            name: xml
              .getElementsByTagName("Device")
              [i].getElementsByTagName("Name")[0].innerHTML,
          };
          dispatchData.push(obj); // 逐個放入device
        }
        onDataReceived(dispatchData); // 整個 deviceList Array dispatch 到 Redux
      });
  };
  dragEvent = (e, isDraging) => {
    const dragDiv = document.getElementById("dragDiv");
    dragDiv.classList.remove("hidden");
    dragDiv.style.top = e.clientY + 5 + "px";
    dragDiv.style.left = e.clientX + 5 + "px";
    isDraging = true;
    const mouseMoveEvent = function (e) {
      dragDiv.style.top = e.clientY + 5 + "px";
      dragDiv.style.left = e.clientX + 5 + "px";
    };
    const mouseUpEvent = function () {
      document.body.removeEventListener("mousemove", mouseMoveEvent);
      document.body.removeEventListener("mouseup", mouseUpEvent);
      dragDiv.classList.add("hidden");
      isDraging = false;
    };
    document.body.addEventListener("mousemove", mouseMoveEvent);
    document.body.addEventListener("mouseup", mouseUpEvent);
  };
  render() {
    const {
      devicesInfo,
      focusDeviceId,
      onFocusDevice,
      folderOpen,
      onToggleFolder,
      onSelectedDevice,
      isDraging,
    } = this.props;
    return (
      <div
        className={`aui-camera-channel-body ${
          this.state.listOpen ? "" : "flexGrow0"
        }`}
      >
        <div
          className="aui-camera-channel-bar"
          onClick={() => {
            this.setState({ listOpen: !this.state.listOpen });
          }}
        >
          Device
        </div>
        <div className={`aui-tree-area ${this.state.listOpen ? "" : "hide"}`}>
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
                            this.dragEvent(e, isDraging);
                            onSelectedDevice.fire(1, "Drag");
                          }}
                          onDoubleClick={() => {
                            onSelectedDevice.fire(1, "Dbclick");
                          }}
                        >
                          {v.id + " " + v.name}
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
                this.getDataAndDispatch();
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
