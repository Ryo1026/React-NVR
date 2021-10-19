/**
 * aui.nvr.ui.WebAssemblyController
 * @param {object} options
 */
aui.nvr.ui.WebAssemblyController = function (options) {
    this.options = {
        className: "aui-nvr-ui-WebAssemblyController",
        //Player
        width: 280, //320   //260
        height: 210,   //235    //120
        object: null,
        //Control
        maxDelay: 1,            // 最大延遲時間 sec
        minAudioDelay: 0.3,     // 最小音訊延遲時間 sec
        validDiffSec: 0.3,      // 延遲容許值 sec
        sessionKey: "",
        id: 0
    };
    this.options = aui.lang.merge(this.options, options || {});

    this.className = this.options.className;

    this.pvtTitleBarConfig = {
        enable: true,
        height: 16
    };

    this.pvtVideoDisplayRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };

    this.pvtStretchToFit = true;

    this.pvtDebug = true;//aui.debug;
    this.pvtElements = {
        "Audio": null,                  // HTML5 Audio
        "Video": null,                  // HTML5 Video
        "VideoCanvas": null,            // HTML5 Canvas
        "Image": null,                  // JPEG image
        "DebugMessage": null
    };
    this.pvtCurCodec = null;
    this.pvt2DCanvasContext = null;
    this.pvtDrawRequestID = null;       // for draw canvas request

    this.pvtStreamFragment = null;       // WebAssembly Fragment
    this.pvtStreamFragmentObject = null; // WebAssembly Fragment Object

    this.pvtMediaData = {
        "Audio": null,                  // aui.data.WebAssemblyMultimedia
        "Video": null                   // aui.data.WebAssemblyMultimedia
    };
    this.pvtPlayerData = {
        debugHardwareDecodeForce: false,
        working: false,
        syncPlay: true
    };
    this.pvtConnectionSettings = null;
    this.pvtControlMode = "live";
    this.pvtLiveAuthXML = "";

    this.pvtConfigure = {
        muted: true,
        decodeIOnly: false,
        directOuptut: false,
        paused: false,
        debugNoAudio: false,
        debugNoVideo: false
    };
    this.pvtControls = {
        videoRestart: false,
        audioRestart: false
    };

    this.pvtSessionKey = this.options.sessionKey;
    this.pvtTimeCode = null;    // sec

    this.pvtCheckLiveTimer = null;  // check draw black when live
    this.pvtIsEmptyFrame = true;
    this.pvtFisheyeConfig = {
        enable: false,
        subwindowEnable: false,
        mode: -1,
        mountingType: -1,
        fisheyeObject: null,
        fisheyeAdapter: new aui.nvr.FisheyeAdapter(),
        dewarpingRegion: null,
    };
    this.pvtFisheyeConfig.fisheyeAdapter.setEnable(true);

    this.pvtDigitalPTZAdapter = new aui.nvr.DigitalPTZAdapter();
    this.pvtDigitalPTZAdapter.setEnable(true);

    this.pvtRotateStatus = 0;
    this.pvtWebGL = {
        webGLDrawer: null,
        digitalPTZMatrix: null,
        videoTexture: null,
        mappingTableObj: null,
        webGLAdapter: null
    };

    this.pvtEventsData = {
        trigger: false,
        displayRect: {},
        ROIs: []
    };

    this.PTZSpeed = {
        panSpeed: 3,
        tiltSpeed: 3,
        zoomSpeed: 3
    };

    this.pvtStatus = aui.nvr.ui.WebAssemblyController.Status.IDLE;  // 0:IDLE, 2:BUFFERING, 4:LIVE, 8:HISTORY, 16:PAUSED, 32:NOSIGNAL
	this.pvtVideoResolution = { width:0, height:0 };

    this.PTZStatusType = {
        CONTINUOUSPTZ: 1,
        PIXELPTZ: 2,
        DIGITALPTZ: 3,
        FISHEYEPTZ: 4
    };
    this.pvtPTZStatus = this.PTZStatusType.CONTINUOUSPTZ;

    this.pvtOpticalPTZData = {
        bIsLButtonDown: false,
        keyDownPanSpeed: 0,
        keyDownTiltSpeed: 0,
        keyDownZoomSpeed: 0,
        adapter: new aui.nvr.OpticalPTZAdapter(this.options.width, this.options.height),
        startPoint: null
    };

    //Debug FPS
    this.pvtDebugFPSMessage = "";
    this.pvtDebugBufMessage = "";

    //this.onInitialized = new aui.lang.util.CustomEvent("onInitialized", this);
    this.onDisconnect = new aui.lang.util.CustomEvent("onDisconnect", this);
    this.onConnect = new aui.lang.util.CustomEvent("onConnect", this);
    this.onResize = new aui.lang.util.CustomEvent("onResize", this);
    this.onResolutionChange = new aui.lang.util.CustomEvent("onResolutionChange", this);

    this.onPTZCommand = new aui.lang.util.CustomEvent("onPTZCommand", this);

    this.onPrintLog = new aui.lang.util.CustomEvent("onPrintLog", this);

    this.onTimeCallBack = new aui.lang.util.CustomEvent("onTimeCallBack", this);

    aui.nvr.ui.WebAssemblyController.superclass.constructor.call(this, options);
};

aui.lang.Class.extend(aui.nvr.ui.WebAssemblyController, aui.ui.ControlBase, {
    URL_WEBSOCKET: "/media/websocket",
    XML_LIVE_AUTH: "<WebSocket><Header><Command>/Media/Streaming</Command><Account>{ACCOUNT}</Account><Password encrytype=\"basic\">{PASSWORD}</Password></Header><Body><ID>{CAMERA_ID}</ID><STREAM>{STREAM_ID}</STREAM></Body></WebSocket>",
    XML_PLAYBACK_AUTH: "<WebSocket><Header><Command>/Media/SyncPlayback</Command><Account>{ACCOUNT}</Account><Password encrytype=\"basic\">{PASSWORD}</Password></Header><Body><ID>{CAMERA_ID}</ID><Session>{SESSION}</Session><Time>{TIME}</Time><Play>true</Play></Body></WebSocket>",
    prepareNode: function(nodeToAppend) {
        var me = this;
        var key = null;
        nodeToAppend.className = me.className;

        me.myself = nodeToAppend;

        // HTML5 Audio
        me.pvtElements["Audio"] = NewObj("audio");
        me.pvtElements["Audio"].autoplay = true;
		me.pvtElements["Audio"].controls = false;
		me.pvtElements["Audio"].muted = false;

        // HTML5 Video
        me.pvtElements["Video"] = NewObj("video");
        me.pvtElements["Video"].width = me.options.width;
		me.pvtElements["Video"].height = me.options.height;
		me.pvtElements["Video"].preload = "none";
		me.pvtElements["Video"].autoplay = true;
		me.pvtElements["Video"].controls = false;
		me.pvtElements["Video"].muted = true;   // sound from me.pvtElements["Audio"]

        // HTML5 2D Canvas
        me.pvtElements["2DCanvas"] = NewObj("canvas");
        me.pvtElements["2DCanvas"].width = me.options.width;
		me.pvtElements["2DCanvas"].height = me.options.height;
        me.pvt2DCanvasContext = me.pvtElements["2DCanvas"].getContext("2d");

        //HTML5 WebGL Canvas
        me.pvtElements["WebGLCanvas"] = NewObj("canvas", "webGLCanvas");
        me.pvtElements["WebGLCanvas"].width = me.options.width;
        me.pvtElements["WebGLCanvas"].height = me.options.height;
        me.pvtElements["WebGLCanvas"].style.backgroundColor = "black";
        me.pvtElements["WebGLCanvas"].style.zIndex = -1;

        me.pvtWebGL.webGLDrawer = new WebGLDrawer(me.pvtElements["WebGLCanvas"]);
        me.pvtWebGL.webGLDrawer.setDrawRegion(0, 0, me.pvtElements["WebGLCanvas"].width, me.pvtElements["WebGLCanvas"].height);
        me.pvtWebGL.videoTexture = me.pvtWebGL.webGLDrawer.createTextureObject();

        // JPEG image
        me.pvtElements["Image"] = NewObj("img");

        // render elements
        for (key in me.pvtElements) {
            if (me.pvtElements[key])
                nodeToAppend.appendChild(me.pvtElements[key]);
        }

        // Debug Message Area
        if (me.pvtDebug) {
            me.pvtElements["DebugMessage"] = NewObj("div");
            nodeToAppend.appendChild(me.pvtElements["DebugMessage"]);
        }

        me._drawBlackFrame();

        // define media data: Video, Audio
        for (key in me.pvtMediaData) {
            me.pvtMediaData[key] = new aui.data.WebAssemblyMultimedia({ type: key });
        }

        // resize event
        me.onResize.subscribe(function (type, args) {
            var width = args[0];
            var height = args[1];

            me.pvtElements["Video"].width = me.pvtElements["2DCanvas"].width = width;
            me.pvtElements["Video"].height = me.pvtElements["2DCanvas"].height = height;

            if (me.pvtElements["WebGLCanvas"]) {
                me.pvtElements["WebGLCanvas"].width = width;
                me.pvtElements["WebGLCanvas"].height = height;
                me.pvtWebGL.mappingTableObj = null;
                if (me.pvtWebGL.webGLDrawer) {
                    me.pvtWebGL.webGLDrawer.setDrawRegion(0, 0, width, height);
                }
            }

            me._updateVideoDisplayRect();
        });
        me.onResize.fire(me.options.width, me.options.height);

        me.onResolutionChange.subscribe(function (type, args) {
            var width = args[0];
            var height = args[1];
            
            if (me.pvtFisheyeConfig.fisheyeAdapter) {
                me.pvtFisheyeConfig.fisheyeAdapter.setVideoResolution(width, height);
            }

            me.pvtDigitalPTZAdapter.setVideoResolution(width, height);
            me.pvtOpticalPTZData.adapter.setVideoResolution(width, height);

            if (me.pvtStretchToFit == false) {
                me._updateVideoDisplayRect();
            }
        });

        me.onmousedown.subscribe(function (type, args) {
            if (me.pvtPlayerData.working == false) return;
            var ev = args[0];
            if (ev.button == 0) { //Left button
                me.pvtOpticalPTZData.bIsLButtonDown = true;

                var PTZ = me.PTZStatusType;
                switch (me.pvtPTZStatus) {
                    case PTZ.CONTINUOUSPTZ:
                        me.pvtOpticalPTZData.adapter.sendMousePT({ x: ev.offsetX, y: ev.offsetY });
                        break;
                    case PTZ.PIXELPTZ:
                        me.pvtOpticalPTZData.startPoint = { x: ev.offsetX, y: ev.offsetY };
                        break;
                    case PTZ.DIGITALPTZ:
                        me.pvtDigitalPTZAdapter.setStartPoint(ev.clientX, ev.clientY);
                        me.pvtDigitalPTZAdapter.setEndPoint(ev.clientX, ev.clientY);
                        break;
                    case PTZ.FISHEYEPTZ:
                        var mountingType = me.pvtFisheyeConfig.mountingType;
                        var mode = me.pvtFisheyeConfig.mode;
                        var fisheyeAdapter = me.pvtFisheyeConfig.fisheyeAdapter;
                        if (me.pvtDigitalPTZAdapter.isZoom() ||
                            (mode == fisheyeAdapter.FisheyeMode.Panorama &&
                                (mountingType == fisheyeAdapter.FisheyeMountingType.Ceiling || mountingType == fisheyeAdapter.FisheyeMountingType.Ground))) {
                            me.pvtDigitalPTZAdapter.setStartPoint(ev.clientX, ev.clientY);
                            me.pvtDigitalPTZAdapter.setEndPoint(ev.clientX, ev.clientY);
                        }
                        else {
                            fisheyeAdapter.setControlPoint(ev.clientX, ev.clientY);
                        }
                        break;
                    default:
                }

            }
            else if (ev.button == 2) { //Right button
                if (me.pvtDigitalPTZAdapter.isZoom()) {
                    var PIPRect = me.pvtDigitalPTZAdapter.getPIPRect();
                    if (PIPRect) {
                        if (ev.clientX >= PIPRect.x &&
                            ev.clientY >= PIPRect.y &&
                            ev.clientX <= (PIPRect.x + PIPRect.width - 1) &&
                            ev.clientY <= (PIPRect.y + PIPRect.height - 1)) {
                            me.pvtDigitalPTZAdapter.toHome();
                        }
                    }
                }
            }
        });

        me.onmousemove.subscribe(function (type, args) {
            if (me.pvtPlayerData.working == false) return;
            var ev = args[0];

            var PTZ = me.PTZStatusType;
            switch (me.pvtPTZStatus) {
                case PTZ.CONTINUOUSPTZ:
                    if (me.pvtOpticalPTZData.bIsLButtonDown) {
                        me.pvtOpticalPTZData.adapter.sendMousePT({ x: ev.offsetX, y: ev.offsetY });
                    }
                    break;
                case PTZ.PIXELPTZ:
                    break;
                case PTZ.DIGITALPTZ:
                    me.pvtDigitalPTZAdapter.setEndPoint(ev.clientX, ev.clientY);
                    break;
                case PTZ.FISHEYEPTZ:
                    var mountingType = me.pvtFisheyeConfig.mountingType;
                    var mode = me.pvtFisheyeConfig.mode;
                    var fisheyeAdapter = me.pvtFisheyeConfig.fisheyeAdapter;
                    if (me.pvtDigitalPTZAdapter.isZoom() ||
                        (mode == fisheyeAdapter.FisheyeMode.Panorama &&
                            (mountingType == fisheyeAdapter.FisheyeMountingType.Ceiling || mountingType == fisheyeAdapter.FisheyeMountingType.Ground))) {
                        me.pvtDigitalPTZAdapter.setEndPoint(ev.clientX, ev.clientY);
                    }
                    else {
                        fisheyeAdapter.moveControlPoint(ev.clientX, ev.clientY);
                    }
                    break;
                default:
                    break;
            }
        });

        me.onmouseup.subscribe(function (type, args) {
            if (me.pvtPlayerData.working == false) return;
            var ev = args[0];
            if (ev.button == 0) { //Left button
                var PTZ = me.PTZStatusType;
                switch (me.pvtPTZStatus) {
                    case PTZ.CONTINUOUSPTZ:
                        if (me.pvtOpticalPTZData.bIsLButtonDown) {
                            me.pvtOpticalPTZData.adapter.sendMousePTStop();
                        }
                        break;
                    case PTZ.PIXELPTZ:
                        if (me.pvtOpticalPTZData.startPoint != null) {
                            me.pvtOpticalPTZData.adapter.sendPixelPTZ(me.pvtOpticalPTZData.startPoint, { x: ev.offsetX, y: ev.offsetY });
                            me.pvtOpticalPTZData.startPoint = null;
                        }
                    case PTZ.DIGITALPTZ:
                        me.pvtDigitalPTZAdapter.doProcess();
                        me.pvtDigitalPTZAdapter.resetPoint();
                        break;
                    case PTZ.FISHEYEPTZ:
                        var mountingType = me.pvtFisheyeConfig.mountingType;
                        var mode = me.pvtFisheyeConfig.mode;
                        var fisheyeAdapter = me.pvtFisheyeConfig.fisheyeAdapter;
                        if (me.pvtDigitalPTZAdapter.isZoom() ||
                            (mode == fisheyeAdapter.FisheyeMode.Panorama &&
                                (mountingType == fisheyeAdapter.FisheyeMountingType.Ceiling || mountingType == fisheyeAdapter.FisheyeMountingType.Ground))) {
                            me.pvtDigitalPTZAdapter.doProcess();
                            me.pvtDigitalPTZAdapter.resetPoint();
                        }
                        else {
                            fisheyeAdapter.releaseControlPoint(ev.clientX, ev.clientY);
                        }
                        break;
                    default:
                        break;
                }

                me.pvtOpticalPTZData.bIsLButtonDown = false;
            }
        });

        me.onmouseout.subscribe(function (type, args) {
            if (me.pvtPlayerData.working == false) return;
            me.pvtFisheyeConfig.fisheyeAdapter.releaseControlPoint();
            me.pvtDigitalPTZAdapter.resetPoint();

            let PTZ = me.PTZStatusType;
            switch (me.pvtPTZStatus) {
                case PTZ.CONTINUOUSPTZ:
                    if (me.pvtOpticalPTZData.bIsLButtonDown) {
                        me.pvtOpticalPTZData.adapter.sendMousePTStop();
                    }
                    break;
                case PTZ.DIGITALPTZ:
                    me.pvtOpticalPTZData.startPoint = null;
                    break;
                default:
                    break;
            }
            me.pvtOpticalPTZData.bIsLButtonDown = false;
        });

        me.pvtFisheyeConfig.fisheyeAdapter.onEnable.subscribe(function (type, args) {
            var enable = args[0];
            me.pvtFisheyeConfig.enable = enable;
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onEnableSubWindow.subscribe(function (type, args) {
            var enable = args[0];
            me.pvtFisheyeConfig.subwindowEnable = enable;
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onSetMountingType.subscribe(function (type, args) {
            var mountingType = args[0];
            me.pvtFisheyeConfig.mountingType = mountingType;
            me._updateFisheyeMode();
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onSetMode.subscribe(function (type, args) {
            var mode = args[0];
            me.pvtFisheyeConfig.mode = mode;
            me._updateFisheyeMode();
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onSetPTZMoveTo.subscribe(function (type, args) {
            if (me.pvtFisheyeConfig.fisheyeObject != null) {
                var idx = args[0];
                var PTZ = args[1];
                me.pvtFisheyeConfig.fisheyeObject.setFishEyePTZMoveTo(idx, PTZ.pan, PTZ.tilt, PTZ.zoom);
            }
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onGetPTZMoveTo.subscribe(function (type, args) {
            if (me.pvtFisheyeConfig.fisheyeObject != null) {
                var idx = args[0];
                var PTZ = args[1];
                var fisheyePTZ = me.pvtFisheyeConfig.fisheyeObject.getFishEyePTZMoveTo(idx);
                PTZ.pan = fisheyePTZ.x;
                PTZ.tilt = fisheyePTZ.y;
                PTZ.zoom = fisheyePTZ.z;
            }
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onSetCircle.subscribe(function (type, args) {
            if (me.pvtFisheyeConfig.fisheyeObject != null) {
                var circle = args[0];
                me.pvtFisheyeConfig.fisheyeObject.setFishEyeCircle(circle.x, circle.y, circle.radius, circle.width, circle.height);
            }
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onVideoResolutionChange.subscribe(function (type, args) {
            if (me.pvtFisheyeConfig.fisheyeObject != null) {
                var resolution = args[0];
                me.pvtFisheyeConfig.fisheyeObject.setOrginalResolution(resolution.width, resolution.height);
            }
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onDisplayRectChange.subscribe(function (type, args) {
            if (me.pvtFisheyeConfig.fisheyeObject != null) {
                var displayRect = args[0];
                me.pvtFisheyeConfig.fisheyeObject.setFisheyeResolution(displayRect.width, displayRect.height);
            }
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onSetMoveTo.subscribe(function (type, args) {
            if (me.pvtFisheyeConfig.fisheyeObject != null) {
                var idx = args[0];
                var coord = args[1];
                var fisheyeCoord = me.pvtFisheyeConfig.fisheyeObject.getFishEyeMoveTo(idx);
                me.pvtFisheyeConfig.fisheyeObject.setFishEyeMoveTo(idx, coord.x, coord.y, fisheyeCoord.z);
            }
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onSetRelativeMove.subscribe(function (type, args) {
            if (me.pvtFisheyeConfig.fisheyeObject != null) {
                var idx = args[0];
                var PTZ = args[1];
                me.pvtFisheyeConfig.fisheyeObject.fishEyeRelativeMove(idx, PTZ.pan, PTZ.tilt, PTZ.zoom);
            }
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onSetWindowRelativeMove.subscribe(function (type, args) {
            if (me.pvtFisheyeConfig.fisheyeObject != null) {
                var idx = args[0];
                var coord = args[1];
                me.pvtFisheyeConfig.fisheyeObject.fishEyeWindowRelativeMove(idx, coord.x, coord.y);
            }
        });
        me.pvtFisheyeConfig.fisheyeAdapter.onUpdate.subscribe(function (type, args) {
            me.pvtWebGL.mappingTableObj = null;
        });

        me.pvtOpticalPTZData.adapter.onOpticalPTZ.subscribe(function (type, args) {
            var ptzType = args[0];
            var command = args[1];

            var cmd;
            if (ptzType == "STANDAR") {
                cmd =
                    "http://" + me.pvtConnectionSettings.serverIP + ":" + me.pvtConnectionSettings.serverPort +
                    "/Media/Device/PTZ?deviceid=" + me.pvtConnectionSettings.cameraID + "&streamid=" + me.pvtConnectionSettings.streamID;
            } else if (ptzType == "ONVIF") {
                cmd = "http://" + serverIP + ":" + serverPort + "/ONVIF/PTZ/Move?deviceid=" + camera;
            }

            var url = cmd + command;
            me.onPTZCommand.fire(url, me.pvtConnectionSettings.account, me.pvtConnectionSettings.password);
        });

        me.pvtDigitalPTZAdapter.onDigitalPTZ.subscribe(function (type, args) {
            var digitalPTZRect = args[0];

            if (me.pvtWebGL.webGLAdapter) {
                function GetDigitalPTZMatrix(x, y, width, height, displayWidth, displayHeight) {
                    var mat = me.pvtWebGL.webGLAdapter.getIdentityMatrix();
                    mat.translate((displayWidth - 2 * x - width) / 2, (displayHeight - 2 * y - height) / 2, displayWidth, displayHeight);
                    mat.scale((displayWidth - 1) / (width - 1), (displayHeight - 1) / (height - 1));
                    return mat;
                }

                var videoWidth;
                var videoHeight;
                videoWidth = me.pvtVideoResolution.width;
                videoHeight = me.pvtVideoResolution.height;

                me.pvtWebGL.digitalPTZMatrix = GetDigitalPTZMatrix(
                    digitalPTZRect.x,
                    digitalPTZRect.y,
                    digitalPTZRect.width,
                    digitalPTZRect.height,
                    videoWidth,
                    videoHeight
                );
            }
        });

        // initial Stream Fragment
        me._initialStreamFragment();
    },

    setWidth: function (value) {
        var me = this;
        if (value) {
            value = parseFloat(value.toString().replace("px", ""));
            me.options.width = value;
            me.onResize.fire(me.options.width, me.options.height);
        }
        aui.nvr.ui.WebAssemblyController.superclass.setWidth.call(this, value);
    },

    setHeight: function (value) {
        var me = this;
        if (value) {
            value = parseFloat(value.toString().replace("px", ""));
            me.options.height = value;
            me.onResize.fire(me.options.width, me.options.height);
        }
        aui.nvr.ui.WebAssemblyController.superclass.setHeight.call(this, value);
    },

    setSyncPlay: function (value) {
        var me = this;

        me.pvtPlayerData.syncPlay = value;
    },

    setDirectOutput: function (value) {
        var me = this;
        if (!me.pvtStreamFragment || !me.pvtStreamFragment.isInitialized()) return;

        if (me.pvtConfigure.directOuptut == value) return;
        me.pvtConfigure.directOuptut = value;

        me._setFragmentConfigure();
    },

    setPauseFlag: function (value) {
        var me = this;
        if (!me.pvtStreamFragment || !me.pvtStreamFragment.isInitialized()) return;

        if (me.pvtConfigure.paused == value) return;
        me.pvtConfigure.paused = value;

        me._setFragmentConfigure();
    },

    setControlMode: function(value) {
        this.pvtControlMode = value;
    },

    getControlMode: function() {
        return this.pvtControlMode;
    },

    getStatus: function () {
        return this.pvtStatus;
    },

    setConnectionSettings: function (settings) {
        var me = this;
        var connSettings = {
            serverIP: "",
            serverPort: "",
            account: "",
            password: "",
            cameraID: "",
            streamID: ""
        };

        me.pvtConnectionSettings = aui.lang.merge(connSettings, settings || {});
        me.pvtLiveAuthXML = me.XML_LIVE_AUTH.replace("{ACCOUNT}", me.pvtConnectionSettings.account)
            .replace("{PASSWORD}", Base64.encode(me.pvtConnectionSettings.password))
            .replace("{CAMERA_ID}", me.pvtConnectionSettings.cameraID)
            .replace("{STREAM_ID}", me.pvtConnectionSettings.streamID || "1");

        if (me.pvtControlMode == "playback") {
            me.pvtTimeCode = /*(settings && settings.playbackTime) ?*/ (settings.playbackTime / 1000) /*: ((new Date()).getTime() / 1000)*/;
        }
    },

    resetDataParameters: function () {
        var me = this;

        // initial parameters
        me.pvtMediaData["Audio"].reset();
        me.pvtMediaData["Audio"].delay = 0;
        me.pvtElements["Audio"].ontimeupdate = null;
        me.pvtElements["Audio"].onerror = null;
        me.pvtElements["Audio"].src = "";


        me.pvtMediaData["Video"].reset();
        me.pvtMediaData["Video"].delay = Number(me.options.maxDelay);
        me.pvtElements["Video"].ontimeupdate = null;
        me.pvtElements["Video"].onerror = null;
        me.pvtElements["Video"].src = "";
        
        me.pvtConfigure.muted = true;
        me.pvtConfigure.decodeIOnly = false;
        me.pvtConfigure.debugNoAudio = false;
        me.pvtConfigure.debugNoVideo = false;
    },

    connect: function () {
        var me = this;
        if (!me.pvtStreamFragment || !me.pvtStreamFragment.isInitialized()) return;
        if (!me.pvtConnectionSettings || 
            !me.pvtConnectionSettings.serverIP || 
            !me.pvtConnectionSettings.serverPort || 
            !me.pvtConnectionSettings.account || 
            !me.pvtConnectionSettings.password || 
            !me.pvtConnectionSettings.cameraID) return;

        me.pvtStatus = aui.nvr.ui.WebAssemblyController.Status.BUFFERING;

        me._drawBlackFrame("Connecting");

        // initial parameters
        me.resetDataParameters();

        // create connection
        var initialcode = (me.pvtPlayerData.debugHardwareDecodeForce << 1) + 1;
        me.pvtStreamFragmentObject.initialFragment(initialcode);
        me.pvtStreamFragmentObject.connect(me.pvtConnectionSettings.serverIP, me.pvtConnectionSettings.serverPort, me.URL_WEBSOCKET, false);

        // create requestAnimationFrame for draw video to canvas
        me.pvtDrawRequestID = window.requestAnimationFrame(me._updateVideoCanvas(me));
    },

    disconnect: function () {
        var me = this;
        if (!me.pvtStreamFragment || !me.pvtStreamFragment.isInitialized()) return;
        if (me.pvtStatus == aui.nvr.ui.WebAssemblyController.Status.IDLE ||
            me.pvtStatus == aui.nvr.ui.WebAssemblyController.Status.DISCONNECTING) return;

        me.pvtStatus = aui.nvr.ui.WebAssemblyController.Status.DISCONNECTING;
        me._drawBlackFrame("Disconnecting");

        me.pvtStreamFragmentObject.disconnect();

        if (me.pvtDrawRequestID) {
            window.cancelAnimationFrame(me.pvtDrawRequestID);
            me.pvtDrawRequestID = null;
        }
    },

    enableAudioIn: function (value) {
        var me = this;
        if (!me.pvtStreamFragment || !me.pvtStreamFragment.isInitialized()) return;

        if (me.pvtConfigure.muted != value) return;
        me.pvtConfigure.muted = !value;

        me._setFragmentConfigure();
    },

    setDecodeI: function (value) {
        var me = this;
        if (!me.pvtStreamFragment || !me.pvtStreamFragment.isInitialized()) return;
        
        if (me.pvtConfigure.decodeIOnly == value) return;
        me.pvtConfigure.decodeIOnly = value;
        
        me._setFragmentConfigure();
    },

    setRestart: function (datatype) {
        var me = this;
        if (!me.pvtStreamFragment || !me.pvtStreamFragment.isInitialized()) return;

        if (datatype == "Video") {
            if (me.pvtControls.videoRestart == true)
                return;
            me.pvtControls.videoRestart = true;
        } else if (datatype == "Audio") {
            if (me.pvtControls.audioRestart == true)
                return;
            me.pvtControls.audioRestart = true;
        }

        me._setFragmentControl();
    },

    setWebGLAdapter: function (webGLadapter) {
        var me = this;
        me.pvtWebGL.webGLAdapter = webGLadapter;
    },

    setFisheyeObject: function (fisheyeObject) {
        var me = this;
        me.removeFisheyeObject();

        me.pvtFisheyeConfig.fisheyeObject = fisheyeObject;
        if (me.pvtFisheyeConfig.mountingType != -1) {
            me.pvtFisheyeConfig.fisheyeAdapter.setMountingType(me.pvtFisheyeConfig.mountingType);
        }

        if (me.pvtFisheyeConfig.mode != -1) {
            me.pvtFisheyeConfig.fisheyeAdapter.setMode(me.pvtFisheyeConfig.mode);
        }

        me.pvtFisheyeConfig.fisheyeAdapter.setEnable(true);

        //Must reset fisheye object
        me.pvtFisheyeConfig.fisheyeAdapter.setVideoResolution(me.pvtVideoResolution.width, me.pvtVideoResolution.height);
        me.pvtFisheyeConfig.fisheyeAdapter.setDisplayRect(me.pvtVideoDisplayRect.x, me.pvtVideoDisplayRect.y, me.pvtVideoDisplayRect.width, me.pvtVideoDisplayRect.height);
    },

    removeFisheyeObject: function () {
        var me = this;
        me.pvtFisheyeConfig.fisheyeAdapter.setEnable(false);
        if (me.pvtFisheyeConfig.fisheyeObject != null) {
            me.pvtFisheyeConfig.fisheyeObject.destroy();
            me.pvtFisheyeConfig.fisheyeObject = null;
        }
    },

    setFisheyeMountingType: function (mountingType) {
        var me = this;
        me.pvtFisheyeConfig.fisheyeAdapter.setMountingType(mountingType);
    },

    setFisheyeMode: function (mode) {
        var me = this;
        me.pvtFisheyeConfig.fisheyeAdapter.setMode(mode);
    },

    setFisheyeCircle: function (x, y, radius, width, height) {
        var me = this;
        me.pvtFisheyeConfig.fisheyeAdapter.setFisheyeCircle(x, y, radius, width, height);
    },

    setPTZMode: function (mode) {
        var me = this;
        if (me.pvtPlayerData.working) {
            me.pvtPTZStatus = Number(mode);
        }
    },

    setTitleBarDisplay(enable) {
        var me = this;
        me.pvtTitleBarConfig.enable = enable;
        me._updateVideoDisplayRect();
    },

    setStretchToFit(enable) {
        var me = this;
        me.pvtStretchToFit = enable;
        me._updateVideoDisplayRect();
    },

    doMouseWheel: function (ev) {
        var me = this;
        if (me.pvtPlayerData.working == false) return;

        var fisheyeAdapter = me.pvtFisheyeConfig.fisheyeAdapter;
        var PTZSpeed = me.PTZSpeed;
        var digitalPTZAdapter = me.pvtDigitalPTZAdapter;
        if (ev.deltaY < 0) { //Roll up
            var PTZ = me.PTZStatusType;
            switch (this.pvtPTZStatus) {
                case PTZ.CONTINUOUSPTZ:
                case PTZ.PIXELPTZ:
                    //Mouse Zoom in
                    this.pvtOpticalPTZData.adapter.sendMouseZ(PTZSpeed.zoomSpeed);
                    break;
                case PTZ.DIGITALPTZ:
                    digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.zoomIn, PTZSpeed.zoomSpeed);
                    break;
                case PTZ.FISHEYEPTZ:
                    fisheyeAdapter.releaseControlPoint();
                    if (!fisheyeAdapter.zoomIn(PTZSpeed.zoomSpeed)) {
                        digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.zoomIn, PTZSpeed.zoomSpeed);
                    }
                    break;
                default:
            }
        }
        else if (ev.deltaY > 0) { //Roll down
            var PTZ = me.PTZStatusType;
            switch (this.pvtPTZStatus) {
                case PTZ.CONTINUOUSPTZ:
                case PTZ.PIXELPTZ:
                    //Mouse Zoom out
                    this.pvtOpticalPTZData.adapter.sendMouseZ(-PTZSpeed.zoomSpeed);
                    break;
                case PTZ.DIGITALPTZ:
                    digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.zoomOut, PTZSpeed.zoomSpeed);
                    break;
                case PTZ.FISHEYEPTZ:
                    fisheyeAdapter.releaseControlPoint();
                    if (!fisheyeAdapter.zoomOut(PTZSpeed.zoomSpeed)) {
                        digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.zoomOut, PTZSpeed.zoomSpeed);
                    }
                    break;
                default:
            }
        }
    },

    doKeyDown: function (ev) {
        var me = this;
        if (me.pvtPlayerData.working == false) return;

        var fisheyeAdapter = me.pvtFisheyeConfig.fisheyeAdapter;
        var PTZSpeed = me.PTZSpeed;
        var digitalPTZAdapter = me.pvtDigitalPTZAdapter;
        var PTZStatusType = this.PTZStatusType;
        switch (ev.key) {
            case "Up":  //Edge Old version
            case "ArrowUp":
                switch (me.pvtPTZStatus) {
                    case PTZStatusType.CONTINUOUSPTZ:
                    case PTZStatusType.PIXELPTZ:
                        if (me.pvtOpticalPTZData.keyDownPanSpeed != 0 ||
                            me.pvtOpticalPTZData.keyDownTiltSpeed != -PTZSpeed.tiltSpeed) {
                            me.pvtOpticalPTZData.keyDownPanSpeed = 0;
                            me.pvtOpticalPTZData.keyDownTiltSpeed = -PTZSpeed.tiltSpeed;
                            me.pvtOpticalPTZData.adapter.sendKeyPT(0, -PTZSpeed.tiltSpeed);
                        }
                        break;
                    case PTZStatusType.DIGITALPTZ:
                        digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.tiltUp, PTZSpeed.tiltSpeed);
                        break;
                    case PTZStatusType.FISHEYEPTZ:
                        if (digitalPTZAdapter.isZoom()) {
                            digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.tiltUp, PTZSpeed.tiltSpeed);
                        }
                        else {
                            fisheyeAdapter.sendPTZCommand(fisheyeAdapter.PTZCMD.tiltUp, PTZSpeed.tiltSpeed);
                        }
                        break;
                    default:
                }
                break;
            case "Down":    //Edge Old version
            case "ArrowDown":
                switch (me.pvtPTZStatus) {
                    case PTZStatusType.CONTINUOUSPTZ:
                    case PTZStatusType.PIXELPTZ:
                        if (me.pvtOpticalPTZData.keyDownPanSpeed != 0 ||
                            me.pvtOpticalPTZData.keyDownTiltSpeed != PTZSpeed.tiltSpeed) {
                            me.pvtOpticalPTZData.keyDownPanSpeed = 0;
                            me.pvtOpticalPTZData.keyDownTiltSpeed = PTZSpeed.tiltSpeed;
                            me.pvtOpticalPTZData.adapter.sendKeyPT(0, PTZSpeed.tiltSpeed);
                        }
                        break;
                    case PTZStatusType.DIGITALPTZ:
                        digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.tiltDown, PTZSpeed.tiltSpeed);
                        break;
                    case PTZStatusType.FISHEYEPTZ:
                        if (digitalPTZAdapter.isZoom()) {
                            digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.tiltDown, PTZSpeed.tiltSpeed);
                        }
                        else {
                            fisheyeAdapter.sendPTZCommand(fisheyeAdapter.PTZCMD.tiltDown, PTZSpeed.tiltSpeed);
                        }
                        break;
                    default:
                }
                break;
            case "Left":    //Edge Old version
            case "ArrowLeft":
                switch (me.pvtPTZStatus) {
                    case PTZStatusType.CONTINUOUSPTZ:
                    case PTZStatusType.PIXELPTZ:
                        if (me.pvtOpticalPTZData.keyDownPanSpeed != -PTZSpeed.panSpeed ||
                            me.pvtOpticalPTZData.keyDownTiltSpeed != 0) {
                            me.pvtOpticalPTZData.keyDownPanSpeed = -PTZSpeed.panSpeed;
                            me.pvtOpticalPTZData.keyDownTiltSpeed = 0;
                            me.pvtOpticalPTZData.adapter.sendKeyPT(-PTZSpeed.panSpeed, 0);
                        }
                        break;
                    case PTZStatusType.DIGITALPTZ:
                        digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.panLeft, PTZSpeed.tiltSpeed);
                        break;
                    case PTZStatusType.FISHEYEPTZ:
                        if (digitalPTZAdapter.isZoom()) {
                            digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.panLeft, PTZSpeed.tiltSpeed);
                        }
                        else {
                            fisheyeAdapter.sendPTZCommand(fisheyeAdapter.PTZCMD.panLeft, PTZSpeed.panSpeed);
                        }
                        break;
                    default:
                }
                break;
            case "Right":   //Edge Old version
            case "ArrowRight":
                switch (me.pvtPTZStatus) {
                    case PTZStatusType.CONTINUOUSPTZ:
                    case PTZStatusType.PIXELPTZ:
                        if (me.pvtOpticalPTZData.keyDownPanSpeed != PTZSpeed.panSpeed ||
                            me.pvtOpticalPTZData.keyDownTiltSpeed != 0) {
                            me.pvtOpticalPTZData.keyDownPanSpeed = PTZSpeed.panSpeed;
                            me.pvtOpticalPTZData.keyDownTiltSpeed = 0;
                            me.pvtOpticalPTZData.adapter.sendKeyPT(PTZSpeed.tiltSpeed, 0);
                        }
                        break;
                    case PTZStatusType.DIGITALPTZ:
                        digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.panRight, PTZSpeed.tiltSpeed);
                        break;
                    case PTZStatusType.FISHEYEPTZ:
                        if (digitalPTZAdapter.isZoom()) {
                            digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.panRight, PTZSpeed.tiltSpeed);
                        }
                        else {
                            fisheyeAdapter.sendPTZCommand(fisheyeAdapter.PTZCMD.panRight, PTZSpeed.panSpeed);
                        }
                        break;
                    default:
                }
                break;
            case "PageUp":
                switch (me.pvtPTZStatus) {
                    case PTZStatusType.CONTINUOUSPTZ:
                    case PTZStatusType.PIXELPTZ:
                        if (me.pvtOpticalPTZData.keyDownZoomSpeed != PTZSpeed.zoomSpeed) {
                            me.pvtOpticalPTZData.keyDownZoomSpeed = PTZSpeed.zoomSpeed;
                            me.pvtOpticalPTZData.adapter.sendKeyZ(PTZSpeed.zoomSpeed);
                        }
                        break;
                    case PTZStatusType.DIGITALPTZ:
                        digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.zoomIn, PTZSpeed.zoomSpeed);
                        break;
                    case PTZStatusType.FISHEYEPTZ:
                        fisheyeAdapter.releaseControlPoint();
                        if (!fisheyeAdapter.zoomIn(PTZSpeed.zoomSpeed)) {
                            digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.zoomIn, PTZSpeed.zoomSpeed);
                        }
                        break;
                    default:
                }
                break;
            case "PageDown":
                switch (me.pvtPTZStatus) {
                    case PTZStatusType.CONTINUOUSPTZ:
                    case PTZStatusType.PIXELPTZ:
                        if (me.pvtOpticalPTZData.keyDownZoomSpeed != -PTZSpeed.zoomSpeed) {
                            me.pvtOpticalPTZData.keyDownZoomSpeed = -PTZSpeed.zoomSpeed;
                            me.pvtOpticalPTZData.adapter.sendKeyZ(-PTZSpeed.zoomSpeed);
                        }
                        break;
                    case PTZStatusType.DIGITALPTZ:
                        digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.zoomOut, PTZSpeed.zoomSpeed);
                        break;
                    case PTZStatusType.FISHEYEPTZ:
                        fisheyeAdapter.releaseControlPoint();
                        if (!fisheyeAdapter.zoomOut(PTZSpeed.zoomSpeed)) {
                            digitalPTZAdapter.ptzCommand(digitalPTZAdapter.PTZOperation.zoomOut, PTZSpeed.zoomSpeed);
                        }
                        break;
                    default:
                }
                break;
        }
    },

    doKeyUp: function (ev) {
        var me = this;
        if (me.pvtPlayerData.working == false) return;

        var fisheyeAdapter = me.pvtFisheyeConfig.fisheyeAdapter;
        switch (ev.key) {
            case "Up":
            case "Down":    //Edge Old version
            case "ArrowUp":
            case "ArrowDown":
                fisheyeAdapter.sendPTZCommand(fisheyeAdapter.PTZCMD.tiltStop);
                me.pvtOpticalPTZData.adapter.sendKeyPT(0, 0);
                me.pvtOpticalPTZData.keyDownPanSpeed = 0;
                me.pvtOpticalPTZData.keyDownTiltSpeed = 0;
                break;
            case "Left":
            case "Right":   //Edge Old version
            case "ArrowLeft":
            case "ArrowRight":
                fisheyeAdapter.sendPTZCommand(fisheyeAdapter.PTZCMD.panStop);
                me.pvtOpticalPTZData.adapter.sendKeyPT(0, 0);
                me.pvtOpticalPTZData.keyDownPanSpeed = 0;
                me.pvtOpticalPTZData.keyDownTiltSpeed = 0;
                break;
            case "PageUp":
            case "PageDown":
                me.pvtOpticalPTZData.adapter.sendKeyZ(0);
                me.pvtOpticalPTZData.keyDownZoomSpeed = 0;
                break;
        }
    },

    setROISetting: function (id, vertex, resolution) {
        var me = this;
        me.pvtEventsData.displayRect = {
            x: me.pvtVideoDisplayRect.x,
            y: me.pvtVideoDisplayRect.y,
            width: me.pvtVideoDisplayRect.width,
            height: me.pvtVideoDisplayRect.height
        };

        var roi = { id: id, trigger: false, vertex: [] };
        var srcRect = { x:0, y:0, width:resolution.width, height:resolution.height };
        roi.vertex = me._transferVertex(srcRect, me.pvtEventsData.displayRect, vertex);
        me.pvtEventsData.ROIs.push(roi);

    },

    // private methods =============================================================================

    //Debug FPS
    _printDebug: function(message) {
        var me = this;
        if (me.pvtDebug) {
            me.pvtElements["DebugMessage"].textContent = message;
        }
    },

    _setFragmentConfigure: function () {
        var me = this;

        var confbuf = new Int8Array(Object.values(me.pvtConfigure));
        me.pvtStreamFragmentObject.setConfigure(confbuf);

        ////me.pvtConfigure = {
        ////    muted: true,
        ////    decodeIOnly: false,
        ////    directOutput: false,
        ////    debugNoAudio: false,
        ////    debugNoVideo: false,
        ////    debugValue: 30000
        ////};
        //var buffer = new ArrayBuffer(9);
        //var x = new DataView(buffer, 0);
        //x.setUint8(0, me.pvtConfigure.muted);
        //x.setUint8(1, me.pvtConfigure.decodeIOnly);
        //x.setUint8(2, me.pvtConfigure.directOutput);
        //x.setUint8(3, me.pvtConfigure.debugNoAudio);
        //x.setUint8(4, me.pvtConfigure.debugNoVideo);
        //x.setUint32(5, me.pvtConfigure.debugValue, true);
        //var confbuf = new Int8Array(x.buffer);   //Transfer to Int8Array
        ////console.log(confbuf);
        //me.pvtStreamFragment.setConfigure(confbuf);
    },

    _setFragmentControl: function () {
        var me = this;
        
        var ctrlbuf = new Int8Array(Object.values(me.pvtControls));
        me.pvtStreamFragment.setControls(ctrlbuf);
    },

    _initialStreamFragment: function() {
        var me = this;
        if (me.pvtStreamFragment) return;

        me.pvtStreamFragment = me.options.object.pvtModule;
        me.pvtStreamFragmentObject = me.options.object;
        me.pvtStreamFragment.onModuleEvent.subscribe(function (type, args) {
            var eventType = args[0] || "";
            var eventArgs = args[2] || null;

            let eid = args[1];
            if (eid != me.options.id) {
                return;
            }

            switch (eventType) {
                //case "onRuntimeInitialized":
                //    me.onInitialized.fire();
                //    break;
                case "onConnect":
                case "onConnectionRecovery":
                case "onNetworkLoss":
                case "onDisconnect":
                case "frameCallBack":
                case "eventCallBack":
                case "playerInitialCallBack":
                case "onQueueClear":
                    me["_" + eventType](eventArgs);
                    break;
                default:
                    break;
            }
        });
        //Debug FPS
        me.pvtStreamFragment.onPrintEvent.subscribe(function (type, args) {
            var eid = args[0];
            var message = args[1];

            if (eid != me.options.id) {
                return;
            }

            me.pvtDebugFPSMessage = message;
            me._printDebug(me.pvtDebugBufMessage + me.pvtDebugFPSMessage);
        });
    },

    _initialCodec: function (dataType, mimeCodec) {
        var me = this;
        if (!dataType || !me.pvtMediaData[dataType]) return;

        var data = me.pvtMediaData[dataType];
        var target = me.pvtElements[dataType];

        data.updateflag = true;
        data.reset();
        target.error = null;

        if (mimeCodec == "MJPEG") {

        } else if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
			data.mediaSource = new MediaSource();
			data.mediaSource.mode = "sequence";
			//data.mediaSource.mode = "segments";
			data.mediaSourceURL = URL.createObjectURL(data.mediaSource);
            
            data.mediaSource.addEventListener("sourceopen", function () {
                trace("onsourceopen");
                data.mediaSource.duration = 0;
                data.sourceBuffer = data.mediaSource.addSourceBuffer(mimeCodec);

                data.sourceBuffer.addEventListener("updateend", function (_) {
                    if (target.error) {
                        target.onerror();
                        return;
                    }

                    if (data.sourceBuffer && data.framebuffer != null) {
                        data.sourceBuffer.appendBuffer(data.framebuffer);
                        data.framebuffer = null;
                    } else if (data.removeBufferNextPoint > 0
                        && target.currentTime > data.removeBufferNextPoint) {
                        data.sourceBuffer.remove(0, data.removeBufferPoint);
                        data.removeBufferPoint = data.removeBufferNextPoint;
                        data.removeBufferNextPoint = 0;
                    } else {
						data.updateflag = false;
					}

                    // play time control
                    if (me.pvtPlayerData.syncPlay && me.pvtConfigure.decodeIOnly == false) {
                        let delayA = 0;     // audio delay
                        let audioSync = false;
                        if (me.pvtPlayerData.working && me.pvtElements["Audio"]) {
                            delayA = (me.pvtElements["Audio"].duration - me.pvtElements["Audio"].currentTime);
                            if (isNaN(delayA)) {
                                delayA = 0;
                            }

                            // handle play Audio target
                            if (dataType == "Audio") {
                                if (delayA > Number(data.delay)) {
                                    target.currentTime = target.duration - me.options.minAudioDelay;
                                } else if (target.paused && delayA > me.options.minAudioDelay) {
                                    target.play();
                                }
                            }
                        }

                        if (dataType == "Video"
                            && me.pvtPlayerData.working
                            && target) {
                            let delayV = delayA + me.pvtMediaData["Video"].delay;
                            if (delayA < me.options.minAudioDelay) {
                                //audio lost and stop
                                delayV = me.pvtMediaData["Audio"].delay + me.pvtMediaData["Video"].delay;
                                //audioSync = false;
                            } else if (me.pvtMediaData["Audio"].delay > 0) {
                                audioSync = true;
                            }

                            // handle play Video target
                            let delay = (target.duration - target.currentTime);
                            if (audioSync == false && ((delay - delayV) > me.options.validDiffSec)) {
                                target.currentTime = target.duration - me.options.minAudioDelay;
                            } else if (audioSync == true && Math.abs(delay - delayV) > me.options.validDiffSec) {
                                target.currentTime = target.duration - delayV;
                            } else if (target.paused && delay > 0) {
                                target.play();
                            }
                        }
                    } else {
                        let delay = (target.duration - target.currentTime);
                        if (target.paused && delay > 0) {
                            target.play();
                        }
                    }
                });
            });
            data.mediaSource.addEventListener("sourceended", function(e) {
                trace("onsourceended: " + e);
            });
            data.mediaSource.addEventListener("sourceclose", function(e) {
                trace("onsourceclose: " + e);
            });
            data.mediaSource.addEventListener("error", function(e) {
                trace("onerror: " + e);
            });

            target.src = data.mediaSourceURL;

            target.ontimeupdate = function () {
                //play time control
                var delay = (target.duration - target.currentTime);
                if ((dataType == "Video" && delay < 0)
                    || (dataType == "Audio" && delay < me.options.minAudioDelay)
                ) {
                    target.pause();
                }

            };
            target.onerror = function () {
                //trace("updateend Error: " + target.error.code + " details: " + target.error.message);
                me.onPrintLog.fire(me.options.id + aui.lang.Date.format((new Date()), ": day%d %H:%i:%s") + " - err " + dataType + " : " + target.error.code + " details: " + target.error.message);
                if (dataType == "Audio") {
                    switch (target.error.code) {
                        case 3:
                            //error code = 3
                            //
                            me.enableAudioIn(false);
                            break;
                        default:
                            me.disconnect();
                            break;
                    }
                } else if (dataType == "Video") {
                    me.disconnect();
                }
            };

            me.pvtPlayerData.working = true;
        } else {
			trace('Unsupported MIME type or codec: ' + mimeCodec);
        }

        if (dataType == "Video") {
            me.pvtControls.videoRestart = false;
        } else if (dataType == "Audio") {
            me.pvtControls.audioRestart = false;
        }
    },

    // draw video to canvas
    _updateVideoCanvas: function (me) {
        return function () {
            var canvas = me.pvtElements["2DCanvas"];
            var ctx = me.pvt2DCanvasContext;
            var width = canvas.width;
            var height = canvas.height;
            var videoWidth = 0;
            var videoHeight = 0;
            if (me.pvtCurCodec === 4) {
                if (me.pvtElements["Image"].complete) {
                    videoWidth = me.pvtElements["Image"].naturalWidth;
                    videoHeight = me.pvtElements["Image"].naturalHeight;
                }
            } else {
                videoWidth = me.pvtElements["Video"].videoWidth;
                videoHeight = me.pvtElements["Video"].videoHeight;
            }

            if (videoWidth === 0 ||
                videoHeight === 0) {
                //Skip frame
                me.pvtDrawRequestID = window.requestAnimationFrame(me._updateVideoCanvas(me));
                return;
            }

            if (me.pvtVideoResolution.width != videoWidth || me.pvtVideoResolution.height != videoHeight) {
                me.pvtVideoResolution.width = videoWidth;
                me.pvtVideoResolution.height = videoHeight;
                me.onResolutionChange.fire(videoWidth, videoHeight);
            }

            if (me.pvtPlayerData.working) {
                var time = null;//new Date();
                var text = "";
                var light1 = "green";
                if (me.pvtTimeCode && me.pvtTimeCode > 0) {
                    time = new Date();
                    time.setTime(me.pvtTimeCode * 1000);
                    //else time = null;    // push video off does not show date time
                }

                if (time) {
                    text = aui.lang.Date.format(time, "%Y-%m-%d %H:%i:%s %u");

                    // video
                    if (!me.pvtIsEmptyFrame) {
                        if (me.pvtWebGL.webGLDrawer != null) { //Use webGL
                            ctx.clearRect(0, 0, width, height);
                            me.pvtWebGL.webGLDrawer.clearColorBuffer();
                            if (me.pvtCurCodec === 4) {
                                me.pvtWebGL.webGLDrawer.updateTexture(me.pvtWebGL.videoTexture, me.pvtElements["Image"]);
                            } else {
                                me.pvtWebGL.webGLDrawer.updateTexture(me.pvtWebGL.videoTexture, me.pvtElements["Video"]);
                            }
                            
                            var transformMat = me.pvtDigitalPTZAdapter.isZoom() ? me.pvtWebGL.digitalPTZMatrix : me.pvtWebGL.webGLAdapter.getIdentityMatrix();
                            if (me.pvtRotateStatus != 0) {
                                transformMat.rotate(me.pvtRotateStatus, 1, 1);
                            }

                            if (me.pvtFisheyeConfig.fisheyeObject && me.pvtFisheyeConfig.enable) {
                                if (me.pvtWebGL.mappingTableObj == null || me.pvtFisheyeConfig.fisheyeObject.isChanged()) {
                                    var mappingTable = me.pvtFisheyeConfig.fisheyeObject.getFishEyeTransformTable(
                                        videoWidth,
                                        videoHeight,
                                        width,
                                        height,
                                        true
                                    );

                                    me.pvtFisheyeConfig.dewarpingRegion = new Array((width + height - 2) * 2);
                                    {
                                        var mappingTableArray = mappingTable.getBuffer();
                                        var region = me.pvtFisheyeConfig.dewarpingRegion;
                                        var index = 0;

                                        function clamp(num, min, max) {
                                            return Math.max(Math.min(num, max), min);
                                        }

                                        var indicesPerLine = width * 2;
                                        //Top edge
                                        for (var i = 0; i < indicesPerLine; i += 2) {
                                            region[index++] = { x: clamp(mappingTableArray[i], 0, 1), y: clamp(mappingTableArray[i + 1], 0, 1) };
                                        }

                                        //Right edge
                                        for (var i = 2; i < height; ++i) {
                                            region[index++] = { x: clamp(mappingTableArray[i * indicesPerLine - 2], 0, 1), y: clamp(mappingTableArray[i * indicesPerLine - 1], 0, 1) };
                                        }

                                        //Bottom edge
                                        var yOffset = indicesPerLine * (height - 1);
                                        for (var i = indicesPerLine - 2; i >= 0; i -= 2) {
                                            region[index++] = { x: clamp(mappingTableArray[yOffset + i], 0, 1), y: clamp(mappingTableArray[yOffset + i + 1], 0, 1) };
                                        }

                                        //Left edge
                                        for (var i = height - 2; i >= 1; --i) {
                                            region[index++] = { x: clamp(mappingTableArray[indicesPerLine * i], 0, 1), y: clamp(mappingTableArray[indicesPerLine * i + 1], 0, 1) };
                                        }
                                    }

                                    if (me.pvtWebGL.mappingTableObj != null) {
                                        me.pvtWebGL.webGLDrawer.updateMappingTableVerticeObj(me.pvtWebGL.mappingTableObj, mappingTable.getBuffer());
                                    }
                                    else if (me.pvtWebGL.webGLAdapter) {
                                        var vertexArrayObj = me.pvtWebGL.webGLAdapter.getNormalizedVertexArray(width, height);
                                        var elementsArrayObj = me.pvtWebGL.webGLAdapter.getElementsArray(width, height);
                                        me.pvtWebGL.mappingTableObj = me.pvtWebGL.webGLDrawer.getMappingTableVerticeObj(mappingTable.getBuffer(), vertexArrayObj.getBuffer(), elementsArrayObj.getBuffer());
                                        vertexArrayObj.destroy();
                                        elementsArrayObj.destroy();
                                    }
                                }
                                me.pvtWebGL.webGLDrawer.drawBitmap(
                                    me.pvtWebGL.videoTexture,
                                    me.pvtVideoDisplayRect.x,
                                    me.pvtVideoDisplayRect.y,
                                    me.pvtVideoDisplayRect.width,
                                    me.pvtVideoDisplayRect.height,
                                    me.pvtWebGL.mappingTableObj, transformMat);

                                var focusRect = me.pvtFisheyeConfig.fisheyeAdapter.getFocusRect();
                                if (focusRect) {
                                    ctx.lineWidth = 2.0;
                                    ctx.strokeStyle = "#FFDE00";
                                    ctx.globalAlpha = 1;
                                    ctx.strokeRect(focusRect.x, focusRect.y, focusRect.width, focusRect.height);
                                }

                                var absolutePoint = me.pvtFisheyeConfig.fisheyeAdapter.getAbsolutePoint();
                                if (absolutePoint) {
                                    ctx.lineWidth = 2.0;
                                    ctx.strokeStyle = "#FF0000";
                                    ctx.globalAlpha = 1;

                                    ctx.beginPath();
                                    ctx.moveTo(absolutePoint.x, absolutePoint.y - 10);
                                    ctx.lineTo(absolutePoint.x, absolutePoint.y + 10);
                                    ctx.moveTo(absolutePoint.x - 10, absolutePoint.y);
                                    ctx.lineTo(absolutePoint.x + 10, absolutePoint.y);
                                    ctx.stroke();
                                }
                            }
                            else {
                                me.pvtWebGL.webGLDrawer.drawBitmap(
                                    me.pvtWebGL.videoTexture,
                                    me.pvtVideoDisplayRect.x,
                                    me.pvtVideoDisplayRect.y,
                                    me.pvtVideoDisplayRect.width,
                                    me.pvtVideoDisplayRect.height, null, transformMat);
                            }

                            if (me.pvtFisheyeConfig.subwindowEnable) {
                                var subWindowRect = me.pvtFisheyeConfig.fisheyeAdapter.getSubWindowRect();
                                ctx.lineWidth = 1.0;
                                ctx.strokeStyle = "#FFFFFF";
                                ctx.globalAlpha = 1;

                                //+0.5 explaination: https://stackoverflow.com/questions/7530593/html5-canvas-and-line-width/7531540#7531540
                                ctx.strokeRect(subWindowRect.x - 0.5, subWindowRect.y - 0.5, subWindowRect.width + 2, subWindowRect.height + 2);
                                me.pvtWebGL.webGLDrawer.drawBitmap(me.pvtWebGL.videoTexture, subWindowRect.x, subWindowRect.y, subWindowRect.width, subWindowRect.height);

                                var region = me.pvtFisheyeConfig.dewarpingRegion;
                                ctx.strokeStyle = "#FF0000";
                                ctx.beginPath();
                                var firstX = subWindowRect.x + subWindowRect.width * region[0].x + 0.5;
                                var firstY = subWindowRect.y + subWindowRect.height * region[0].y + 0.5;
                                ctx.moveTo(firstX, firstY);
                                for (var i = 1; i < region.length; ++i) {
                                    var x = subWindowRect.x + subWindowRect.width * region[i].x + 0.5;
                                    var y = subWindowRect.y + subWindowRect.height * region[i].y + 0.5;
                                    ctx.lineTo(x, y);
                                }
                                ctx.stroke();
                            }

                            
                            if (me.pvtDigitalPTZAdapter.isZoom()) {
                                var PIPRect = me.pvtDigitalPTZAdapter.getPIPRect();
                                if (PIPRect) {
                                    ctx.lineWidth = 1.0;
                                    ctx.strokeStyle = "#FFFFFF";
                                    ctx.globalAlpha = 1;

                                    //+0.5 explaination: https://stackoverflow.com/questions/7530593/html5-canvas-and-line-width/7531540#7531540
                                    ctx.strokeRect(PIPRect.x - 0.5, PIPRect.y - 0.5, PIPRect.width + 1, PIPRect.height + 1);
                                    me.pvtWebGL.webGLDrawer.drawBitmap(me.pvtWebGL.videoTexture, PIPRect.x, PIPRect.y, PIPRect.width, PIPRect.height);

                                    var currentRectInPIP = me.pvtDigitalPTZAdapter.getCurrentRectInPIP();
                                    if (currentRectInPIP) {
                                        ctx.lineWidth = 2.0;
                                        ctx.strokeStyle = "#FF0000";
                                        ctx.strokeRect(currentRectInPIP.x, currentRectInPIP.y, currentRectInPIP.width, currentRectInPIP.height);
                                    }
                                }
                            }

                            var selectedRect = me.pvtDigitalPTZAdapter.getSelectedRect();
                            if (selectedRect) {
                                ctx.fillStyle = "#FFFFFF8C";
                                ctx.fillRect(selectedRect.x, selectedRect.y, selectedRect.width, selectedRect.height);
                            }
                        }
                        else { //Use 2D
                            //force webGL canvas
                            ctx.drawImage(me.pvtElements["Video"], 0, 0, width, height);
                        }
                    }
                } else if (me.pvtStatus == aui.nvr.ui.WebAssemblyController.Status.DISCONNECTING) {
                    me._drawBlackFrame("Connection Failed");
                    light1 = "gray";
                } else {
                    me._drawBlackFrame("");
                }

                me._drawTitleBar(text, light1);

                me._drawAfterRender();
            }

            me.pvtDrawRequestID = window.requestAnimationFrame(me._updateVideoCanvas(me));
        };
    },

    _drawBlackFrame: function(message) {
        var me = this;
        var canvas = me.pvtElements["2DCanvas"];
        var ctx = me.pvt2DCanvasContext;
        var width = canvas.width;
        var height = canvas.height;

        ctx.fillStyle = "#000000";
        ctx.fillRect(me.pvtVideoDisplayRect.x, me.pvtVideoDisplayRect.y, me.pvtVideoDisplayRect.width, me.pvtVideoDisplayRect.height);
        
        var text = "";
        var light1 = (me.pvtStatus == aui.nvr.ui.WebAssemblyController.Status.BUFFERING) ? "yellow" : "gray";
        if (message) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#FFFFFF";
            ctx.font = '16px Arial';
            ctx.textAlign = "center";
            ctx.fillText(message, width/2, height/2);
        } else if (me.pvtTimeCode && me.pvtTimeCode > 0) {
            var time = new Date();
            time.setTime(me.pvtTimeCode * 1000);
            text = aui.lang.Date.format(time, "%Y-%m-%d %H:%i:%s %u");
        }

        me._drawTitleBar(text, light1);
    },

    _drawTitleBar: function(text, light1, light2) {
        var me = this;
        if (me.pvtTitleBarConfig.enable) {
            var canvas = me.pvtElements["2DCanvas"];
            var ctx = me.pvt2DCanvasContext;
            var width = canvas.width;

            text = text || "";
            light1 = light1 || "gray";
            light2 = light2 || "gray";

            // top bar
            ctx.globalAlpha = 1;
            if (me.pvtEventsData.trigger) {
                ctx.fillStyle = "#800000";
            } else {
                ctx.fillStyle = "#000080";
            }
            ctx.fillRect(0, 0, width, me.pvtTitleBarConfig.height);
            ctx.globalAlpha = 1;

            if (text) {
                // text
                ctx.globalAlpha = 1;
                ctx.fillStyle = "#FFFFFF";
                ctx.textAlign = "left";
                ctx.font = '14px Arial';
                ctx.textBaseline = "middle";
                ctx.fillText(text, 5, 9);
            }

            // LED
            var cx = me.options.width - 13;
            var cy = me.pvtTitleBarConfig.height / 2;
            var radius = me.pvtTitleBarConfig.height / 2 - 2;
            var borderColor = "#333333";
            for (var i = 1; i <= 2; i++) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.lineWidth = 1;
                ctx.fillStyle = (i == 1) ? light1 : light2;
                ctx.fill();
                ctx.strokeStyle = borderColor;
                ctx.stroke();

                cx -= 20;
            }
        }
    },

    _updateFisheyeMode: function () {
        var me = this;
        if (me.pvtFisheyeConfig.fisheyeObject != null) {
            var fisheyeObject = me.pvtFisheyeConfig.fisheyeObject;
            var fisheyeAdapter = me.pvtFisheyeConfig.fisheyeAdapter;
            var fisheyeMode = fisheyeObject.fisheyeMode;

            fisheyeAdapter.clearFocus();

            var mountingType = me.pvtFisheyeConfig.mountingType;
            var mode = me.pvtFisheyeConfig.mode;
            switch (mountingType) {
                case fisheyeAdapter.FisheyeMountingType.Wall:
                    switch (mode) {
                        case fisheyeAdapter.FisheyeMode.Dewarping:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Wall_Dewarping);
                            break;
                        case fisheyeAdapter.FisheyeMode.Panorama:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Wall_Panorama);
                            break;
                        case fisheyeAdapter.FisheyeMode.DoublePanorama:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Wall_DoublePanorama);
                            break;
                        case fisheyeAdapter.FisheyeMode.PanoramaFocus:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Wall_PanoramaFocus);
                            break;
                        case fisheyeAdapter.FisheyeMode.Quad:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Wall_Quad);
                            break;
                    }
                    break;
                case fisheyeAdapter.FisheyeMountingType.Ceiling:
                    switch (mode) {
                        case fisheyeAdapter.FisheyeMode.Dewarping:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ceiling_Dewarping);
                            break;
                        case fisheyeAdapter.FisheyeMode.Panorama:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ceiling_Panorama);
                            break;
                        case fisheyeAdapter.FisheyeMode.DoublePanorama:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ceiling_DoublePanorama);
                            break;
                        case fisheyeAdapter.FisheyeMode.PanoramaFocus:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ceiling_PanoramaFocus);
                            break;
                        case fisheyeAdapter.FisheyeMode.Quad:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ceiling_Quad);
                            break;
                    }
                    break;
                case fisheyeAdapter.FisheyeMountingType.Ground:
                    switch (mode) {
                        case fisheyeAdapter.FisheyeMode.Dewarping:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ground_Dewarping);
                            break;
                        case fisheyeAdapter.FisheyeMode.Panorama:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ground_Panorama);
                            break;
                        case fisheyeAdapter.FisheyeMode.DoublePanorama:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ground_DoublePanorama);
                            break;
                        case fisheyeAdapter.FisheyeMode.PanoramaFocus:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ground_PanoramaFocus);
                            break;
                        case fisheyeAdapter.FisheyeMode.Quad:
                            fisheyeObject.setFishEyeMode(fisheyeMode.Ground_Quad);
                            break;
                    }
                    break;
            }
        }
    },

    _updateVideoDisplayRect: function () {
        var me = this;

        var width = me.options.width;
        var height = me.options.height;

        //Exclude Titlebar
        if (me.pvtTitleBarConfig.enable) {
            me.pvtVideoDisplayRect.x = 0;
            me.pvtVideoDisplayRect.y = me.pvtTitleBarConfig.height;
            me.pvtVideoDisplayRect.width = width;
            me.pvtVideoDisplayRect.height = height - me.pvtTitleBarConfig.height;
        }
        else {
            me.pvtVideoDisplayRect.x = 0;
            me.pvtVideoDisplayRect.y = 0;
            me.pvtVideoDisplayRect.width = width;
            me.pvtVideoDisplayRect.height = height;
        }

        //StretchToFit
        if (me.pvtStretchToFit == false && me.pvtVideoResolution.width > 0 && me.pvtVideoResolution.height > 0) {
            var videoRatio = me.pvtVideoResolution.width / me.pvtVideoResolution.height;
            var displayRatio = me.pvtVideoDisplayRect.width / me.pvtVideoDisplayRect.height;
            if (videoRatio > displayRatio) {
                var originalHeight = me.pvtVideoDisplayRect.height;
                me.pvtVideoDisplayRect.height = me.pvtVideoDisplayRect.width / videoRatio;
                me.pvtVideoDisplayRect.y += (originalHeight - me.pvtVideoDisplayRect.height) / 2;
            }
            else {
                var originalWidth = me.pvtVideoDisplayRect.width;
                me.pvtVideoDisplayRect.width = me.pvtVideoDisplayRect.height * videoRatio;
                me.pvtVideoDisplayRect.x += (originalWidth - me.pvtVideoDisplayRect.width) / 2;
            }
        }

        //PTZData
        me.pvtOpticalPTZData.adapter.setControlSize(width, height);

        if (me.pvtFisheyeConfig.fisheyeAdapter) {
            me.pvtFisheyeConfig.fisheyeAdapter.setDisplayRect(me.pvtVideoDisplayRect.x, me.pvtVideoDisplayRect.y, me.pvtVideoDisplayRect.width, me.pvtVideoDisplayRect.height);
        }

        me.pvtDigitalPTZAdapter.setDisplayRect(me.pvtVideoDisplayRect.x, me.pvtVideoDisplayRect.y, me.pvtVideoDisplayRect.width, me.pvtVideoDisplayRect.height);

        //ROI vertex trans
        me._transferROI(me.pvtVideoDisplayRect);
    },

    _drawAfterRender: function () {
        var me = this;
        var canvas = me.pvtElements["2DCanvas"];
        var ctx = me.pvt2DCanvasContext;

        //Draw ROI
        if (me.pvtEventsData.trigger) {
            for (var i = 0; i < me.pvtEventsData.ROIs.length; i++) {
                if (me.pvtEventsData.ROIs[i].trigger) {
                    var poly = me.pvtEventsData.ROIs[i].vertex;
                    ctx.beginPath();
                    ctx.lineWidth = "1";
                    ctx.strokeStyle = "red";
                    ctx.moveTo(poly[0].x, poly[0].y);
                    for (var j = 1; j < poly.length; j++) {
                        ctx.lineTo(poly[j].x, poly[j].y);
                    }
                    ctx.lineTo(poly[0].x, poly[0].y);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        }
    },

    _transferROI: function (dstRect) {
        var me = this;
        var rois = me.pvtEventsData.ROIs;
        for (var i = 0; i < rois.length; i++) {
            var output = me._transferVertex(me.pvtEventsData.displayRect, dstRect, rois[i].vertex);
            rois[i].vertex = output;
        }

        me.pvtEventsData.displayRect = {
            x: dstRect.x,
            y: dstRect.y,
            width: dstRect.width,
            height: dstRect.height
        };
    },

    _transferVertex: function (srcRect, dstRect, vertex) {
        if (vertex.length == 0 ||
            srcRect.width == 0 ||
            srcRect.height == 0) {
            return null;
        }
        var output = [];
        for (var i = 0; i < vertex.length; i++) {
            var v = {};
            v.x = (vertex[i].x - srcRect.x) * dstRect.width / srcRect.width + dstRect.x;
            v.y = (vertex[i].y - srcRect.y) * dstRect.height / srcRect.height + dstRect.y;
            output.push(v);
        }

        return output;
    },

    // Handle WebAssemblyStreamFragment Events ======================================================
    _onConnect: function (args) {
        var me = this;
        var result = args[0];

        me.onPrintLog.fire(me.options.id + aui.lang.Date.format((new Date()), ": day%d %H:%i:%s") + " - connect " + result);

        me.pvtStatus = aui.nvr.ui.WebAssemblyController.Status.LIVE;
        if (result == 0) {
            // connection failed
            me._drawBlackFrame("Connection Failed");
        } else {
            me._drawBlackFrame(""); // waiting for video frame

            var strXML = "";
            if (me.pvtControlMode == "live") {
                strXML = me.pvtLiveAuthXML;
            } else if (me.pvtControlMode == "playback") {
                strXML = me.XML_PLAYBACK_AUTH.replace("{ACCOUNT}", me.pvtConnectionSettings.account)
                    .replace("{PASSWORD}", Base64.encode(me.pvtConnectionSettings.password))
                    .replace("{CAMERA_ID}", me.pvtConnectionSettings.cameraID)
                    .replace("{SESSION}", me.pvtSessionKey)
                    .replace("{TIME}", me.pvtTimeCode /*|| ((new Date()).getTime() / 1000)*/);
            }

            //enable PTZ
            var cameraConfigure = {
                minPanSpeed: 1,
                maxPanSpeed: 5,
                minTiltSpeed: 1,
                maxTiltSpeed: 5,
                minZoomSpeed: 1,
                maxZoomSpeed: 5,
                panOffset: 0.1,
                tiltOffset: 0.1,
                zoomOffset: 0.1,
                ptzMode: "STANDAR",  //"STANDAR", "ONVIF"
                typeONVIFPTZ: "CONTINUOUSMOVE", //"CONTINUOUSMOVE", "RELATIVEMOVE", "ABSOLUTEMOVE"
                profile: "Profile0"
            };
            me.pvtOpticalPTZData.adapter.setConfigure(cameraConfigure);

            me.pvtStreamFragmentObject.sendCertificationXML(strXML);

            var vertex = [];
            vertex.push({ x: 10, y: 10 });
            vertex.push({ x: 1910, y: 10 });
            vertex.push({ x: 1910, y: 1070 });
            vertex.push({ x: 10, y: 1070 });
            me.setROISetting(1, vertex, {width: 1920, height:1080});
        }

        me.onConnect.fire(result);
    },

    _onConnectionRecovery: function (args) {
        var me = this;

        me.onPrintLog.fire(me.options.id + aui.lang.Date.format((new Date()), ": day%d %H:%i:%s") + " - recovery");

        me.pvtStatus = aui.nvr.ui.WebAssemblyController.Status.LIVE;
        var strXML = "";
        if (me.pvtControlMode == "live") {
            strXML = me.pvtLiveAuthXML;
        } else if (me.pvtControlMode == "playback") {
            strXML = me.XML_PLAYBACK_AUTH.replace("{ACCOUNT}", me.pvtConnectionSettings.account)
                .replace("{PASSWORD}", Base64.encode(me.pvtConnectionSettings.password))
                .replace("{CAMERA_ID}", me.pvtConnectionSettings.cameraID)
                .replace("{SESSION}", me.pvtSessionKey)
                .replace("{TIME}", me.pvtTimeCode /*|| ((new Date()).getTime() / 1000)*/);
        }
        
        me._drawBlackFrame(""); // waiting for video frame
        me.pvtStreamFragmentObject.sendCertificationXML(strXML);
    },

    _onNetworkLoss: function (args) {
        var me = this;

        me.onPrintLog.fire(me.options.id + aui.lang.Date.format((new Date()), ": day%d %H:%i:%s") + " - networkloss");

        if (me.pvtCheckLiveTimer) {
            window.clearTimeout(me.pvtCheckLiveTimer);
            me.pvtCheckLiveTimer = 0;
        }

        me.pvtStatus = aui.nvr.ui.WebAssemblyController.Status.DISCONNECTING;

        me._drawBlackFrame("Connection Failed");
    },

    _onDisconnect: function (args) {
        var me = this;
        
        me.onPrintLog.fire(me.options.id + aui.lang.Date.format((new Date()), ": day%d %H:%i:%s") + " - disconnect");

        if (me.pvtCheckLiveTimer) {
            window.clearTimeout(me.pvtCheckLiveTimer);
            me.pvtCheckLiveTimer = 0;
        }

        me.pvtStatus = aui.nvr.ui.WebAssemblyController.Status.IDLE;
        me.resetDataParameters();
        if (me.pvtWebGL.webGLDrawer) {
            me.pvtWebGL.videoTexture = me.pvtWebGL.webGLDrawer.createTextureObject();
        }
        me.pvtPlayerData.working = false;
        me.pvtCurCodec = null;
        me.pvtIsEmptyFrame = true;
        me._drawBlackFrame("");

        if (me.pvtDrawRequestID) {
            window.cancelAnimationFrame(me.pvtDrawRequestID);
            me.pvtDrawRequestID = null;
        }

        me.onDisconnect.fire(args);
    },

    FRAGMENT_PACK: {
        IFRME: 0x20,
        B2MPT: 0x10,
        B2PCK: 0x08,
        HEADR: 0x04,
        AUDIO: 0x02,
        VIDEO: 0x01
    },
    _frameCallBack: function (args) {
        var me = this;
        if (!me.pvtStreamFragment || !me.pvtStreamFragment.isInitialized()) return;

        var buf = args[0],
            len = args[1],
            type = args[2],
            b2h = args[3];

        /*
         * Audio will not have B2 header started form seconds audio frame (Maybe we could pack)
         * Time code only catch from video frame
        */

        //Time code
        if (!(type & me.FRAGMENT_PACK.AUDIO) && b2h && b2h.TS_sec) { // video frame time code
            //Update tie code
            me.pvtTimeCode = Number(b2h.TS_sec) + (Number(b2h.TS_usec) / 1000000);
            me.onTimeCallBack.fire(me.pvtTimeCode);
            
            if (me.pvtControlMode == "live") {
                //Live Check
                if (me.pvtCheckLiveTimer) {
                    window.clearTimeout(me.pvtCheckLiveTimer);
                    me.pvtCheckLiveTimer = 0;
                }

                me.pvtCheckLiveTimer = window.setTimeout(function () {
                    me.pvtTimeCode = -1;
                    me._drawBlackFrame("");

                    window.clearTimeout(me.pvtCheckLiveTimer);
                    me.pvtCheckLiveTimer = 0;
                }, 3000);
            }
        }

        //Empty frame check
        if (type & me.FRAGMENT_PACK.B2MPT) {  // empty B2 header.
            if (!me.pvtIsEmptyFrame) {
                if (me.pvtControlMode == "playback" && b2h && b2h.isPre == 0) {
                    me._drawBlackFrame("");
                    me.pvtIsEmptyFrame = true;
                } else if (me.pvtControlMode == "live") {
                    me.pvtIsEmptyFrame = true;
                }
            }
            //Empty frame, Don't process farer
            return;
        } else if (type & me.FRAGMENT_PACK.VIDEO) {   // video frame
            me.pvtIsEmptyFrame = false;
        }

        //It is not empty frame
        if (b2h) {
            //Update Rotate Status
            me.pvtRotateStatus = b2h.Rotation * 90;

            //Update Codec
            me.pvtCurCodec = b2h.Type;
        }

        //Audio update sync-delay
        if ((type & me.FRAGMENT_PACK.AUDIO) && b2h) {
            //Audio frame got B2 header means audio first frame
            //  Update sync-delay
			switch (b2h.Type) {
			    case 10:
				    me.pvtMediaData["Audio"].delay = Number(me.options.maxDelay);//0.384;
				    me.pvtMediaData["Video"].delay = 0;
				    break;
			    case 2:
			    case 3:
			    case 6:
			    case 7:
			    case 8:
			    case 9:
			    case 16:
				    me.pvtMediaData["Audio"].delay = Number(me.options.maxDelay);//0.384;
				    me.pvtMediaData["Video"].delay = 0.384;
				    break;
			    default:
				    me.pvtMediaData["Audio"].delay = 0;
				    me.pvtMediaData["Video"].delay = Number(me.options.maxDelay);
				    break;
			}
        }

        //JPEG special
        if (b2h && b2h.Type == 4) {
            if (me.pvtElements["Image"].complete == false) {
                return;
            }
            var preblob = me.pvtElements["Image"].src;

            var JEPGbuf = new Uint8Array(me.pvtStreamFragment.HEAPU8.subarray(buf, (buf + len)));
            var datablob = new Blob([JEPGbuf]);
            var blob = URL.createObjectURL(datablob);
            me.pvtElements["Image"].src = blob;
            URL.revokeObjectURL(preblob);
            
            me.pvtPlayerData.working = true;
            return;
        }

        var dataType = "";
        var data = null;
        var target = null;
        if (type & me.FRAGMENT_PACK.VIDEO) {
            dataType = "Video";
        } else if (type & me.FRAGMENT_PACK.AUDIO) {
            dataType = "Audio";
		}
        if (!dataType) return;
        data = me.pvtMediaData[dataType];
        target = me.pvtElements[dataType];

        if (data == null || data.mediaSource == null) {
			//trace((type & 0x0f) + " mediaSource is null");
			return;
		}

        if (buf && len) {
            var heapu8Buffer = me.pvtStreamFragment.HEAPU8.subarray(buf, (buf + len));

			if (data.framebuffer == null) {
				data.framebuffer = new Uint8Array( len );
				data.framebuffer.set( heapu8Buffer, 0 );
			} else {
                var tmpBuffer = new Uint8Array( data.framebuffer.byteLength + heapu8Buffer.byteLength );
			    tmpBuffer.set( data.framebuffer, 0 );
			    tmpBuffer.set( heapu8Buffer, data.framebuffer.byteLength );

                data.framebuffer = tmpBuffer;
			}
        }

        //remove buffer point set
        if (type & me.FRAGMENT_PACK.VIDEO && b2h
            && b2h.isIframe && data.removeBufferNextPoint == 0
            && data.sourceBuffer
            && data.sourceBuffer.buffered.length > 0) {
        
            let index = data.sourceBuffer.buffered.length - 1;
            if (data.removeBufferPoint == 0) {
                data.removeBufferPoint = data.sourceBuffer.buffered.end(index);
            } else if (data.sourceBuffer.buffered.end(index) - data.removeBufferPoint > 4) {
                data.removeBufferNextPoint = data.sourceBuffer.buffered.end(index);
            }
        
        } else if (type & me.FRAGMENT_PACK.AUDIO && data.removeBufferNextPoint == 0
            && data.sourceBuffer
            && data.sourceBuffer.buffered.length > 0) {
        
            let index = data.sourceBuffer.buffered.length - 1;
            if (data.removeBufferPoint == 0) {
                data.removeBufferPoint = data.sourceBuffer.buffered.end(index);
            } else if (data.sourceBuffer.buffered.end(index) - data.removeBufferPoint > 4) {
                data.removeBufferNextPoint = data.sourceBuffer.buffered.end(index);
            }
        
        }

        if (data.updateflag == false
			&& data.framebuffer
			&& data.mediaSource.sourceBuffers.length
            && data.sourceBuffer
            && data.sourceBuffer.updating == false) {

            if (target.error) {
                target.onerror();
            } else {
                
			    data.sourceBuffer.appendBuffer(data.framebuffer);
                
			    data.framebuffer = null;
                data.updateflag = true;
            }
        }

        //Debug FPS
        if (me.pvtPlayerData.working) {
            // audio
            if (me.pvtElements["Audio"]) {
                if (isNaN(me.pvtElements["Audio"].duration)) {
                    me.pvtMediaData["Audio"].buffered = 0;
                } else {
                    me.pvtMediaData["Audio"].buffered = (me.pvtElements["Audio"].duration - me.pvtElements["Audio"].currentTime).toFixed(2);
                }
            }
        
            // video
            if (isNaN(me.pvtElements["Video"].duration)) {
                me.pvtMediaData["Video"].buffered = 0;
            } else {
                me.pvtMediaData["Video"].buffered = (me.pvtElements["Video"].duration - me.pvtElements["Video"].currentTime).toFixed(2);
            }
        
            me.pvtDebugBufMessage = "buffered:" + me.pvtMediaData["Video"].buffered + ', ' + me.pvtMediaData["Audio"].buffered;
            me._printDebug(me.pvtDebugBufMessage + me.pvtDebugFPSMessage);
        }
    },
    _eventCallBack: function (args) {
        var me = this;
        if (!me.pvtStreamFragment || !me.pvtStreamFragment.isInitialized()) return;
    
        var type = args[0],
            ev = args[1];
    
        switch (type) {
            case me.pvtStreamFragment.eventType.motionDetection:
                me.pvtEventsData.trigger = false;
                for (var i = 0; i < me.pvtEventsData.ROIs.length; i++) {
                    if (me.pvtEventsData.ROIs[i]) {
                        me.pvtEventsData.ROIs[i].trigger = ev.motion[me.pvtEventsData.ROIs[i].id];
                    }
                    if (me.pvtEventsData.ROIs[i].trigger) {
                        me.pvtEventsData.trigger = true;
                    }
                }
                break;
            default:
                return;
        }
    },

    FRAGMENT_HEADER_TYPE: {
        H264: 1,
        H265: 2,
        AUDIO: 3,
        MJPEG: 4
    },
    _playerInitialCallBack: function (args) {
        var me = this;
        var type = args[0],
            buf = args[1],
            len = args[2];

        //trace(args);
        var codec = new Uint8Array( len );
        codec.set( me.pvtStreamFragment.HEAPU8.subarray(buf, buf+len), 0);

        var dataType = "";
        var data = null;
        var codecname = null;
        if (type & me.FRAGMENT_PACK.VIDEO) {
            dataType = "Video";
            data = me.pvtMediaData[dataType];
            if (len == 1 && codec[0] == me.FRAGMENT_HEADER_TYPE.MJPEG) {
                codecname = "MJPEG";
            } else if (len == 1 && codec[0] == me.FRAGMENT_HEADER_TYPE.H265) {
				codecname = 'video/mp4; codecs="hev1"';
            } else if (len == 4 && codec[0] == me.FRAGMENT_HEADER_TYPE.H264) {
				codecname = 'video/mp4; codecs="avc1.';
				if (codec[1] < 16) {
					codecname += "0";
				}
				codecname += codec[1].toString(16).toUpperCase();
				if (codec[2] < 16) {
					codecname += "0";
				}
				codecname += codec[2].toString(16).toUpperCase();
				if (codec[3] < 16) {
					codecname += "0";
				}
				codecname += codec[3].toString(16).toUpperCase();
				codecname += '"';
			} else {
				trace("cdec = " + codec[0] + ", len " + len);
			}
        } else if (type & me.FRAGMENT_PACK.AUDIO) {
            dataType = "Audio";
            data = me.pvtMediaData[dataType];
			codecname = 'audio/mp4; codecs="mp4a.40.2"';
		}

        if (data && codecname) {
            data.reset();
            me._initialCodec(dataType, codecname);
		}
    },

    _onQueueClear: function (args) {
        var me = this;
        var queue = args[0];

        me.onPrintLog.fire(me.options.id + aui.lang.Date.format((new Date()), ": day%d %H:%i:%s") + " - queueClear");

    }
});

aui.nvr.ui.WebAssemblyController.Status = {
    IDLE : 0,
    BUFFERING : 2,
    LIVE : 4,
    HISTORY : 8,
    PAUSED : 16,
    NOSIGNAL : 32,
    DISCONNECTING : 10
};