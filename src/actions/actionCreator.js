export function toggleFolder() {
  return { type: "TOGGLE_FOLDEER" };
}

export function focusDeviceId(id) {
  return { type: "FOCUS", deviceId: id };
}

export function getDevices(devicesInfo) {
  return { type: "GET_DEVICES", devicesInfo: devicesInfo };
}
