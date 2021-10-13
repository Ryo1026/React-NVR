import React from "react";
import "./App.css";
import { getDevices } from "./actions/actionCreator";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return {
    devicesInfo: state.devicesInfo,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onDataReceived: (devicesInfo) => {
      dispatch(getDevices(devicesInfo));
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
    getDataAndDispatch();
  }

  render() {
    const { devicesInfo, onDataReceived } = this.props;
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
                <li className="tree-node layer-2">
                  {/* map */}
                  <div className="tree-node-main-node device-layer">
                    <div className="node-record"></div>
                    <div className="node-icon camera-icon"></div>
                    <div
                      className="node-text"
                      onClick={() => {
                        console.log(
                          devicesInfo.getElementsByTagName("Device")[0]
                        );
                      }}
                    >
                      1 ACTi
                    </div>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

const DeviceTree = connect(mapStateToProps, mapDispatchToProps)(DeviceTreeUI);
export default DeviceTree;
