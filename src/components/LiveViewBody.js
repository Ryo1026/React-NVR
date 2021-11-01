import React from "react";
import {
  changeView,
  dbClickDevice,
  focusDeviceId,
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
    focusDeviceId: state.focusDeviceId,
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
    setFocusDeviceId: (deviceId) => {
      dispatch(focusDeviceId(deviceId));
    },
  };
};

class LiveViewBodyUI extends React.Component {
  constructor() {
    super();
    this.controllers = []; // 未使用的Controllers
    this.usedControllers = []; // 使用中的Controllers
    this.liveView = []; // 配對已連線的Controller與nvr-window div
    this.nvrWindows = [];
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
    //  Build nvrWindows 陣列
    const windowArr = document.getElementsByClassName("nvr-window");
    for (let i = 0; i < windowArr.length; i++) {
      const perNvrWindow = {
        window: windowArr[i],
        focusState: false,
        controllerId: null,
      };
      this.nvrWindows.push(perNvrWindow);
    }
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
          const controllerObj = {
            id: mdlid,
            controller: controller,
            isUsing: false,
          };
          me.controllers.push(controllerObj);
        }
        init = true;
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
    const {
      view,
      dbClickDevice,
      clearDbClickDevice,
      focusDeviceId,
      onViewChange,
    } = this.props;

    // dbclick 觸發controller連線並render到nvrWindow
    if (dbClickDevice != null) {
      for (let i = 0; i < this.controllers.length; i++) {
        // 挑出未使用的controller
        if (!this.controllers[i].isUsing) {
          for (let j = 0; j < this.nvrWindows.length; j++) {
            // 挑出未使用的 nvrWindow
            if (this.nvrWindows[j].controllerId === null) {
              this.controllers[i].controller.connect();
              this.controllers[i].controller.render(this.nvrWindows[j].window);
              this.controllers[i].controller.setWidth(
                this.nvrWindows[j].window.clientWidth
              );
              this.controllers[i].controller.setHeight(
                this.nvrWindows[j].window.clientHeight
              );
              // 切換Layout
              if (view === "x1" && this.nvrWindows[0].controllerId) {
                onViewChange("x4");
              } else if (
                view === "x1" &&
                this.nvrWindows[j].window.classList[1] === "window-No1"
              ) {
                onViewChange("x4");
              }
              if (view === "x4" && this.nvrWindows[3].controllerId) {
                onViewChange("x1x5");
              } else if (
                view === "x4" &&
                this.nvrWindows[j].window.classList[1] === "window-No4"
              ) {
                onViewChange("x1x5");
              }
              // 儲存 controller的Id 到 nvrWindow
              this.nvrWindows[j].controllerId = this.controllers[i].id;
              break;
            }
          }
          // 設定 controller 狀態為使用中
          this.controllers[i].isUsing = true;
          break;
        }
      }
      clearDbClickDevice();
    }

    for (let i = 0; i < this.nvrWindows.length; i++) {
      if (this.nvrWindows[i].focusState) {
        this.nvrWindows[i].window.classList.add("selected");
      } else {
        this.nvrWindows[i].window.classList.remove("selected");
      }
    }

    // Rerender時 重新設定每個controller大小符合容器
    for (let i = 0; i < this.nvrWindows.length; i++) {
      if (this.nvrWindows[i].controllerId !== null) {
        for (let j = 0; j < this.controllers.length; j++) {
          if (this.nvrWindows[i].controllerId === this.controllers[j].id) {
            this.controllers[j].controller.setWidth(
              this.nvrWindows[i].window.clientWidth
            );
            this.controllers[j].controller.setHeight(
              this.nvrWindows[i].window.clientHeight
            );
          }
        }
      }
    }
    switch (focusDeviceId) {
      case 0:
        this.nvrWindows.forEach((element) => {
          if (element.controllerId !== null) {
            element.window.classList.add("selected");
            element.focusState = true;
          }
        });
        break;
      case null:
        this.nvrWindows.forEach((element) => {
          element.window.classList.remove("selected");
          element.focusState = false;
        });
        break;
      default:
        break;
    }
  }
  setTitleBarDisplay() {
    let me = this;
    this.controllers.forEach((element) => {
      element.controller.setTitleBarDisplay(me.state.titleBarDisplay);
    });
    this.setState({ titleBarDisplay: !this.state.titleBarDisplay });
  }
  setStretchToFit() {
    let me = this;
    this.controllers.forEach((element) => {
      element.controller.setStretchToFit(me.state.titleBarDisplay);
    });
    this.setState({ stretchToFit: !this.state.stretchToFit });
  }
  setEnableAudioIn() {
    let me = this;
    this.controllers.forEach((element) => {
      element.controller.enableAudioIn(me.state.enableAudioIn);
    });
    this.setState({ enableAudioIn: !this.state.enableAudioIn });
  }
  DropConnect = (e) => {
    // console.log(e.target);
    for (let i = 0; i < this.controllers.length; i++) {
      if (this.controllers[i].isUsing === false) {
        this.controllers[i].controller.connect();
        this.controllers[i].controller.render(e.target);
        this.controllers[i].controller.setWidth(e.target.clientWidth);
        this.controllers[i].controller.setHeight(e.target.clientHeight);
        for (let j = 0; j < this.nvrWindows.length; j++) {
          if (e.target === this.nvrWindows[j].window) {
            this.nvrWindows[j].controllerId = this.controllers[i].id;
            this.nvrWindows[j].focusState = true;
            this.nvrWindows[j].window.classList.add("selected");
            break;
          }
        }
        this.controllers[i].isUsing = true;
        break;
      }
    }
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
      setFocusDeviceId,
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
            className={`nvr-window window-No0 ${view === "x1" ? "x1" : ""}${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
            onClick={(e) => {
              // 先判斷點到的是canvas還是nvrWindow
              if (e.target.classList.length !== 0) {
                // !==0 表示點到空的nvrWindow，移除所有點選狀態
                for (let i = 0; i < this.nvrWindows.length; i++) {
                  this.nvrWindows[i].window.classList.remove("selected");
                }
                e.target.classList.add("selected"); // 新增點選狀態
                setFocusDeviceId(null); // 清空Focus狀態
              } else {
                // 點到canvas的情況
                setFocusDeviceId(0);
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No1 ${view === "x1" ? "x1" : ""}${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
            onClick={(e) => {
              if (e.target.classList.length !== 0) {
                for (let i = 0; i < this.nvrWindows.length; i++) {
                  this.nvrWindows[i].window.classList.remove("selected");
                }
                e.target.classList.add("selected");
                setFocusDeviceId(null);
              } else {
                setFocusDeviceId(0);
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No2 ${view === "x1" ? "x1" : ""}${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
            onClick={(e) => {
              if (e.target.classList.length !== 0) {
                for (let i = 0; i < this.nvrWindows.length; i++) {
                  this.nvrWindows[i].window.classList.remove("selected");
                }
                e.target.classList.add("selected");
                setFocusDeviceId(null);
              } else {
                setFocusDeviceId(0);
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No3 ${view === "x1" ? "x1" : ""}${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
            onClick={(e) => {
              if (e.target.classList.length !== 0) {
                for (let i = 0; i < this.nvrWindows.length; i++) {
                  this.nvrWindows[i].window.classList.remove("selected");
                }
                e.target.classList.add("selected");
                setFocusDeviceId(null);
              } else {
                setFocusDeviceId(0);
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No4 ${view === "x1" ? "x1" : ""}${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
            onClick={(e) => {
              if (e.target.classList.length !== 0) {
                for (let i = 0; i < this.nvrWindows.length; i++) {
                  this.nvrWindows[i].window.classList.remove("selected");
                }
                e.target.classList.add("selected");
                setFocusDeviceId(null);
              } else {
                setFocusDeviceId(0);
              }
            }}
          ></div>
          <div
            className={`nvr-window window-No5 ${view === "x1" ? "x1" : ""}${
              view === "x4" ? "x4" : ""
            }`}
            onMouseUp={(e) => {
              if (dragDevice) {
                this.DropConnect(e);
                clearDragDevice();
              }
            }}
            onClick={(e) => {
              if (e.target.classList.length !== 0) {
                for (let i = 0; i < this.nvrWindows.length; i++) {
                  this.nvrWindows[i].window.classList.remove("selected");
                }
                e.target.classList.add("selected");
                setFocusDeviceId(null);
              } else {
                setFocusDeviceId(0);
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
              onToggleList(false);
            }}
          >
            <div className="control-icon"></div>
            <div className="control-text">
              {this.state.stretchToFit ? "不伸展影像" : "伸展影像"}
            </div>
          </li>
          <li
            className="list-item switch-title-display"
            onClick={() => {
              this.setTitleBarDisplay();
              onToggleList(false);
            }}
          >
            <div className="control-icon"></div>
            <div className="control-text">
              {this.state.titleBarDisplay ? "顯示標題欄位" : "隱藏標題欄位"}
            </div>
          </li>
          <li
            className="list-item disconnect-all"
            onClick={() => {
              for (let i = 0; i < this.liveView.length; i++) {
                this.liveView[i].nvrWindow.removeChild(
                  this.liveView[i].nvrWindow.firstChild
                );
                this.liveView[i].nvrWindow.classList.remove("selected");
                this.liveView[i].controller.disconnect();
                this.controllers.push(this.liveView[i].controller);
              }
              this.usedControllers = [];
              this.liveView = [];
              setFocusDeviceId(null);
              onToggleList(false);
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
