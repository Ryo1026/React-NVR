import React from "react";

class EventPanel extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  componentDidMount() {
    const ws = new WebSocket("ws://localhost:80/Media/WebSocket");
    console.log(ws);
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
      // const evt = xml
      //   .getElementsByTagName("Message")[0]
      //   .getElementsByTagName("Event")[0]
      //   .getAttribute("id");
      // switch (evt) {
      //   case "Motion1":
      //     console.log(evt);
      //     break;
      //   default:
      //     break;
      // }
    });
  }
  render() {
    return (
      <div className="event-panel-body">
        <div className="event-panel-title">Event</div>
        <div className="event-panel-list">
          {/* map */}
          <div className="event-item">
            <div className="event-info">
              <div className="event-name">位移偵測 MD 1</div>
              <div className="event-time">2021/10/26 00:00:00</div>
              <div className="devicename">1 ACTi</div>
            </div>
            <div className="event-icon motion1"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default EventPanel;
