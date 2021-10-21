const initStore = {
  folderOpen: true,
  listOpen: false,
  focusDeviceId: null,
  dbClickDevice: null,
  devicesInfo: [],
  dragDevice: "",
  view: "x1x5",
};

const rootReducer = (state = initStore, action) => {
  switch (action.type) {
    case "TOGGLE_FOLDER":
      return { ...state, folderOpen: !state.folderOpen };
    case "TOGGLE_LIST":
      return { ...state, listOpen: action.listOpen };
    case "FOCUS":
      return { ...state, focusDeviceId: action.deviceId };
    case "DBCLICK_DEVICE":
      return { ...state, dbClickDevice: action.deviceId };
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
