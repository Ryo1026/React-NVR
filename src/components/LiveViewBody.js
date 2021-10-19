import React, { Fragment } from "react";
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
    async function fetchWebAssembly() {
      await fetch("codebase/FragmentModule.wasm", { cache: "no-cache" })
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const fragmentModule = new window.aui.nvr.WebAssemblyStreamFragment(
            buffer
          );
          window.Fragment(fragmentModule);
          console.log("fragmentModule", fragmentModule);

          // const fragObj = fragmentModule.createFragmentObject(1);
          // console.log(fragObj);
          // const controller = new window.aui.nvr.ui.WebAssemblyController({
          //   object: fragObj,
          //   sessionKey: new Date().getTime(),
          // });
        });
      await fetch("codebase/WebGLAdapterModule.wasm", {
        cache: "no-cache",
      })
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const webGLAdapterModule = new window.aui.nvr.WebAssemblyWebGLAdapter(
            buffer
          );
          console.log("webGLAdapterModule", webGLAdapterModule);
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
