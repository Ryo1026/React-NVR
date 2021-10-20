import React from "react";
import { changeView } from "../actions/actionCreator";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return { view: state.view };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onViewChange: (view) => {
      dispatch(changeView(view));
    },
  };
};

class LiveViewBodyUI extends React.Component {
  componentDidMount() {
    let streamFragment = null;
    let pvtWebGLAdapterModule = null;
    let controllers = [];
    let init = false;
    function initializeController() {
      if (!init && streamFragment != null && pvtWebGLAdapterModule != null) {
        for (let i = 0; i < 6; i++) {
          let mdlid = i + 1;
          const fragObj = streamFragment.createFragmentObject(mdlid);
          fragObj.createWorker(
            streamFragment.URL_FRAGWORKER + "?v=" + new Date().getTime()
          );
          controllers[i] = new window.aui.nvr.ui.WebAssemblyController({
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
          // controller.push(controller1);
          controllers[i].setWebGLAdapter(pvtWebGLAdapterModule);
          controllers[i].render(
            document.getElementsByClassName(`window-No${i}`)[0]
          );
          controllers[i].setControlMode("live");
          controllers[i].setConnectionSettings({
            Mode: "0",
            MountingType: "",
            account: "admin",
            cameraID: "1",
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
          });
          // controllers[i].connect();
          // controllers[i].setWidth(
          //   document.getElementsByClassName(`window-No${i}`)[0].clientWidth
          // );
          // controllers[i].setHeight(
          //   document.getElementsByClassName(`window-No${i}`)[0].clientHeight
          // );
          // controllers[i].setTitleBarDisplay(false);
        }
        init = true;
        console.log(controllers);
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
  render() {
    const { view, onViewChange } = this.props;
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
            <div className="settingGear"></div>
          </div>
        </div>
        <div className="live-view-area">
          <div
            className={`nvr-window window-No0 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
          ></div>
          <div
            className={`nvr-window window-No1 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
          ></div>
          <div
            className={`nvr-window window-No2 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
          ></div>
          <div
            className={`nvr-window window-No3 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
          ></div>
          <div
            className={`nvr-window window-No4 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
          ></div>
          <div
            className={`nvr-window window-No5 ${view === "x1" ? "x1" : ""} ${
              view === "x4" ? "x4" : ""
            }`}
          ></div>
        </div>
        <div className="live-view-footer">
          <div className="volume-area">
            <div className="volume-icon"></div>
            <div className="volume-block"></div>
          </div>
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
