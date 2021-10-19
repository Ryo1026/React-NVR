aui.nvr.ui.AppControlPanel = function(options) {
    this.options = {
        className: "aui-nvr-ui-AppControlPanel"
    };
    this.options = aui.lang.merge(this.options, options || {});
    
    this.className = this.options.className;

    var fisheyeMountingTypeOptions = [
        { caption: "Wall", value: "0" },
        { caption: "Ceiling", value: "1" },
        { caption: "Ground", value: "2" }
    ];

    var fisheyeModeOptions = [
        { caption: "Original View", value: "0" },
        { caption: "Dewarping", value: "1" },
        { caption: "Panorama", value: "2" },
        { caption: "DoublePanorama", value: "3" },
        { caption: "PanoramaFocus", value: "4" },
        { caption: "Quad", value: "5" }
    ];

    // Private variables
    this.pvtControlItems = {
        "mode": { type: "select", caption: "Mode：", options: [{ caption: "Live", value: "live" }, { caption: "Playback", value: "playback" }], default: "live", onchange: "onModeChanged" },
        "serverIP": { type: "text", caption: "Server IP：", default: "localhost" },
        "serverPort": { type: "text", caption: "Server Port：", default: "8153" },
        "account": { type: "text", caption: "Account：", default: "admin" },
        "password": { type: "text", caption: "Password：", default: "123456" },
        "cameraID": { type: "text", caption: "Camera ID：", default: "2" },
        "streamID": { type: "text", caption: "Stream ID：", default: "1" },
        "stretchToFit": { type: "select", caption: "StretchToFit：", options: [{ caption: "True", value: true }, { caption: "False", value: false }], default: true, onchange: "onStretchChanged" },
        "connect": { type: "button", caption: "Connect", onclick: "onButtonClicked" },
        "disconnect": { type: "button", caption: "Disconnect", onclick: "onButtonClicked" },
        "mute": { type: "button", caption: "Mute", onclick: "onButtonClicked" },
        "unmute": { type: "button", caption: "Unmute", onclick: "onButtonClicked" },
        "decodeI": { type: "button", caption: "DecodeI", onclick: "onButtonClicked" },
        "noDecodeI": { type: "button", caption: "No DecodeI", onclick: "onButtonClicked" },
        "resetAudio": { type: "button", caption: "Reset Audio", onclick: "onButtonClicked" },
        "setChannel": {
            type: "select", caption: "Channel：", options: [
                { caption: "1", value: "1" }, { caption: "4", value: "4" }, { caption: "9", value: "9" }, { caption: "12", value: "12" }, { caption: "16", value: "16" }, 
            ], default: "1", onchange: "onChannelChanged"
        },
        "fisheyeModule": { type: "select", caption: "FisheyeModule：", options: [{ caption: "Not fisheye", value: "-1" }, { caption: "B511", value: "23" }], default: "-1", onchange: "onFisheyeModuleChanged" },
        "MountingType": { type: "select", caption: "MountingType：", options: fisheyeMountingTypeOptions, onchange: "onFisheyeMountingTypeChanged" },
        "Mode": { type: "select", caption: "Mode：", options: fisheyeModeOptions, default: "0", onchange: "onFisheyeModeChanged" },
        "mousePTZ": {
            type: "select", caption: "PTZ：", options: [
                { caption: "MousePTZ", value: "1" }, { caption: "PixelPTZ", value: "2" }, { caption: "DigitalPTZ", value: "3" }, { caption: "FisheyePTZ", value: "4" }
            ], default: "1", onchange: "onMousePTZChanged"
        },
        //PLayback
        "playbackTime": { type: "date-and-time", caption: "Playback Current Time：", default: "" },
        "setCurrentTime": { type: "button", caption: "Set Current Time", onclick: "onButtonClicked" },
        "playRate": {
            type: "select", caption: "Play Rate：", options: [
                { caption: "1/16x", value: "0.0625" }, { caption: "1/8x", value: "0.125" }, { caption: "1/4x", value: "0.25" }, { caption: "1/2x", value: "0.5" },
                { caption: "1x", value: "1" },
                { caption: "2x", value: "2" }, { caption: "4x", value: "4" }, { caption: "8x", value: "8" }, { caption: "16x", value: "16" },
                { caption: "F", value: "0" }
            ], default: "1", onchange: "onPlayRateChanged"
        },
        "rewind": { type: "button", caption: "Rewind", onclick: "onButtonClicked" },
        "pause": { type: "button", caption: "Pause", onclick: "onButtonClicked" },
        "play": { type: "button", caption: "Play", onclick: "onButtonClicked" },
        "command": { type: "long-text", caption: "Test Command (GET Method)：", default: "" },
        "testCommand": { type: "button", caption: "Test Command", onclick: "onButtonClicked" },
        "printLog": { type: "div", caption: "log:", default: ""}
    };

    this.pvtModeItems = {
        "live": [
            "mode", "serverIP", "serverPort", "account", "password", "cameraID", "streamID", "stretchToFit", "connect", "disconnect",
            "mute", "unmute", "decodeI", "noDecodeI", "resetAudio", "command", "testCommand", "setChannel",
            "fisheyeModule", "MountingType", "Mode",
            "mousePTZ",
            "printLog",
        ],
        "playback": [
            "mode", "serverIP", "serverPort", "account", "password", "cameraID", "streamID", "stretchToFit", "connect", "disconnect",
            "mute", "unmute", "decodeI", "noDecodeI", "resetAudio", /*"command", "testCommand",*/ "setChannel", "fisheyeModule", "MountingType", "Mode", "printLog",
            "playbackTime", "setCurrentTime", "playRate", "rewind", "play", "pause",
        ]
    };
    this.pvtMode = "live";
    
    this.onModeChanged = new aui.lang.util.CustomEvent("onModeChanged", this);
    this.onStretchChanged = new aui.lang.util.CustomEvent("onStretchChanged", this);
    this.onButtonClicked = new aui.lang.util.CustomEvent("onButtonClicked", this);
    this.onPlayRateChanged = new aui.lang.util.CustomEvent("onPlayRateChanged", this);
    this.onMousePTZChanged = new aui.lang.util.CustomEvent("onMousePTZChanged", this);
    this.onChannelChanged = new aui.lang.util.CustomEvent("onChannelChanged", this);
    this.onFisheyeModuleChanged = new aui.lang.util.CustomEvent("onFisheyeModuleChanged", this);
    this.onFisheyeMountingTypeChanged = new aui.lang.util.CustomEvent("onFisheyeMountingTypeChanged", this);
    this.onFisheyeModeChanged = new aui.lang.util.CustomEvent("onFisheyeModeChanged", this);

    aui.nvr.ui.AppControlPanel.superclass.constructor.call(this, options);
};

aui.lang.Class.extend(aui.nvr.ui.AppControlPanel, aui.ui.ControlBase, {
    prepareNode: function(nodeToAppend) {
        var me = this;
        nodeToAppend.className = me.className;

        for (var i in me.pvtControlItems) {
            var type = me.pvtControlItems[i].type;
            var caption = me.pvtControlItems[i].caption || "";
            var defaultValue = me.pvtControlItems[i].default || "";
            var selectOptions = me.pvtControlItems[i].options || "";
            var div = NewObj("div", "row");
            var onchangeEventName = me.pvtControlItems[i].onchange || "";
            var onclickEventName = me.pvtControlItems[i].onclick || "";
            
            me.pvtControlItems[i].div = div;
            me.pvtControlItems[i].input = null;
            me.pvtControlItems[i].inputs = null;

            switch (type) {
                case "select":
                    if (caption) div.appendChild(NewObj("div", "caption", caption));
                    me.pvtControlItems[i].input = NewObj("select", "input-select");
                    var op = null;
                    for (var j = 0, l = selectOptions.length; j < l; j++) {
                        op = NewObj("option", "", selectOptions[j].caption);
                        op.value = selectOptions[j].value;

                        me.pvtControlItems[i].input.appendChild(op);
                    }
                    me.pvtControlItems[i].input.value = defaultValue;

                    if (onchangeEventName) {
                        me.pvtControlItems[i].input.onchange = function (eventName) {
                            return function() {
                                if (me[eventName]) {
                                    me[eventName].fire(this.value);
                                }
                            };
                        }(onchangeEventName);
                    }
                    break;
                case "text":
                case "long-text":
                    if (caption) div.appendChild(NewObj("div", "caption", caption));
                    me.pvtControlItems[i].input = NewObj("input", "input-" + type);
                    me.pvtControlItems[i].input.type = type;
                    me.pvtControlItems[i].input.value = defaultValue;
                    break;
                case "div":
                    if (caption) div.appendChild(NewObj("div", "caption", caption));
                    me.pvtControlItems[i].input = NewObj("div", "output-div");
                    me.pvtControlItems[i].input.type = type;
                    me.pvtControlItems[i].input.value = defaultValue;
                    break;
                case "date-and-time":
                    if (caption) div.appendChild(NewObj("div", "caption", caption));
                     me.pvtControlItems[i].inputs = {
                         "date": null,
                         "time": null
                     };
                    for (var j in me.pvtControlItems[i].inputs) {
                        me.pvtControlItems[i].inputs[j] = NewObj("input", "input-text");
                        me.pvtControlItems[i].inputs[j].type = j;
                        me.pvtControlItems[i].inputs[j].step = 1;
                    }
                    break;
                case "button":
                    me.pvtControlItems[i].input = NewObj("button", "input-btn " + i, caption);
                    if (onclickEventName) {
                        me.pvtControlItems[i].input.onclick = function (eventName, btnType) {
                            return function() {
                                if (me[eventName]) {
                                    me[eventName].fire(btnType);
                                }
                            }
                        }(onclickEventName, i);
                    }
                    break;
            }

            if (me.pvtControlItems[i].input) {
                div.appendChild(me.pvtControlItems[i].input);
            } else if (me.pvtControlItems[i].inputs) {
                for (var j in me.pvtControlItems[i].inputs) {
                    div.appendChild(me.pvtControlItems[i].inputs[j]);
                }
            }

            nodeToAppend.appendChild(div);
        }

        var mode = (me.pvtControlItems["mode"] && me.pvtControlItems["mode"].input) ? (me.pvtControlItems["mode"].input.value || "live") : "live";
        me.updateMode(mode);
    },

    setEnable: function(isEnable) {
        aui.nvr.ui.AppControlPanel.superclass.setEnable.call(this, isEnable);

        var me = this;
        for (var i in me.pvtControlItems) {
            if (me.pvtControlItems[i].input) {
                me.pvtControlItems[i].input.disabled = !isEnable;
            } else if (me.pvtControlItems[i].inputs) {
                for (var j in me.pvtControlItems[i].inputs) {
                    me.pvtControlItems[i].inputs[j].disabled = !isEnable;
                }
            }
        }
    },

    updateMode: function(mode) {
        var me = this;
        
        me.pvtMode = mode || "live";
        if (me.pvtModeItems[mode]) {
            for (var i in me.pvtControlItems) {
                if (!me.pvtControlItems[i] || !me.pvtControlItems[i].div) continue;

                if (me.pvtModeItems[mode].indexOf(i) >= 0) {
                    me.pvtControlItems[i].div.className = "row";
                } else {
                    me.pvtControlItems[i].div.className = "row hide";
                }
            }

            if (mode == "playback") {
                var now = new Date();
                me.pvtControlItems["playbackTime"].inputs["date"].value = aui.lang.Date.format(now, "%Y-%m-%d");
                me.pvtControlItems["playbackTime"].inputs["time"].value = aui.lang.Date.format(now, "%H:%i:%s");
            }
        }
    },

    getData: function () {
        var me = this;

        var modeItems = me.pvtModeItems[me.pvtMode] || [];
        var data = {};
        var type, input, inputs;
        for (var i in me.pvtControlItems) {
            type = me.pvtControlItems[i].type;
            input = me.pvtControlItems[i].input;
            inputs = me.pvtControlItems[i].inputs;

            if (type == "button" || (!input && !inputs)) continue;
            if (modeItems.indexOf(i) < 0) continue;

            if (input) {
                data[i] = input.value;
            } else if (inputs) {
                if (i == "playbackTime") {
                    ////Safari do not support same format of string style
                    //var datetime = new Date(inputs["date"].value + " " + inputs["time"].value);
                    let sDate = inputs["date"].value.split("-");
                    let sTime = inputs["time"].value.split(":");
                    //Google Chrome will ignore when seconds is 0
                    if (!sTime[2]) {
                        sTime[2] = "00";
                    }
                    var datetime = new Date(sDate[0], (sDate[1] - 1), sDate[2], sTime[0], sTime[1], sTime[2]);
                    data[i] = datetime.getTime();
                }
            }
        }

        return data;
    },

    printLog: function (mesg) {
        var me = this;

        var span = document.createElement("span");
        span.innerText = mesg;

        me.pvtControlItems["printLog"].input.appendChild(span);
    },

    clearPrintLog: function () {
        var me = this;

        let count = me.pvtControlItems["printLog"].input.childNodes.length;
        for (var i = 0; i < count; i++) {
            me.pvtControlItems["printLog"].input.removeChild(me.pvtControlItems["printLog"].input.childNodes[0]);
        }
    }
});