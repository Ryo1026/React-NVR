const initStore = {
  folderOpen: true,
  focusDeviceId: null,
  devicesInfo: [],
  dragDevice: "",
  view: "x1x5",
};

const rootReducer = (state = initStore, action) => {
  switch (action.type) {
    case "TOGGLE_FOLDEER":
      return { ...state, folderOpen: !state.folderOpen };
    case "FOCUS":
      return { ...state, focusDeviceId: action.deviceId };
    case "GET_DEVICES":
      return { ...state, devicesInfo: action.devicesInfo };
    case "DRAG_DEVICE":
      return { ...state, dragDevice: action.deviceName };
    case "CHANGE_VIEW":
      return { ...state, view: action.view };
    default:
      return state;
  }
};

export default rootReducer;
