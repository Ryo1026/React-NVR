import React from "react";
import { newEvent, focusDeviceId } from "../actions/actionCreator";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return {
    focusDeviceId: state.focusDeviceId,
    eventPanel: state.eventPanel,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onEventReceived: (evtId, time, deviceId) => {
      dispatch(newEvent(evtId, time, deviceId));
    },
    onFocusDevice: (deviceId) => {
      dispatch(focusDeviceId(deviceId));
    },
  };
};

class EventPanelUI extends React.Component {
  constructor() {
    super();
    this.state = {
      listOpen: true,
    };
  }
  componentDidMount() {
    const { onEventReceived } = this.props;
    const ws = new WebSocket("ws://localhost:80/Media/WebSocket");
    // console.log(ws);
    ws.addEventListener("open", function () {
      console.log("websocket連線成功");
      ws.send(`<WebSocket>
        <Header>
          <Command>/Media/Message</Command>
          <Account>admin</Account>
          <Password encrytype="">123456</Password>
        </Header>
        <Body>
        </Body>
      </WebSocket>`);
    });
    ws.addEventListener("message", function (e) {
      const parser = new DOMParser();
      const xml = parser.parseFromString(e.data, "text/xml");
      // 注意 !
      // message事件 第一次回傳的是連線成功的資訊，裡面沒有<Message>所以會報錯 undefined
      // console.log("xml", xml);
      const mes = xml.getElementsByTagName("Message")[0];
      // console.log("mes", mes);
      if (mes) {
        const evtId = xml.getElementsByTagName("Event")[0].getAttribute("id");
        // console.log("evtId", evtId);
        switch (evtId) {
          case "Motion1":
            const timeString = xml
              .getElementsByTagName("Message")[0]
              .getAttribute("Time")
              .replace(".", ""); // 取得事件時間 <Message>中的屬性
            const time = new Date(parseInt(timeString)); // 轉整數
            // Format時間 年/月/日 時:分:秒
            const timeFormat = `${time.getFullYear()}/${
              time.getMonth() + 1
            }/${time.getDate()} ${
              time.getHours().toString().length === 1
                ? "0" + time.getHours()
                : time.getHours()
            }:${
              time.getMinutes().toString().length === 1
                ? "0" + time.getMinutes()
                : time.getMinutes()
            }:${
              time.getSeconds().toString().length === 1
                ? "0" + time.getSeconds()
                : time.getSeconds()
            }`;
            // dispatch 新事件
            onEventReceived(evtId, timeFormat, 1); // deviceId
            break;
          default:
            break;
        }
      }
    });
  }
  render() {
    const { eventPanel, focusDeviceId, onFocusDevice } = this.props;
    return (
      <div className="event-panel-body">
        <div
          className="event-panel-title"
          onClick={() => {
            this.setState({ listOpen: !this.state.listOpen });
          }}
        >
          Event
        </div>
        <div
          className={`event-panel-list ${this.state.listOpen ? "" : "hide"}`}
        >
          {eventPanel.map((v, i) => {
            return (
              <div
                className={`event-item ${
                  focusDeviceId === 0 ? "selected" : ""
                }`}
                key={i}
                onClick={() => {
                  onFocusDevice(0);
                }}
              >
                <div className="event-info">
                  <div className="event-name">
                    {v.evtId === "Motion1" ? "MD 1" : ""}
                  </div>
                  <div className="event-time">{v.time}</div>
                  <div className="devicename">1 ACTi</div>
                </div>
                <div className="event-icon motion1"></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

const EventPanel = connect(mapStateToProps, mapDispatchToProps)(EventPanelUI);
export default EventPanel;
