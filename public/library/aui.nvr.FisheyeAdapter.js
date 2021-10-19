aui.nvr.FisheyeAdapter = function () {
    this.pvtEnable = false;
    this.pvtMountingType = this.FisheyeMountingType.Wall;
    this.pvtMode = this.FisheyeMode.OriginalView;
    this.pvtControl = false;
    this.pvtAbsoluteDownPoint = { x: -1, y: -1 };

    this.pvtCurrentSettings = {};

    this.pvtVideoSize = {
        width: 0,
        height:0
    };

    this.pvtFocusIndex = -1;

    this.pvtDisplayRect = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    };

    this.pvtViewRectList = [];

    this.pvtSubWindowRect = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    };

    this.pvtPTZSpeed = {
        pan: 0,
        tilt: 0,
        zoom: 0
    };
    this.pvtPTZProcess = null;

    this.onEnable = new aui.lang.util.CustomEvent("onEnable", this);
    this.onEnableSubWindow = new aui.lang.util.CustomEvent("onEnableSubWindow", this);
    this.onSetMountingType = new aui.lang.util.CustomEvent("onSetMountingType", this);
    this.onSetMode = new aui.lang.util.CustomEvent("onSetMode", this);
    this.onSetPTZMoveTo = new aui.lang.util.CustomEvent("onSetPTZMoveTo", this);
    this.onGetPTZMoveTo = new aui.lang.util.CustomEvent("onGetPTZMoveTo", this);
    this.onSetMoveTo = new aui.lang.util.CustomEvent("onSetMoveTo", this);
    this.onSetCircle = new aui.lang.util.CustomEvent("onSetCircle", this);
    this.onVideoResolutionChange = new aui.lang.util.CustomEvent("onVideoResolutionChange", this);
    this.onDisplayRectChange = new aui.lang.util.CustomEvent("onDisplayRectChange", this);
    this.onSetRelativeMove = new aui.lang.util.CustomEvent("onSetRelativeMove", this);
    this.onSetWindowRelativeMove = new aui.lang.util.CustomEvent("onSetWindowRelativeMove", this);
    this.onUpdate = new aui.lang.util.CustomEvent("onUpdate", this);
};

aui.nvr.FisheyeAdapter.prototype = {
    setEnable: function (enable) {
        this.releaseControlPoint();
        this.pvtEnable = enable;
        this.onEnable.fire(enable && this.pvtMode != this.FisheyeMode.OriginalView ? true : false);
	    this.onUpdate.fire();
    },

    isEnable: function () {
        return this.pvtEnable;
    },

    setVideoResolution: function (width, height) {
        this.pvtVideoSize.width = width;
        this.pvtVideoSize.height = height;
        this._updateSubwindowPos();
        this.onVideoResolutionChange.fire({ width: width, height: height });
    },

    setDisplayRect: function (x, y, width, height) {
        this.pvtDisplayRect.left = x;
        this.pvtDisplayRect.top = y;
        this.pvtDisplayRect.right = x + width - 1;
        this.pvtDisplayRect.bottom = y + height - 1;

        this._setViewListRect();
        this._updateSubwindowPos();
        this.onDisplayRectChange.fire({ x: x, y: y, width: width, height: height });
    },

    FisheyeMountingType: {
        Wall: 0,
        Ceiling: 1,
        Ground: 2
    },

    setMountingType: function(type) {
        this.pvtMountingType = type;
        this.onSetMountingType.fire(type);
    },

    getMountingType: function () {
        return this.pvtMountingType;
    },

    FisheyeMode: {
        OriginalView: 0,
        Dewarping: 1,
        Panorama: 2,
        DoublePanorama: 3,
        PanoramaFocus: 4,
        Quad: 5
    },

    setMode: function (mode) {
        this.pvtFocusIndex = -1;
	    //Save current setting before change mode
	    {
		    var views = 0;
		    switch (this.pvtMode) {
			    case this.FisheyeMode.Dewarping:
			    case this.FisheyeMode.Panorama:
				    views = 1;
			        break;
			    case this.FisheyeMode.DoublePanorama:
				    views = 2;
			        break;
			    case this.FisheyeMode.PanoramaFocus:
				    views = 3;
			        break;
			    case this.FisheyeMode.Quad:
				    views = 4;
			        break;
		    }

            if (this.pvtCurrentSettings[this.pvtMode] == undefined) {
                this.pvtCurrentSettings[this.pvtMode] = [];
            }
            var currentSettingList = this.pvtCurrentSettings[this.pvtMode];
            for (var i = 0; i < views; ++i) {
                var PTZ = { pan: 0, tilt: 0, zoom: 0 };
                this.onGetPTZMoveTo.fire(i, PTZ);

                if (currentSettingList[i] == undefined) {
                    currentSettingList[i] = {};
                }

				var currentSetting = currentSettingList[i];
                currentSetting.pan = PTZ.pan;
                currentSetting.tilt = PTZ.tilt;
                currentSetting.zoom = PTZ.zoom;
			}
	    }
		
	    //Change mode
	    this.pvtMode = mode;
	    if (this.pvtMode == this.FisheyeMode.OriginalView)
        {
            this.onEnable.fire(false);
	    }
	    else
	    {
            this.onEnable.fire(true);
			this.onSetMode.fire(this.pvtMode);

		    //Set default setting if exist 
            var currentSettingList = this.pvtCurrentSettings[this.pvtMode];
            if (currentSettingList)
			{
                var currentSettingSize = currentSettingList.length;
				for (var i = 0; i < currentSettingSize; ++i)
                {
                    this.onSetPTZMoveTo.fire(i, currentSettingList[i]);
				}
			}
	    }

	    this._setViewListRect();

		if (mode == this.FisheyeMode.Dewarping)
        {
            this.onEnableSubWindow.fire(true);
		}
		else
		{
            this.onEnableSubWindow.fire(false);
		}

        this.onUpdate.fire();
    },

    getMode: function () {
        return this.pvtMode;
    },

    setFisheyeCircle: function (x, y, radius, width, height) {
        this.onSetCircle.fire({ x: x, y: y, radius: radius, width: width, height: height });
    },

    PTZCMD: {
        noCMD: 0,
        panLeft: 1,
        panRight: 2,
        panStop: 3,
        tiltUp: 4,
        tiltDown: 5,
        tiltStop: 6,
        zoomIn: 7,
        zoomOut: 8,
        zoomStop: 9,
        allStop: 10,
    },

    sendPTZCommand: function (cmd, speed) {
        switch (cmd) {
            case this.PTZCMD.panLeft:
                this.pvtPTZSpeed.pan = (this.pvtMountingType == this.FisheyeMountingType.Ground) ? speed : -speed;
                break;
            case this.PTZCMD.panRight:
                this.pvtPTZSpeed.pan = (this.pvtMountingType == this.FisheyeMountingType.Ground) ? -speed : speed;
                break;
		    case this.PTZCMD.panStop:
                this.pvtPTZSpeed.pan = 0;
                break;
		    case this.PTZCMD.tiltUp:
                this.pvtPTZSpeed.tilt = speed;
                break;
		    case this.PTZCMD.tiltDown:
                this.pvtPTZSpeed.tilt = -speed;
                break;
		    case this.PTZCMD.tiltStop:
                this.pvtPTZSpeed.tilt = 0;
                break;
		    case this.PTZCMD.zoomIn:
                this.pvtPTZSpeed.zoom = -speed;
                break;
		    case this.PTZCMD.zoomOut:
                this.pvtPTZSpeed.zoom = speed;
                break;
		    case this.PTZCMD.zoomStop:
                this.pvtPTZSpeed.zoom = 0;
                break;
		    case this.PTZCMD.allStop:
                this.pvtPTZSpeed.pan = 0;
                this.pvtPTZSpeed.tilt = 0;
                this.pvtPTZSpeed.zoom = 0;
                break;
        }

        if ((this.pvtPTZSpeed.pan != 0 || this.pvtPTZSpeed.tilt != 0 || this.pvtPTZSpeed.zoom != 0) && this.pvtPTZProcess == null) {
            this.pvtPTZProcess = setInterval(this._PTZProcess, 100, this);
        }
    },

    setControlPoint: function (x, y) {
        if (this.pvtEnable)
        {
            var point = { x: x, y: y };
            if (this._isInRect(this.pvtDisplayRect, point))
            {
                this.pvtControl = true;
                var useAbsolute = (this.pvtMode == this.FisheyeMode.Dewarping || (this.pvtMode == this.FisheyeMode.PanoramaFocus && this.pvtFocusIndex != 0) || this.pvtMode == this.FisheyeMode.Quad) && this.pvtFocusIndex != -1;
                //Absolute PTZ
                if (this.pvtMode == this.FisheyeMode.Dewarping && this._isInRect(this.pvtSubWindowRect, point))	//SubWindow
                {
                    var subWindowRect = this.pvtSubWindowRect;
                    var subWindowWidthRange = subWindowRect.right - subWindowRect.left;
                    var subWindowHeightRange = this.pvtSubWindowRect.bottom - this.pvtSubWindowRect.top;
                    var mappedX = parseInt((point.x - subWindowRect.left) * (this.pvtVideoSize.width - 1) / subWindowWidthRange) - parseInt(this.pvtVideoSize.width / 2);
                    var mappedY = -(parseInt((point.y - subWindowRect.top) * (this.pvtVideoSize.height - 1) / subWindowHeightRange) - parseInt(this.pvtVideoSize.height / 2));
                    this.onSetMoveTo.fire(0, { x: mappedX, y: mappedY });
                    this.onUpdate.fire();
                }
                else if (useAbsolute && this._isInRect(this.pvtViewRectList[this.pvtFocusIndex], point)) {
                    this.pvtAbsoluteDownPoint = point;

                    var focusRect = this.pvtViewRectList[this.pvtFocusIndex];
                    var focusHalfWidth = parseInt((focusRect.right - focusRect.left + 1) / 2);
                    var focusHalfHeight = parseInt((focusRect.bottom - focusRect.top + 1) / 2);

                    var absulutePointX = point.x - focusRect.left - focusHalfWidth
                    var absulutePointY = -(point.y - focusRect.top - focusHalfHeight);
                    this.onSetWindowRelativeMove.fire(this.pvtFocusIndex, { x: absulutePointX, y: absulutePointY });
                    this.onUpdate.fire();
                }

                //Set focus
                if (this.pvtMode == this.FisheyeMode.Dewarping || this.pvtMode == this.FisheyeMode.Panorama)
                {
                    this.pvtFocusIndex = 0;
                }
			    else if (this.pvtMode == this.FisheyeMode.DoublePanorama)
                {
                    if (this.pvtMountingType == this.FisheyeMountingType.Wall && this.pvtViewRectList.length == 2)
                    {
                        if (this._isInRect(this.pvtViewRectList[0], point)) {
                            this.pvtFocusIndex = 0;
                        }
                        else {
                            this.pvtFocusIndex = -1;
                        }
                    }
				    else
				    {
                        this.pvtFocusIndex = -1;
                    }
                }
                else if (this.pvtMode == this.FisheyeMode.PanoramaFocus && this.pvtViewRectList.length == 3)
                {
                    if (this.pvtMountingType == this.FisheyeMountingType.Wall && this._isInRect(this.pvtViewRectList[0], point))
                    {
                        this.pvtFocusIndex = 0;
                    }
                    else if (this._isInRect(this.pvtViewRectList[1], point)) {
                        this.pvtFocusIndex = 1;
                    }
                    else if (this._isInRect(this.pvtViewRectList[2], point)) {
                        this.pvtFocusIndex = 2;
                    }
                    else {
                        this.pvtFocusIndex = -1;
                    }
                }
		        else if (this.pvtMode == this.FisheyeMode.Quad && this.pvtViewRectList.length == 4)
                {
                    if (this._isInRect(this.pvtViewRectList[0], point)) {
                        this.pvtFocusIndex = 0;
                    }
                    else if (this._isInRect(this.pvtViewRectList[1], point)) {
                        this.pvtFocusIndex = 1;
                    }
                    else if (this._isInRect(this.pvtViewRectList[2], point)) {
                        this.pvtFocusIndex = 2;
                    }
                    else if (this._isInRect(this.pvtViewRectList[3], point)) {
                        this.pvtFocusIndex = 3;
                    }
                    else {
                        this.pvtFocusIndex = -1;
                    }
                }

                this.moveControlPoint(point.x, point.y);
                return true;
	        }
	    }

        return false;
    },

    moveControlPoint: function (x, y) {
        var ret = false;
        if (this.pvtEnable && this.pvtControl) {
            var cmd = this.PTZCMD.noCMD;
            var speed = 0;
            var point = { x: x, y: y };

            if (this.pvtMountingType == this.FisheyeMountingType.Wall && (this.pvtMode == this.FisheyeMode.Panorama || this.pvtMode == this.FisheyeMode.DoublePanorama || this.pvtMode == this.FisheyeMode.PanoramaFocus))
            {
                if (this.pvtFocusIndex == 0 && this.pvtViewRectList.length > 0) {
                    var focusRect = this.pvtViewRectList[0];
                    speed = this._getPTZTiltSpeed(focusRect, point);
                    cmd = speed < 0 ? this.PTZCMD.tiltUp : this.PTZCMD.tiltDown;
                }
            }
            else if (this.pvtMode == this.FisheyeMode.DoublePanorama && this.pvtViewRectList.length == 2 && (this.pvtMountingType == this.FisheyeMountingType.Ceiling || this.pvtMountingType == this.FisheyeMountingType.Ground))
            {
                speed = this._getPTZPanSpeed(this.pvtDisplayRect, point);
                cmd = speed < 0 ? this.PTZCMD.panLeft : this.PTZCMD.panRight;
            }

            if (cmd != this.PTZCMD.noCMD)
            {
                this.sendPTZCommand(cmd, Math.abs(speed));
                ret = true;
            }
        }
        return ret;
    },

    releaseControlPoint() {
        this.pvtControl = false;
        this.sendPTZCommand(this.PTZCMD.allStop);
        this.pvtAbsoluteDownPoint = { x: -1, y: -1 };
        this.onUpdate.fire();
    },

    FisheyeCursor: {
        Undefined: 0,
        Normal: 1,
        Up: 2,
        Down: 3,
        Left: 4,
        Right: 5
    },

    getCursor: function () {
        var retCursor = this.FisheyeCursor.Undefined;

        if (this.pvtEnable) {
            switch (this.pvtMode) {
                case this.FisheyeMode.Dewarping:
			    case this.FisheyeMode.Quad:
                    if (this._isInRect(this.pvtDisplayRect, point)) {
                        retCursor = this.FisheyeCursor.Normal;
                    }
                    break;
                case this.FisheyeMode.Panorama:
			    case this.FisheyeMode.PanoramaFocus:
                    if (this.pvtMountingType == this.FisheyeMountingType.Wall && this.pvtViewRectList.length > 0) {
                        if (this.pvtFocusIndex == 0) {
                            var focusRect = this.pvtViewRectList[0];
                            var focusCenter = this._getCenterPoint(focusRect);

                            if (point.y >= focusRect.top && point.y < focusCenter.y) {
                                retCursor = this.FisheyeCursor.Up;
                            }
                            else if (point.y >= focusCenter.y && point.y < focusRect.bottom) {
                                retCursor = this.FisheyeCursor.Down;
                            }
                            else {
                                retCursor = this.FisheyeCursor.Normal;
                            }
                        }
                        else {
                            retCursor = this.FisheyeCursor.Normal;
                        }
                    }
                    break;
                case this.FisheyeMode.DoublePanorama:
                    if (this.pvtViewRectList.length == 2) {
                        if (this.pvtMountingType == this.FisheyeMountingType.Wall)
                        {
                            if (this.pvtFocusIndex == 0) {
                                var focusRect = this.pvtViewRectList[0];
                                var focusCenter = this._getCenterPoint(focusRect);

                                if (point.y >= focusRect.top && point.y < focusCenter.y) {
                                    retCursor = this.FisheyeCursor.Up;
                                }
                                else if (point.y >= focusCenter.y && point.y < focusRect.bottom) {
                                    retCursor = this.FisheyeCursor.Down;
                                }
                                else if (this._isInRect(this.pvtViewRectList[1], point)) {
                                    retCursor = this.FisheyeCursor.Normal;
                                }
                            }
                            else {
                                retCursor = this.FisheyeCursor.Normal;
                            }
                        }
					else if (this.pvtMountingType == this.FisheyeMountingType.Ceiling || this.pvtMountingType == this.FisheyeMountingType.Ground)
                    {
                        var displayRect = this.pvtDisplayRect;
                        var displayCenter = this._getCenterPoint(displayRect);

                        if (this._isInRect(displayRect, point)) {
                            if (point.x >= displayRect.left && point.x < displayCenter.x) {
                                retCursor = this.FisheyeCursor.Left;
                            }
                            else if (point.x >= displayCenter.x && point.x < displayRect.right) {
                                retCursor = this.FisheyeCursor.Right;
                            }
                            else if (this._isInRect(this.pvtViewRectList[1], point)) {
                                retCursor = this.FisheyeCursor.Normal;
                            }
                        }
                    }
                }
                break;
            }
        }

	    return retCursor;
    },

    getSubWindowRect: function () {
        return {
            x: this.pvtSubWindowRect.left,
            y: this.pvtSubWindowRect.top,
            width: this.pvtSubWindowRect.right - this.pvtSubWindowRect.left + 1,
            height: this.pvtSubWindowRect.bottom - this.pvtSubWindowRect.top + 1
        };
    },

    zoomIn: function (speed) {
        var ret = false;
        if (this.pvtEnable && this.pvtFocusIndex != -1 && (this.pvtMode == this.FisheyeMode.Dewarping || this.pvtMode == this.FisheyeMode.PanoramaFocus || this.pvtMode == this.FisheyeMode.Quad)) {
            this.onSetRelativeMove.fire(this.pvtFocusIndex, { pan: 0, tilt: 0, zoom: -(speed * 20) });
            this.onUpdate.fire();
            ret = true;
        }
        return ret;
    },

    zoomOut: function (speed) {
        var ret = false;
        if (this.pvtEnable && this.pvtFocusIndex != -1 && (this.pvtMode == this.FisheyeMode.Dewarping || this.pvtMode == this.FisheyeMode.PanoramaFocus || this.pvtMode == this.FisheyeMode.Quad))
        {
            this.onSetRelativeMove.fire(this.pvtFocusIndex, { pan: 0, tilt: 0, zoom: speed * 20 });
            this.onUpdate.fire();
            ret = true;
        }
        return ret;
    },

    setAbsolutePTZ: function (idx, pan, tilt, zoom) {
        this.onSetPTZMoveTo.fire(idx, { pan: pan, tilt: tilt, zoom: zoom });
        this.onUpdate.fire();
    },

    getFocusRect: function () {
        var rect = null;
        if (this.pvtEnable) {
            if (this.pvtViewRectList.length > 1 && this.pvtFocusIndex != -1 && this.pvtFocusIndex < this.pvtViewRectList.length) {
                var focusRect = this.pvtViewRectList[this.pvtFocusIndex];
                rect = {
                    x: focusRect.left,
                    y: focusRect.top,
                    width: focusRect.right - focusRect.left + 1,
                    height: focusRect.bottom - focusRect.top + 1
                };
            }
        }
        return rect;
    },

    getAbsolutePoint: function () {
        var point = null;
        if (this.pvtEnable && this.pvtControl && this.pvtAbsoluteDownPoint.x > 0 && this.pvtAbsoluteDownPoint.y > 0) {
            point = this.pvtAbsoluteDownPoint;
        }
        return point;
    },

    clearFocus: function () {
        this.pvtFocusIndex = -1;
    },

    //Private functions

    _isInRect: function (rect, point) {
        return (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom);
    },

    _getCenterPoint: function (rect) {
        return { x: parseInt((rect.left + rect.right + 1) / 2), y: parseInt((rect.top + rect.bottom + 1) / 2) };
    },

    _setViewListRect: function () {
        var displayRect = this.pvtDisplayRect;
        var displayHalfWidth = (displayRect.right - displayRect.left + 1) / 2;
        var displayHalfHeight = (displayRect.bottom - displayRect.top + 1) / 2;
        switch (this.pvtMode) {
            case this.FisheyeMode.Dewarping:
		    case this.FisheyeMode.Panorama:
                this.pvtViewRectList = [displayRect];
                break;
            case this.FisheyeMode.DoublePanorama:
                this.pvtViewRectList =
                    [
                        { left: displayRect.left, top: displayRect.top, right: displayRect.right, bottom: displayRect.top + displayHalfHeight - 1 },
                        { left: displayRect.left, top: displayRect.top + displayHalfHeight, right: displayRect.right, bottom: displayRect.bottom }
                    ];
                break;
            case this.FisheyeMode.PanoramaFocus:
                this.pvtViewRectList =
                    [
                        { left: displayRect.left, top: displayRect.top, right: displayRect.right, bottom: displayRect.top + displayHalfHeight - 1 },
                        { left: displayRect.left, top: displayRect.top + displayHalfHeight, right: displayRect.left + displayHalfWidth - 1, bottom: displayRect.bottom },
                        { left: displayRect.left + displayHalfWidth, top: displayRect.top + displayHalfHeight, right: displayRect.right, bottom: displayRect.bottom }
                    ];
                break;
            case this.FisheyeMode.Quad:
                this.pvtViewRectList =
                    [
                        { left: displayRect.left, top: displayRect.top, right: displayRect.left + displayHalfWidth - 1, bottom: displayRect.top + displayHalfHeight - 1 },
                        { left: displayRect.left + displayHalfWidth, top: displayRect.top, right: displayRect.right, bottom: displayRect.top + displayHalfHeight - 1 },
                        { left: displayRect.left, top: displayRect.top + displayHalfHeight, right: displayRect.left + displayHalfWidth - 1, bottom: displayRect.bottom },
                        { left: displayRect.left + displayHalfWidth, top: displayRect.top + displayHalfHeight, right: displayRect.right, bottom: displayRect.bottom }
                    ];
                break;
        }
    },

    _PTZProcess: function (me) {
        if (me.pvtPTZSpeed.pan != 0 && me.pvtMode == me.FisheyeMode.DoublePanorama && (me.pvtMountingType == me.FisheyeMountingType.Ceiling || me.pvtMountingType == me.FisheyeMountingType.Ground)) {
            var PTZ = { pan: 0, tilt: 0, zoom: 0 };
            me.onGetPTZMoveTo.fire(0, PTZ);
            me.onSetPTZMoveTo.fire(0, { pan: PTZ.pan + me.pvtPTZSpeed.pan * 100, tilt: 0, zoom: 0 });

            me.onGetPTZMoveTo.fire(1, PTZ);
            me.onSetPTZMoveTo.fire(1, { pan: PTZ.pan + me.pvtPTZSpeed.pan * 100, tilt: 0, zoom: 0 });

            me.onUpdate.fire();
        }
        else if (me.pvtPTZSpeed.pan != 0 || me.pvtPTZSpeed.tilt != 0) {
            me.onSetRelativeMove.fire(me.pvtFocusIndex, { pan: parseInt(me.pvtPTZSpeed.pan * 10 * 16.5), tilt: parseInt(me.pvtPTZSpeed.tilt * 10 * 16.5), zoom: 0 });
            me.onUpdate.fire();
        }
        else {
            clearInterval(me.pvtPTZProcess);
            me.pvtPTZProcess = null;
        }
    },

    _getPTZPanSpeed: function (rect, point) {
        var panSpeed = 0;
        var centerPoint = this._getCenterPoint(rect);
        var PTZRateX = parseInt(parseInt((rect.right - rect.left + 1) / 2) / 5);
        if (PTZRateX != 0) {
            var centerDifference = Math.abs(point.x - centerPoint.x);
            panSpeed = (centerPoint.x > point.x ? -1 : 1) * (parseInt(centerDifference / PTZRateX) + ((centerDifference % PTZRateX) > 0 ? 1 : 0));

            if (panSpeed < -5)
                panSpeed = -5;

            if (panSpeed > 5)
                panSpeed = 5;
        }
        return panSpeed;
    },

    _getPTZTiltSpeed: function (rect, point) {
        var tiltSpeed = 0;
        var centerPoint = this._getCenterPoint(rect);
        var PTZRateY = parseInt(parseInt((rect.bottom - rect.top + 1) / 2) / 5);
        if (PTZRateY != 0) {
            var centerDifference = Math.abs(point.y - centerPoint.y);
            tiltSpeed = (centerPoint.y > point.y ? -1 : 1) * (parseInt(centerDifference / PTZRateY) + ((centerDifference % PTZRateY) > 0 ? 1 : 0));

            if (tiltSpeed < -5)
                tiltSpeed = -5;

            if (tiltSpeed > 5)
                tiltSpeed = 5;
        }
        return tiltSpeed;
    },

    _updateSubwindowPos: function () {
        var displayRect = this.pvtDisplayRect;

        var controlWidth = displayRect.right - displayRect.left + 1;
        var controlHeight = displayRect.bottom - displayRect.top + 1;

        if (controlWidth > 40 && controlHeight > 40) {
            var SUB_WINDOW_SCALE_RATE = 0.2;

            var subwindowWidth = 0;
            var subwindowHeight = 0;

            if (this.pvtVideoSize.width > 0 && this.pvtVideoSize.height > 0) {
                if (controlWidth < controlHeight) {
                    subwindowWidth = Math.round(controlWidth * SUB_WINDOW_SCALE_RATE);
                    subwindowHeight = Math.round(this.pvtVideoSize.height * subwindowWidth / this.pvtVideoSize.width);
                }
                else {
                    subwindowHeight = Math.round(controlHeight * SUB_WINDOW_SCALE_RATE);
                    subwindowWidth = Math.round(this.pvtVideoSize.width * subwindowHeight / this.pvtVideoSize.height);
                }
            }

            var MARGIN = 8;
            this.pvtSubWindowRect = {};
            this.pvtSubWindowRect.left = displayRect.right - subwindowWidth - MARGIN;
            this.pvtSubWindowRect.top = displayRect.bottom - subwindowHeight - MARGIN;
            this.pvtSubWindowRect.right = this.pvtSubWindowRect.left + subwindowWidth - 1;
            this.pvtSubWindowRect.bottom = this.pvtSubWindowRect.top + subwindowHeight - 1;
        }
    }
};