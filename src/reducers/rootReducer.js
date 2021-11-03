const initStore = {
  folderOpen: true,
  listOpen: false,
  focusDeviceId: null,
  devicesInfo: [],
  eventPanel: [],
  view: "x1x5",
  dragState: false,
};

const rootReducer = (state = initStore, action) => {
  switch (action.type) {
    case "TOGGLE_FOLDER":
      return { ...state, folderOpen: !state.folderOpen };
    case "TOGGLE_LIST":
      return { ...state, listOpen: action.listOpen };
    case "FOCUS":
      return { ...state, focusDeviceId: action.deviceId };
    case "GET_DEVICES":
      return { ...state, devicesInfo: action.devicesInfo };
    case "DRAG":
      return { ...state, dragState: action.dragState };
    case "CHANGE_VIEW":
      return { ...state, view: action.view };
    case "RECEIVED_EVENT":
      // console.log([...state.eventPanel].push(action.newEvent));
      // 直接push會得到push這個方法return的值
      if (state.eventPanel.length < 300) {
        return {
          ...state,
          eventPanel: [action.newEvent, ...state.eventPanel],
        };
      } else {
        const limitEvtArr = [...state.eventPanel];
        limitEvtArr.pop();
        return {
          ...state,
          eventPanel: [action.newEvent, ...limitEvtArr],
        };
      }
    default:
      return state;
  }
};

export default rootReducer;
