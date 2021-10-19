
aui.nvr.OpticalPTZAdapter = function (width, height) {
    this.options = {
        //Camera
        minPanSpeed: 1,
        maxPanSpeed: 3,
        minTiltSpeed: 1,
        maxTiltSpeed: 3,
        minZoomSpeed: 1,
        maxZoomSpeed: 3,
        panOffset: 0.1,
        tiltOffset: 0.1,
        zoomOffset: 0.1,
        ptzMode: "STANDAR",  //"STANDAR", "ONVIF"
        typeONVIFPTZ: "CONTINUOUSMOVE", //"CONTINUOUSMOVE", "RELATIVEMOVE", "ABSOLUTEMOVE"
        profile: ""
    };

    this.pvtControlSize = {
        width: 0,
        height: 0,
        center: { x: 0, y: 0 },
        rateX: 0,
        rateY: 0
    };

    this.pvtVideoResolution = {
        width: 0,
        height: 0
    }

    this.pvtStatus = {
        mouseWheelZoomSpeed: 0,
        keyDownZoomSpeed: 0,
        keyDownPanSpeed: 0,
        keyDownTiltSpeed: 0
    };
    this.mouseWheelTimeout = null;

    this.onOpticalPTZ = new aui.lang.util.CustomEvent("onOpticalPTZ", this);

    this.setControlSize(width, height);
};

aui.nvr.OpticalPTZAdapter.prototype = {
    
    setConfigure: function (config) {
        // Camera configure
        this.options = aui.lang.merge(this.options, config || {});
    },

    setControlSize: function (width, height) {
        this.pvtControlSize.width = width;
        this.pvtControlSize.height = height;
        this.pvtControlSize.center.x = width / 2;
        this.pvtControlSize.center.y = height / 2;
        this.pvtControlSize.rateX = this.pvtControlSize.center.x / (this.options.maxPanSpeed - this.options.minPanSpeed);
        this.pvtControlSize.rateY = this.pvtControlSize.center.y / (this.options.maxTiltSpeed - this.options.minTiltSpeed);
    },

    setVideoResolution: function (width, height) {
        this.pvtVideoResolution.width = width;
        this.pvtVideoResolution.height = height;
    },

    sendMousePT: function (point) {
        var me = this;
        var action;
        if (me.options.ptzMode == "STANDAR") {

            action = me._calculateStandarMousePT(point);

        } else if (me.options.ptzMode == "ONVIF") {

            action = me._calculateONVIFMousePT(point);

        }

        if (action) {
            me.onOpticalPTZ.fire(me.options.ptzMode, action);
        }
    },

    sendMousePTStop: function () {
        var me = this;

        var action;
        if (me.options.ptzMode == "STANDAR") {

            action = me._calculateStandarKeyPT(0, 0);

        } else if (me.options.ptzMode == "ONVIF") {

            action = me._calculateONVIFKeyPTZ(0, 0, 0);

        }

        if (action) {
            me.onOpticalPTZ.fire(me.options.ptzMode, action);
        }
    },

    sendMouseZ: function (speed) {
        var me = this;
        
        if (me.pvtStatus.mouseWheelZoomSpeed != speed) {
            var action;
            me.pvtStatus.mouseWheelZoomSpeed = speed;
            if (me.options.ptzMode == "STANDAR") {

                action = me._calculateStandarKeyZ(speed);

            } else if (me.options.ptzMode == "ONVIF") {

                action = me._calculateONVIFKeyPTZ(0, 0, speed / me.options.maxZoomSpeed);

            }

            me.onOpticalPTZ.fire(me.options.ptzMode, action);
        }

        // auto stop
        if (me.mouseWheelTimeout) {
            // reset time out
            clearTimeout(me.mouseWheelTimeout);
        }
        me.mouseWheelTimeout = setTimeout(function () {
            clearTimeout(me.mouseWheelTimeout);

            var action;
            if (me.options.ptzMode == "STANDAR") {

                action = me._calculateStandarKeyZ(0);

            } else if (me.options.ptzMode == "ONVIF") {

                action = me._calculateONVIFKeyPTZ(0, 0, 0);

            }

            if (action) {
                me.onOpticalPTZ.fire(me.options.ptzMode, action);
            }

            me.pvtStatus.mouseWheelZoomSpeed = 0;
            me.mouseWheelTimeout = null;
        }, 100);
    },

    sendKeyPT: function (panSpeed, tiltSpeed) {
        var me = this;

        var action;
        if (me.options.ptzMode == "STANDAR") {

            action = me._calculateStandarKeyPT(panSpeed, tiltSpeed);

        } else if (me.options.ptzMode == "ONVIF") {

            action = me._calculateONVIFKeyPTZ(panSpeed / me.options.maxPanSpeed, -tiltSpeed / me.options.maxTiltSpeed, 0);

        }

        if (action) {
            me.onOpticalPTZ.fire(me.options.ptzMode, action);
        }
    },

    sendKeyZ: function (zoomSpeed) {
        var me = this;

        var action;
        if (me.options.ptzMode == "STANDAR") {

            action = me._calculateStandarKeyZ(zoomSpeed);

        } else if (me.options.ptzMode == "ONVIF") {

            action = me._calculateONVIFKeyPTZ(0, 0, zoomSpeed / me.options.maxZoomSpeed);

        }

        if (action) {
            me.onOpticalPTZ.fire(me.options.ptzMode, action);
        }
    },
    
    sendPixelPTZ: function (startPoint, endPoint) {
        var me = this;
        if (me.options.ptzMode != "STANDAR") return;

        if (startPoint.x == endPoint.x &&
            startPoint.y == endPoint.y) {
            me.sendPixeltoPosition(startPoint);
        } else {
            me.sendPixeltoPTZ(startPoint, endPoint);
        }
    },

    sendPixeltoPTZ: function (startPoint, endPoint) {
        var me = this;
        if (me.options.ptzMode != "STANDAR") return;

        var action;
        //Pixel to PTZ
        let rateX = me.pvtVideoResolution.width / me.pvtControlSize.width;
        let rateY = me.pvtVideoResolution.height / me.pvtControlSize.height;
        var startx = Math.round(startPoint.x * rateX) - (me.pvtVideoResolution.width / 2);
        var starty = (me.pvtVideoResolution.height / 2) - Math.round(startPoint.y * rateY);
        var endx = Math.round(endPoint.x * rateX) - (me.pvtVideoResolution.width / 2);
        var endy = (me.pvtVideoResolution.height / 2) - Math.round(endPoint.y * rateY);
        var pw = endx - startx;
        var ph = endy - starty;
        if (Math.abs(pw) < 10 ||
            Math.abs(ph) < 10) {
            return;
        }
        if (pw < 0) {
            startx = endx;
        }
        if (ph > 0) {
            starty = endy;
        }

        action = "&Action=PIXELSTOPTZ" +
            "&Param1=" + startx + "&Param2=" + starty +
            "&Param3=" + Math.abs(pw) + "&Param4=" + Math.abs(ph) +
            "&Param5=" + me.pvtVideoResolution.width + "&Param6=" + me.pvtVideoResolution.height;

        me.onOpticalPTZ.fire(me.options.ptzMode, action);
    },

    sendPixeltoPosition: function (point) {
        var me = this;
        if (me.options.ptzMode != "STANDAR") return;

        var action;
        //Pixel to Position
        let rateX = me.pvtVideoResolution.width / me.pvtControlSize.width;
        let rateY = me.pvtVideoResolution.height / me.pvtControlSize.height;
        var px = Math.round(point.x * rateX) - (me.pvtVideoResolution.width / 2);
        var py = (me.pvtVideoResolution.height / 2) - Math.round(point.y * rateY);

        action = "&Action=PIXELSTOPOSITION" +
            "&Param1=" + px + "&Param2=" + py +
            "&Param3=" + me.pvtVideoResolution.width + "&Param4=" + me.pvtVideoResolution.height;

        me.onOpticalPTZ.fire(me.options.ptzMode, action);
    },

    // private methods =============================================================================

    _calculateStandarMousePT: function (point) {
        var me = this;

        var dx = (point.x - me.pvtControlSize.center.x);
        var dy = (point.y - me.pvtControlSize.center.y);

        var command = "";

        //Direction
        var dirx, diry;
        if (dy > 0) {
            diry = 1;
        } else if (dy < 0) {
            diry = -1;
        }
        if (dx > 0) {
            dirx = 1;
        } else if (dx < 0) {
            dirx = -1;
        }

        //Speed
        dx = Math.abs(Math.round(dx / me.pvtControlSize.rateX)) + me.options.minPanSpeed;
        dy = Math.abs(Math.round(dy / me.pvtControlSize.rateY)) + me.options.minTiltSpeed;

        return me._calculateStandarKeyPT(dirx * dx, diry * dy);
    },

    _calculateStandarKeyPT: function (panSpeed, tiltSpeed) {

        var command = "";

        //Direction
        if (panSpeed == 0 && tiltSpeed == 0) {
            command += "PANTILTSTOP";
        } else if (panSpeed && tiltSpeed) {
            command += "MOVE";
        } else if (panSpeed == 0) {
            command += "TILT";
        } else if (tiltSpeed == 0) {
            command += "PAN";
        }
        //TILT
        if (tiltSpeed > 0) {
            command += "DOWN";
        } else if (tiltSpeed < 0) {
            command += "UP";
        }
        //Pan
        if (panSpeed > 0) {
            command += "RIGHT";
        } else if (panSpeed < 0) {
            command += "LEFT";
        }

        //Speed
        panSpeed = Math.abs(panSpeed);
        tiltSpeed = Math.abs(tiltSpeed);

        var action = "&Action=" + command;

        switch (command) {
            case "TILTUP":
            case "TILTDOWN":
                action += "&Param1=" + tiltSpeed;
                break;
            case "PANLEFT":
            case "PANRIGHT":
                action += "&Param1=" + panSpeed;
                break;
            case "MOVEUPLEFT":
            case "MOVEDOWNLEFT":
            case "MOVEUPRIGHT":
            case "MOVEDOWNRIGHT":
                action += "&Param1=" + tiltSpeed;
                action += "&Param2=" + panSpeed;
                break;
            case "PANTILTSTOP":
            default:
                break;
        }

        return action;
    },

    _calculateStandarKeyZ: function (speed) {

        if (speed < 0) {
            command = "ZOOMOUT";
        } else if (speed > 0) {
            command = "ZOOMIN";
        } else {
            command = "ZOOMSTOP";
        }

        //Speed
        speed = Math.abs(speed);

        var action = "&Action=" + command;

        switch (command) {
            case "ZOOMIN":
            case "ZOOMOUT":
                action += "&Param1=" + speed;
                break;
            case "ZOOMSTOP":
            default:
                break;
        }

        return action;
    },

    _calculateONVIFMousePT: function (point) {
        var me = this;

        var dx = (point.x - me.pvtControlSize.center.x);
        var dy = (me.pvtControlSize.center.y - point.y);    //Y axis invers

        dx = (dx / me.pvtControlSize.center.x).toFixed(2);
        dy = (dy / me.pvtControlSize.center.y).toFixed(2);

        return me._calculateONVIFKeyPTZ(dx, dy, 0);
    },
    
    _calculateONVIFKeyPTZ: function (panSpeed, tiltSpeed, zoomSpeed) {
        var me = this;

        var action = "&profiletoken=" + me.options.profile + "&Action=";

        if (panSpeed == 0 &&
            tiltSpeed == 0 &&
            zoomSpeed == 0) {

            if (me.options.typeONVIFPTZ == "CONTINUOUSMOVE") {
                action += "Stop";
            } else {
                return null;
            }

        } else if (me.options.typeONVIFPTZ == "CONTINUOUSMOVE") {

            action += me.options.typeONVIFPTZ +"&Pan=" + panSpeed + "&Tilt=" + tiltSpeed + "&Zoom=" + zoomSpeed;

        } else if (me.options.typeONVIFPTZ == "RELATIVEMOVE") {

            action += me.options.typeONVIFPTZ;

            // let offset keep direction
            if (panSpeed == 0) {
                action += "&Pan=0";
            } else if (panSpeed < 0) {
                action += "&Pan=" + (-me.options.panOffset);
            } else {
                action += "&Pan=" + me.options.panOffset;
            }

            if (tiltSpeed == 0) {
                action += "&Tilt=0";
            } else if (tiltSpeed < 0) {
                action += "&Tilt=" + (-me.options.tiltOffset);
            } else {
                action += "&Tilt=" + me.options.tiltOffset;
            }

            if (zoomSpeed == 0) {
                action += "&Zoom=0";
            } else if (zoomSpeed < 0) {
                action += "&Zoom=" + (-me.options.zoomOffset);
            } else {
                action += "&Zoom=" + me.options.zoomOffset;
            }

            action += "&PanSpeed=" + Math.abs(panSpeed) + "&TiltSpeed=" + Math.abs(tiltSpeed) + "&ZoomSpeed=" + Math.abs(zoomSpeed);

        }

        return action;
    }

};
