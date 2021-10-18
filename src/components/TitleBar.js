import React from "react";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return {
    focusDeviceId: state.focusDeviceId,
    devicesInfo: state.devicesInfo[state.focusDeviceId],
  };
};

class TitleBarUI extends React.Component {
  render() {
    const { focusDeviceId, devicesInfo } = this.props;
    if (!devicesInfo) {
      return <div className="aui-titlebar"></div>;
    } else if (devicesInfo && focusDeviceId === -1) {
      return <div className="aui-titlebar"></div>;
    } else {
      return (
        <div className="aui-titlebar">{`${focusDeviceId + 1} ${
          devicesInfo.name
        }`}</div>
      );
    }
  }
}

const TitleBar = connect(mapStateToProps)(TitleBarUI);
export default TitleBar;
