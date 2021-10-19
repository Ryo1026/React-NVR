aui.nvr.DigitalPTZAdapter = function () {
    this.pvtVideoResolution = {
        width: 0,
        height: 0
    };

    this.pvtPTZSpeedRate = {
        XRate: 8.0,
        YRate: 8.0
    };

    this.pvtDisplayRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };

    this.pvtCurrentViewRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };

    this.pvtPIPRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };

    this.pvtRectAligner = {
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0, y: 0 },
        getAlignedRect: function (startPoint, endPoint, limitRect) {
            var slope = Math.abs((endPoint.y - startPoint.y + 1) / (endPoint.x - startPoint.x + 1));
            var alignedRect = {
                left: Math.max(Math.min(startPoint.x, endPoint.x), limitRect.left),
                right: Math.min(Math.max(startPoint.x, endPoint.x), limitRect.right),
                top: Math.max(Math.min(startPoint.y, endPoint.y), limitRect.top),
                bottom: Math.min(Math.max(startPoint.y, endPoint.y), limitRect.bottom),
            };

            var w = alignedRect.right - alignedRect.left + 1;
            var h = alignedRect.bottom - alignedRect.top + 1;
            
            if (slope <= 0.65) {
                h = parseInt((9 * w) / 16);
            }
            else if (slope >= 1.35) {
                w = h;
            }
            else {
                w = parseInt((4 * h) / 3);
            }

            if (startPoint.x <= endPoint.x) {
                alignedRect.right = alignedRect.left + w - 1;
            }
            else {
                alignedRect.left = alignedRect.right - w + 1;
            }

            if (startPoint.y <= endPoint.y) {
                alignedRect.bottom = alignedRect.top + h - 1;
            }
            else {
                alignedRect.top = alignedRect.bottom - h + 1;
            }   

            //Out of range process
            {
                // top
                if (alignedRect.top < limitRect.top) {
                    if (startPoint.x > endPoint.x) {
                        if (slope <= 0.65) {
                            alignedRect.left = startPoint.x - Math.round((startPoint.y - limitRect.top ) * 15 / 8);
                        }
                        else if (slope >= 1.35) {
                            alignedRect.left = startPoint.x - (startPoint.y - limitRect.top);
                        }
                        else {
                            alignedRect.left = startPoint.x - Math.round((startPoint.y - limitRect.top ) * 3 / 2);
                        }
                    }
                    else if (startPoint.x < endPoint.x) {
                        if (slope <= 0.65) {
                            alignedRect.right = startPoint.x + Math.round((startPoint.y - limitRect.top ) * 15 / 8);
                        }
                        else if (slope >= 1.35) {
                            alignedRect.right = startPoint.x + (startPoint.y - limitRect.top);
                        }
                        else {
                            alignedRect.right = startPoint.x + Math.round((startPoint.y - limitRect.top ) * 3 / 2);
                        }
                    }

                    alignedRect.top = limitRect.top;
                }

                // bottom
                if (alignedRect.bottom > limitRect.bottom) {
                    if (startPoint.x > endPoint.x) {
                        if (slope <= 0.65) {
                            alignedRect.left = startPoint.x - Math.round((limitRect.bottom - startPoint.y ) * 15 / 8);
                        }
                        else if (slope >= 1.35) {
                            alignedRect.left = startPoint.x - (limitRect.bottom - startPoint.y);
                        }
                        else {
                            alignedRect.left = startPoint.x - Math.round((limitRect.bottom - startPoint.y ) * 3 / 2);
                        }
                    }

                    if (startPoint.x < endPoint.x) {
                        if (slope <= 0.65) {
                            alignedRect.right = startPoint.x + Math.round((limitRect.bottom - startPoint.y ) * 15 / 8);
                        }
                        else if (slope >= 1.35) {
                            alignedRect.right = startPoint.x + (limitRect.bottom - startPoint.y);
                        }
                        else {
                            alignedRect.right = startPoint.x + Math.round((limitRect.bottom - startPoint.y ) * 3 / 2);
                        }
                    }

                    alignedRect.bottom = limitRect.bottom;
                }

                // right
                if (alignedRect.right > limitRect.right) {
                    if (startPoint.y > endPoint.y) {
                        if (slope <= 0.65) {
                            alignedRect.top = startPoint.y - Math.round((limitRect.right - startPoint.x ) * 8 / 15);
                        }
                        else if (slope >= 1.35) {
                            alignedRect.top = startPoint.y - (limitRect.right - startPoint.x);
                        }
                        else {
                            alignedRect.top = startPoint.y - Math.round((limitRect.right - startPoint.x ) * 2 / 3);
                        }
                    }

                    if (startPoint.y < endPoint.y) {
                        if (slope <= 0.65) {
                            alignedRect.bottom = startPoint.y + Math.round((limitRect.right - startPoint.x ) * 8 / 15);
                        }
                        else if (slope >= 1.35) {
                            alignedRect.bottom = startPoint.y + (limitRect.right - startPoint.x);
                        }
                        else {
                            alignedRect.bottom = startPoint.y + Math.round((limitRect.right - startPoint.x ) * 2 / 3);
                        }
                    }

                    alignedRect.right = limitRect.right;
                }

                // left
                if (alignedRect.left < limitRect.left) {
                    if (startPoint.y > endPoint.y) {
                        if (slope <= 0.65) {
                            alignedRect.top = startPoint.y - Math.round((startPoint.x - limitRect.left ) * 8 / 15);
                        }
                        else if (slope >= 1.35) {
                            alignedRect.top = startPoint.y - (startPoint.x - limitRect.left);
                        }
                        else {
                            alignedRect.top = startPoint.y - Math.round((startPoint.x - limitRect.left ) * 2 / 3);
                        }
                    }

                    if (startPoint.y < endPoint.y) {
                        if (slope <= 0.65) {
                            alignedRect.bottom = startPoint.y + Math.round((startPoint.x - limitRect.left ) * 8 / 15);
                        }
                        else if (slope >= 1.35) {
                            alignedRect.bottom = startPoint.y + (startPoint.x - limitRect.left);
                        }
                        else {
                            alignedRect.bottom = startPoint.y + Math.round((startPoint.x - limitRect.left ) * 2 / 3);
                        }
                    }

                    alignedRect.left = limitRect.left;
                }
            }

            return { x: alignedRect.left, y: alignedRect.top, width: alignedRect.right - alignedRect.left + 1, height: alignedRect.bottom - alignedRect.top + 1 };
        }
    };


    this.pvtDigitalPTZEnable = false;
    this.pvtZoom = false;
    this.pvtPIPMove = false;
    this.pvtSelecting = false;
    this.pvtSelectRect = null;

    this.onZoom = new aui.lang.util.CustomEvent("onZoom", this);
    this.onPIPSizeChanged = new aui.lang.util.CustomEvent("onPIPSizeChanged", this);
    this.onDigitalPTZ = new aui.lang.util.CustomEvent("onDigitalPTZ", this);
};

aui.nvr.DigitalPTZAdapter.prototype = {
    setVideoResolution: function (width, height) {
        this.pvtVideoResolution.width = width;
        this.pvtVideoResolution.height = height;

        this.pvtPTZSpeedRate.XRate = 8.0;
        this.pvtPTZSpeedRate.YRate = this.pvtPTZSpeedRate.XRate * this.pvtVideoResolution.height / this.pvtVideoResolution.width;

        this._updatePIPPos();
    },

    setDisplayRect: function (x, y, width, height) {
        var currentViewRect = this.pvtCurrentViewRect;
        var displayRect = this.pvtDisplayRect;

        if (displayRect.width == 0 || displayRect.height == 0) {
            currentViewRect.x = x;
            currentViewRect.y = y;
            currentViewRect.width = width;
            currentViewRect.height = height;
        }
        else {
            currentViewRect.x = x + (currentViewRect.x - displayRect.x) / (displayRect.width - 1) * (width - 1);
            currentViewRect.y = y + (currentViewRect.y - displayRect.y) / (displayRect.height - 1) * (height - 1);
            currentViewRect.width *= width / displayRect.width;
            currentViewRect.height *= height / displayRect.height;
        }

        displayRect.x = x;
        displayRect.y = y;
        displayRect.width = width;
        displayRect.height = height;

        this._updatePIPPos();

        if (this.pvtDigitalPTZEnable) {
            this._doDigitalPTZ(currentViewRect);
        }
    },

    getCurrentRectInPIP: function () {
        var PIPCurrentRect = null;
        if (this.pvtDigitalPTZEnable) {
            if (this.pvtZoom) {
                var displayRect = this.pvtDisplayRect;
                var PIPRect = this.pvtPIPRect;
                var currentViewRect = this.pvtCurrentViewRect;

                PIPCurrentRect = {
                    x: Math.round(PIPRect.x + (currentViewRect.x - displayRect.x) * (PIPRect.width - 1) / (displayRect.width - 1)),
                    y: Math.round(PIPRect.y + (currentViewRect.y - displayRect.y) * (PIPRect.height - 1) / (displayRect.height - 1)),
                    width: Math.ceil(currentViewRect.width * PIPRect.width / displayRect.width),
                    height: Math.ceil(currentViewRect.height * PIPRect.height / displayRect.height)
                };
            }
        }
        return PIPCurrentRect;
    },

    getPIPRect: function () {
        return this.pvtPIPRect;
    },

    PTZOperation: {
        panLeft: 0,
        panRight: 1,
        tiltUp: 2,
        tiltDown: 3,
        zoomin: 4,
        zoomOut: 5
    },

    ptzCommand: function (operation, speed) {
        if (this.pvtDigitalPTZEnable) {
            var panSpeed = 0.0;
            var tileSpeed = 0.0;
            var zoomSpeed = 0.0;

            switch (operation) {
                case this.PTZOperation.tiltUp:
                    tileSpeed = -speed;
                    break;
                case this.PTZOperation.tiltDown:
                    tileSpeed = speed;
                    break;
                case this.PTZOperation.panLeft:
                    panSpeed = -speed;
                    break;
                case this.PTZOperation.panRight:
                    panSpeed = speed;
                    break;
                case this.PTZOperation.zoomIn:
                    zoomSpeed = -speed;
                    break;
                case this.PTZOperation.zoomOut:
                    zoomSpeed = speed;
                    break;
                default:
                    //Unknown operation
            }

            var currentViewRect = this.pvtCurrentViewRect;
            var displayRect = this.pvtDisplayRect;

            //Convert to video coordinate
            var ptzX = (currentViewRect.x - displayRect.x) * (this.pvtVideoResolution.width - 1) / (displayRect.width - 1);
            var ptzY = (currentViewRect.y - displayRect.y) * (this.pvtVideoResolution.height - 1) / (displayRect.height - 1);
            var ptzWidth = currentViewRect.width * this.pvtVideoResolution.width / displayRect.width;
            var ptzHeight = currentViewRect.height * this.pvtVideoResolution.height / displayRect.height;

            if (panSpeed != 0.0) {
                ptzX += this.pvtPTZSpeedRate.XRate * panSpeed;

                if (ptzX < 0) {
                    ptzX = 0;
                }
                else if ((ptzX + ptzWidth) > this.pvtVideoResolution.width) {
                    ptzX = this.pvtVideoResolution.width - ptzWidth;
                }
            }
            else if (tileSpeed != 0.0) {
                ptzY += this.pvtPTZSpeedRate.YRate * tileSpeed;

                if (ptzY < 0) {
                    ptzY = 0;
                }
                else if ((ptzY + ptzHeight) > this.pvtVideoResolution.height) {
                    ptzY = this.pvtVideoResolution.height - ptzHeight;
                }
            }
            else if (zoomSpeed != 0.0) {
                //Video coordinate
                var PTZZoomWidth = ptzWidth + (this.pvtPTZSpeedRate.XRate * zoomSpeed) * 2.0;
                var PTZZoomHeight = ptzHeight + (this.pvtPTZSpeedRate.YRate * zoomSpeed) * 2.0;

                if ((PTZZoomWidth >= 32 && PTZZoomHeight >= 32) || operation == this.PTZOperation.zoomOut) {

                    // X and Width
                    if (PTZZoomWidth > this.pvtVideoResolution.width) {
                        ptzWidth = this.pvtVideoResolution.width;
                        ptzX = 0;
                    }
                    else {
                        ptzWidth = PTZZoomWidth;
                        ptzX -= (this.pvtPTZSpeedRate.XRate * zoomSpeed);

                        if (ptzX < 0) {
                            ptzX = 0;
                        }
                        else if ((ptzX + ptzWidth) > this.pvtVideoResolution.width) {
                            ptzX = this.pvtVideoResolution.width - ptzWidth;
                        }

                    }

                    // Y and Height
                    if (PTZZoomHeight > this.pvtVideoResolution.height) {
                        ptzHeight = this.pvtVideoResolution.height;
                        ptzY = 0;
                    }
                    else {
                        ptzHeight = PTZZoomHeight;
                        ptzY -= (this.pvtPTZSpeedRate.YRate * zoomSpeed);

                        if (ptzY < 0) {
                            ptzY = 0;
                        }
                        else if ((ptzY + ptzHeight) > this.pvtVideoResolution.height) {
                            ptzY = this.pvtVideoResolution.height - ptzHeight;
                        }
                    }
                }
            }

            //Convert to display coordinate
            this.pvtCurrentViewRect.x = ptzX / ((this.pvtVideoResolution.width - 1) / (displayRect.width - 1)) + displayRect.x;
            this.pvtCurrentViewRect.y = ptzY / ((this.pvtVideoResolution.height - 1) / (displayRect.height - 1)) + displayRect.y;
            this.pvtCurrentViewRect.width = ptzWidth / (this.pvtVideoResolution.width / displayRect.width);
            this.pvtCurrentViewRect.height = ptzHeight / (this.pvtVideoResolution.height / displayRect.height);

            if (this._doDigitalPTZ(this.pvtCurrentViewRect)) {
                this.pvtZoom = true;
            }
            else {
                this.toHome();
            }
        }
    },

    setStartPoint: function (x, y) {
        if (this.pvtDigitalPTZEnable) {
            this.pvtPIPMove = false;
            this.pvtSelecting = false;

            if (this.pvtZoom === ture && this._isInRect(this.pvtPIPRect, { x: x, y: y })) {
                this.pvtPIPMove = true;
                this._PIPMoveCurrentView(x, y);
            }
            else {
                this.pvtRectAligner.startPoint.x = x;
                this.pvtRectAligner.startPoint.y = y;
                this.pvtSelecting = true;
            }
        }
    },

    setEndPoint: function (x, y) {
        if (this.pvtDigitalPTZEnable) {
            if (this.pvtPIPMove) {
                if (this._isInRect(this.pvtPIPRect, { x: x, y: y })) {
                    this._PIPMoveCurrentView(x, y);
                }
            }
            else if (this.pvtSelecting){
                this.pvtRectAligner.endPoint.x = x;
                this.pvtRectAligner.endPoint.y = y;

                var limitRect = {
                    left: this.pvtDisplayRect.x,
                    top: this.pvtDisplayRect.y,
                    right: this.pvtDisplayRect.x + this.pvtDisplayRect.width - 1,
                    bottom: this.pvtDisplayRect.y + this.pvtDisplayRect.height - 1
                };
                this.pvtSelectRect = this.pvtRectAligner.getAlignedRect(this.pvtRectAligner.startPoint, this.pvtRectAligner.endPoint, limitRect);
            }
        }
    },

    doProcess: function () {
        if (this.pvtDigitalPTZEnable) {
            if (this.pvtSelecting) {
                var selectRect = this.pvtSelectRect;

                var currentViewRect = {};
                Object.assign(currentViewRect, this.pvtCurrentViewRect);
                var displayRect = this.pvtDisplayRect;

                //Update current view rect
                {
                    var currentWidth = currentViewRect.width, currentHeight = currentViewRect.height;

                    currentViewRect.x += (selectRect.x - displayRect.x) * (currentWidth - 1) / (displayRect.width - 1);
                    currentViewRect.y += (selectRect.y - displayRect.y) * (currentHeight - 1) / (displayRect.height - 1);
                    currentViewRect.width = selectRect.width * currentWidth / displayRect.width;
                    currentViewRect.height = selectRect.height * currentHeight / displayRect.height;
                }

                var currentVideoWidth = Math.round(currentViewRect.width * this.pvtVideoResolution.width / displayRect.width);
                var currentVideoHeight = Math.round(currentViewRect.height * this.pvtVideoResolution.height / displayRect.height);

                //小於32就不做digital PTZ
                if (currentVideoWidth >= 32 && currentVideoHeight >= 32) {

                    this.pvtCurrentViewRect = currentViewRect;

                    this._updatePIPPos();

                    if (this._doDigitalPTZ(currentViewRect)) {
                        this.pvtZoom = true;
                    }
                    else {
                        this.toHome();
                    }
                }
            }
            else if (this.pvtPIPMove) {
                this.pvtPIPMove = false;
            }
        }
    },

    resetPoint: function () {
        this.pvtPIPMove = false;
        this.pvtSelecting = false;
        this.pvtSelectRect = null;
        this.pvtRectAligner.startPoint.x = 0;
        this.pvtRectAligner.startPoint.y = 0;
        this.pvtRectAligner.endPoint.x = 0;
        this.pvtRectAligner.endPoint.y = 0;
    },

    toHome: function () {
        if (this.pvtDigitalPTZEnable) {
            this.pvtZoom = false;

            this.onZoom.fire(false);

            var displayRect = this.pvtDisplayRect;

            this.pvtCurrentViewRect.x = displayRect.x;
            this.pvtCurrentViewRect.y = displayRect.y;
            this.pvtCurrentViewRect.width = displayRect.width;
            this.pvtCurrentViewRect.height = displayRect.height;
        }
    },

    setEnable: function (enable) {
        this.pvtDigitalPTZEnable = enable;

        if (!enable) {
            this.pvtZoom = false;
            this.resetPoint();

            this.onZoom.fire(false);
        }
        else {
            var currentViewRect = this.pvtCurrentViewRect;
            var displayRect = this.pvtDisplayRect;

            if (Math.round(currentViewRect.width) != displayRect.width || Math.round(currentViewRect.height) != displayRect.height) {
                this.onZoom.fire(true);
                if (this._doDigitalPTZ(currentViewRect)) {
                    this.pvtZoom = true;
                }
            }
        }
    },

    isEnable: function () {
        return this.pvtDigitalPTZEnable;
    },

    isZoom: function () {
        return this.pvtZoom;
    },

    getSelectedRect: function () {
        return this.pvtSelectRect;
    },

    //Private functions

    _updatePIPPos: function () {
        var displayRect = this.pvtDisplayRect;

        if (this.pvtVideoResolution.width > 0 && this.pvtVideoResolution.height > 0 && displayRect.width > 40 && displayRect.height > 40) {
            var PIP_SCALE_RATE = 0.2;

            var PIPWidth = 0;
            var PIPHeight = 0;

            if (displayRect.width < displayRect.height) {
                PIPWidth = Math.round(displayRect.width * PIP_SCALE_RATE);
                PIPHeight = Math.round(this.pvtVideoResolution.height * PIPWidth / this.pvtVideoResolution.width);
            }
            else {
                PIPHeight = Math.round(displayRect.height * PIP_SCALE_RATE);
                PIPWidth = Math.round(this.pvtVideoResolution.width * PIPHeight / this.pvtVideoResolution.height);
            }

            var MARGIN = 8;
            var PIPRect = this.pvtPIPRect;
            PIPRect.x = (displayRect.x + displayRect.width) - PIPWidth - MARGIN;
            PIPRect.y = (displayRect.y + displayRect.height) - PIPHeight - MARGIN;
            PIPRect.width = PIPWidth;
            PIPRect.height = PIPHeight;

            this.onPIPSizeChanged.fire(PIPRect);
        }
    },

    _PIPMoveCurrentView: function (x, y) {
        var PIPRect = this.pvtPIPRect;
        var displayRect = this.pvtDisplayRect;

        var scaleX = displayRect.width / PIPRect.width;
        var scaleY = displayRect.height / PIPRect.height;

        //Convert to display coordinate
        var mappedX = Math.round(displayRect.x + (x - PIPRect.x + 1) * scaleX - 1);
        var mappedY = Math.round(displayRect.y + (y - PIPRect.y + 1) * scaleY - 1);

        var currentViewRect = this.pvtCurrentViewRect;

        currentViewRect.x = mappedX - parseInt(currentViewRect.width / 2);
        currentViewRect.y = mappedY - parseInt(currentViewRect.height / 2);

        //X correction
        if (currentViewRect.x < displayRect.x) {
            currentViewRect.x = displayRect.x;
        }
        else if ((currentViewRect.x + currentViewRect.width) > (displayRect.x + displayRect.width)) {
            currentViewRect.x = (displayRect.x + displayRect.width) - currentViewRect.width;
        }

        //Y correction
        if (currentViewRect.y < displayRect.y) {
            currentViewRect.y = displayRect.y;
        }
        else if ((currentViewRect.y + currentViewRect.height) > (displayRect.y + displayRect.height)) {
            currentViewRect.y = (displayRect.y + displayRect.height) - currentViewRect.height;
        }

        this._doDigitalPTZ(currentViewRect);
    },

    _doDigitalPTZ: function (rect) {
        var result = false;
        if (this.pvtDigitalPTZEnable) {
            var displayRect = this.pvtDisplayRect;
            if (Math.round(rect.width) != displayRect.width || Math.round(rect.height) != displayRect.height)
            {
                if (!this.pvtZoom) {
                    this.onZoom.fire(true);
                }

                var digitalPTZRect = {
                    x: Math.round((rect.x - displayRect.x) * (this.pvtVideoResolution.width - 1) / (displayRect.width - 1)),
                    y: Math.round((rect.y - displayRect.y) * (this.pvtVideoResolution.height - 1) / (displayRect.height - 1)),
                    width: Math.round(rect.width * this.pvtVideoResolution.width / displayRect.width),
                    height: Math.round(rect.height * this.pvtVideoResolution.height / displayRect.height)
                };
                this.onDigitalPTZ.fire(digitalPTZRect);

                result = true;
            }
        }
        return result;
    },

    _isInRect: function (rect, point) {
        return (point.x >= rect.x && point.x <= (rect.x + rect.width - 1) && point.y >= rect.y && point.y <= (rect.y + rect.height - 1));
    }
};