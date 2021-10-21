import React from "react";
import {
  changeView,
  dbClickDevice,
  toggleList,
  dragDevice,
} from "../actions/actionCreator";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return {
    listOpen: state.listOpen,
    dbClickDevice: state.dbClickDevice,
    view: state.view,
    dragDevice: state.dragDevice,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onViewChange: (view) => {
      dispatch(changeView(view));
    },
    clearDbClickDevice: () => {
      dispatch(dbClickDevice(null));
    },
    onToggleList: (boolean) => {
      dispatch(toggleList(boolean));
    },
    clearDragDevice: () => {
      dispatch(dragDevice(""));
    },
  };
};

class LiveViewBodyUI extends React.Component {
  constructor() {
    super();
    this.allControllers = [];
    this.controllers = [];
    this.usedControllers = [];
    this.state = {
      titleBarDisplay: false,
      stretchToFit: true,
      liveView: {},
    };
  }
  componentDidMount() {
    let me = this;
    let streamFragment = null;
    let pvtWebGLAdapterModule = null;
    let init = false;
    function initializeController() {
      if (!init && streamFragment != null && pvtWebGLAdapterModule != null) {
        for (let i = 0; i < 6; i++) {
          let mdlid = i + 1;
          const fragObj = streamFragment.createFragmentObject(mdlid);
          fragObj.createWorker(
            streamFragment.URL_FRAGWORKER + "?v=" + new Date().getTime()
          );
          const controller = new window.aui.nvr.ui.WebAssemblyController({
            object: fragObj,
            sessionKey: new Date().getTime(),
            events: [
              "onchange",
              "onclick",
              "ondblclick",
              "onkeydown",
              "onkeypress",
              "onkeyup",
              "onmousedown",
              "onmousemove",
              "onmouseover",
              "onmouseup",
              "onmouseout",
              "onselect",
              "onsubmit",
              "oncontextmenu",
            ],
            id: mdlid,
          });
          controller.setWebGLAdapter(pvtWebGLAdapterModule);
          // controller.render(
          //   document.getElementsByClassName(`window-No${i}`)[0]
          // );
          // controller.setControlMode("live");
          controller.setConnectionSettings(me.setSettingParameter(1));
          // controller.setWidth(
          //   document.getElementsByClassName(`window-No${i}`)[0].clientWidth
          // );
          // controller.setHeight(
          //   document.getElementsByClassName(`window-No${i}`)[0].clientHeight
          // );
          me.controllers.push(controller);
          // controllers[i].setTitleBarDisplay(false);
        }
        init = true;
        me.allControllers = [...me.controllers];
      }
    }
    async function fetchWebAssembly() {
      await fetch("codebase/FragmentModule.wasm", { cache: "no-cache" })
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const fragmentModule = new window.aui.nvr.WebAssemblyStreamFragment(
            buffer
          );
          fragmentModule.onModuleEvent.subscribe(function (type, args) {
            let eventType = args[0] || "";
            switch (eventType) {
              case "onRuntimeInitialized":
                streamFragment = fragmentModule;
                initializeController();
                break;
              default:
                break;
            }
          });
          window.Fragment(fragmentModule);
          // console.log("fragmentModule", fragmentModule);
        });
      await fetch("codebase/WebGLAdapterModule.wasm", {
        cache: "no-cache",
      })
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const webGLAdapterModule = new window.aui.nvr.WebAssemblyWebGLAdapter(
            buffer
          );
          webGLAdapterModule.onModuleEvent.subscribe(function (type, args) {
            var eventType = args[0] || "";
            switch (eventType) {
              case "onRuntimeInitialized":
                pvtWebGLAdapterModule = webGLAdapterModule;
                initializeController();
                break;
              default:
                break;
            }
          });
          window.WebGLAdapterModule(webGLAdapterModule);
          // console.log("webGLAdapterModule", webGLAdapterModule);
          // console.log("streamFragment", streamFragment);
        });
    }
    fetchWebAssembly();
  }
  componentDidUpdate() {
    const { dbClickDevice, clearDbClickDevice } = this.props;
    if (dbClickDevice != null) {
      const controller = this.controllers.shift();
      this.usedControllers.push(controller);
      controller.connect();
      clearDbClickDevice();
      console.log(this.controllers);
    }
  }

  setTitleBarDisplay() {
    let me = this;
    this.allControllers.forEach((element) => {
      element.setTitleBarDisplay(me.state.titleBarDisplay);
    });
    this.setState({ titleBarDisplay: !this.state.titleBarDisplay });
  }
  setStretchToFit() {
    let me = this;
    this.allControllers.forEach((element) => {
      element.setStretchToFit(me.state.titleBarDisplay);
    });
    this.setState({ stretchToFit: !this.state.stretchToFit });
  }
  DropConnect = (e) => {
    console.log(e.target);
    const controller = this.controllers.shift();

    controller.connect();
    controller.render(e.target);
    controller.setWidth(e.target.clientWidth);
    controller.setHeight(e.target.clientHeight);

    this.usedControllers.push(controller);
  };
  setSettingParameter(cameraID) {
    return {
      Mode: "0",
      MountingType: "",
      account: "admin",
      cameraID: `${cameraID}`,
      command: "",
      fisheyeModule: "-1",
      mode: "live",
      mousePTZ: "1",
      password: "123456",
      printLog: "",
      serverIP: "localhost",
      serverPort: "80",
      setChannel: "1",
      streamID: "1",
      stretchToFit: "true",
    };
  }
  render() {
    const {
      listOpen,
      view,
      onViewChange,
      onToggleList,
      dragDevice,
      clearDragDevice,
    } = this.props;
    return (
      <div className="live-view-body">
        <div className="live-view-header">
          <div className="control-bar-left">
            <div
              className="windows-size"
              onClick={() => {
                onViewChange("x1");
              }}
            >
              <div
                className={`windows-btn windows-x1 ${
                  view === "x1" ? "actived" : ""
                }`}
              ></div>
            </div>
            <div
              className="windows-size"
              onClick={() => {
                onViewChange("x4");
              }}
            >
              <div
                className={`windows-btn windows-x4 ${
                  view === "x4" ? "actived" : ""
                }`}
              ></div>
            </div>
            <div
              className="windows-size"
              onClick={() => {
                onViewChange("x1x5");
              }}
            >
              <div
                className={`windows-btn windows-x1-x5 ${
                  view === "x1x5" ? "actived" : ""
                }`}
              ></div>
            </div>
          </div>
          <div className="control-bar-right">
            <div
              className="settingGear"
              onClick={() => {
                onToggleList(true);
              }}
            ></div>
          </div>
        </div>
        <div
          className="live-view-area"
          onClick={() => {
            onToggleList(false);
          }}
        >
          <div
            className={`nvr-window window-No0 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No1 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No2 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No3 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No4 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No5 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
          ></div>
        </div>
        <div className="live-view-footer">
          <div className="volume-area">
            <div className="volume-icon"></div>
            <div className="volume-block"></div>
          </div>
        </div>
        <div className={`control-list ${listOpen ? "list-Open" : ""}`}>
          <li
            className="list-item switch-stretch"
            onClick={() => {
              this.setStretchToFit();
            }}
          >
            <div className="control-icon"></div>
            <div className="control-text">伸展影像</div>
          </li>
          <li
            className="list-item switch-title-display"
            onClick={() => {
              this.setTitleBarDisplay();
            }}
          >
            <div className="control-icon"></div>
            <div className="control-text">標題欄位</div>
          </li>
          <li
            className="list-item disconnect-all"
            onClick={() => {
              for (let i = 0; i < this.allControllers.length; i++) {
                this.allControllers[i].disconnect();
              }
            }}
          >
            <div className="control-icon"></div>
            <div className="control-text">移除所有頻道</div>
          </li>
        </div>
      </div>
    );
  }
}

const LiveViewBody = connect(
  mapStateToProps,
  mapDispatchToProps
)(LiveViewBodyUI);
export default LiveViewBody;
