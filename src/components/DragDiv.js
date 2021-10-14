import React from "react";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return { dragDevice: state.dragDevice };
};

class DragDivUI extends React.Component {
  render() {
    const { dragDevice } = this.props;

    return (
      <div id="dragDiv" className={dragDevice ? "" : "hidden"}>
        {dragDevice}
      </div>
    );
  }
}

const DragDiv = connect(mapStateToProps)(DragDivUI);
export default DragDiv;
