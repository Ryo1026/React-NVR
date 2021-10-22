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
    view: state.view,
    dbClickDevice: state.dbClickDevice,
    listOpen: state.listOpen,
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
    this.liveView = [];
    this.state = {
      titleBarDisplay: false,
      stretchToFit: true,
      enableAudioIn: false,
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
          // controller.setControlMode("live");
          controller.setConnectionSettings(me.setSettingParameter(1));
          me.controllers.push(controller);
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

      // 選出要用來放controller的nvr-window(空的)
      const nvrWindows = document.getElementsByClassName("nvr-window");
      let showdbclickView = null;
      for (let i = 0; i < nvrWindows.length; i++) {
        if (nvrWindows[i].childNodes[0] === undefined) {
          showdbclickView = nvrWindows[i];
          break;
        }
      }
      controller.render(showdbclickView);
      controller.setWidth(showdbclickView.clientWidth);
      controller.setHeight(showdbclickView.clientHeight);
      // console.log(showdbclickView);

      // 儲存controller與對應的render window
      this.liveView.push({
        controller: controller,
        nvrWindow: showdbclickView,
      });
      clearDbClickDevice();
    }
    // Rerender時 重新設定每個controller大小符合容器
    for (let i = 0; i < this.liveView.length; i++) {
      // console.log(this.liveView);
      this.liveView[i].controller.setWidth(
        this.liveView[i].nvrWindow.clientWidth
      );
      this.liveView[i].controller.setHeight(
        this.liveView[i].nvrWindow.clientHeight
      );
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
  setEnableAudioIn() {
    let me = this;
    this.allControllers.forEach((element) => {
      element.enableAudioIn(me.state.enableAudioIn);
    });
    this.setState({ enableAudioIn: !this.state.enableAudioIn });
  }
  DropConnect = (e) => {
    // console.log(e.target);
    const controller = this.controllers.shift();

    controller.connect();
    controller.render(e.target);
    controller.setWidth(e.target.clientWidth);
    controller.setHeight(e.target.clientHeight);

    this.usedControllers.push(controller);

    this.liveView.push({
      controller: controller,
      nvrWindow: e.target,
    });
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
            <div
              className={`volume-icon ${
                this.state.enableAudioIn ? "" : "mute"
              }`}
              onClick={() => {
                this.setEnableAudioIn();
              }}
            ></div>
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
              for (let i = 0; i < this.liveView.length; i++) {
                this.liveView[i].nvrWindow.removeChild(
                  this.liveView[i].nvrWindow.firstChild
                );
                this.liveView[i].controller.disconnect();
                this.controllers.push(this.liveView[i].controller);
              }
              this.usedControllers = [];
              this.liveView = [];
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
