export function toggleFolder() {
  return { type: "TOGGLE_FOLDER" };
}

export function toggleList(boolean) {
  return { type: "TOGGLE_LIST", listOpen: boolean };
}

export function focusDeviceId(id) {
  return { type: "FOCUS", deviceId: id };
}

export function dbClickDevice(id) {
  return { type: "DBCLICK_DEVICE", deviceId: id };
}

export function getDevices(devicesInfo) {
  return { type: "GET_DEVICES", devicesInfo: devicesInfo };
}

export function dragDevice(deviceName) {
  return { type: "DRAG_DEVICE", deviceName: deviceName };
}

export function changeView(view) {
  return { type: "CHANGE_VIEW", view: view };
}
