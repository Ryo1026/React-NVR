export function toggleFolder() {
  return { type: "TOGGLE_FOLDER" };
}

export function toggleList(boolean) {
  return { type: "TOGGLE_LIST", listOpen: boolean };
}

export function focusDeviceId(id) {
  return { type: "FOCUS", deviceId: id };
}

export function getDevices(devicesInfo) {
  return { type: "GET_DEVICES", devicesInfo: devicesInfo };
}

export function toggleDragState(boolean) {
  return { type: "DRAG", dragState: boolean };
}

export function changeView(view) {
  return { type: "CHANGE_VIEW", view: view };
}

export function newEvent(evtId, time, deviceId) {
  return {
    type: "RECEIVED_EVENT",
    newEvent: { evtId: evtId, time: time, deviceId: deviceId },
  };
}
