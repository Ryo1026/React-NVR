/**
 * aui.nvr.WebAssemblyStreamFragment
 */
aui.nvr.WebAssemblyStreamFragment = function(wasmBinary) {
    this.preRun = [];
    this.postRun = [];
    //this.totalDependencies = 0;
    //Debug FPS
    //this.fpsnumV = 0;
    //this.fpsnumA = 0;
    //this.queuelen = 0;
    this.queuemax = 0;
    this.wasmBinaryBytes = new Uint8Array(wasmBinary);
    this.flagInitialized = false;
    
    this.onModuleEvent = new aui.lang.util.CustomEvent("onModuleEvent", this);
    //Debug FPS
    this.onPrintEvent = new aui.lang.util.CustomEvent("onPrintEvent", this);
};
aui.nvr.WebAssemblyStreamFragment.prototype = {
    URL_FRAGWORKER: "codebase/FragWorker.js",
    isInitialized: function () {
        return this.flagInitialized;
    },
    print: function (text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        if (aui.debug) console.log(text);
    },
    printErr: function (text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        if (aui.debug) console.error(text);
    },
    setStatus: function (text) {

    },
    //fragmentRunDependencies: function (left) {
    //    this.totalDependencies = Math.max(this.totalDependencies, left);
    //    //this.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    //},
    onRuntimeInitialized: function () {
        this.flagInitialized = true;
        this.print("Initial finished");

        //this.createWorker(this.URL_FRAGWORKER + "?v=" + (new Date()).getTime());    // set FragWorker.js path
        this.onModuleEvent.fire("onRuntimeInitialized");
    },
    onConnect: function (id, result) {
        if (result == 0) {
            // Connection failed
            this.printErr("Connection failed");
        } else {
            // Connection success
            this.print("Connection success");
        }

        this.onModuleEvent.fire("onConnect", id, [result]);
    },
    onConnectionRecovery: function (id, result) {
        // ConnectionRecovery
        this.print("onConnectionRecovery");

        this.onModuleEvent.fire("onConnectionRecovery", id, [result]);
    },
    onTimecode: function(timecode, millitime, timezone, daylight) {
        //this.print("Time : " + (timecode*1000 + millitime) + " TimeZone : " + timezone + " Daylight : " + daylight);
    },
    //Debug FPS
    onFpsUpdate: function (id, fpsV, fpsA, queue) {
        //this.fpsnumV = fpsV;
        //this.fpsnumA = fpsA;
        //this.queuelen = queue;
        if (this.queuemax < queue) {
            this.queuemax = queue;
        }
    
        var message = " f:" + fpsV + ", " + fpsA + " q:" + queue + ", " + this.queuemax;
        this.onPrintEvent.fire(id, message);
    },
    instantiateWasm: function (imports, successCallback) {
        var me = this;
        var wasmInstantiate = WebAssembly.instantiate(me.wasmBinaryBytes, imports).then(function(output) {
			successCallback(output.instance);
		}).catch(function(e) {
			me.printErr("wasm instantiation failed! " + e);
		});
		return {};
    },
    onNetworkLoss: function (id, result) {
        this.print("onNetworkLoss");
        this.onModuleEvent.fire("onNetworkLoss", id, [result]);
    },
    onDisconnect: function (id, result) {
        this.print("onDisconnect");
        this.onModuleEvent.fire("onDisconnect", id, [result]);
        this.queuemax = 0;
    },
    frameCallBack: function (id, buf, _len, type, b2h) {
        this.onModuleEvent.fire("frameCallBack", id, [buf, _len, type, b2h]);
    },
    eventCallBack: function (id, type, ev) {
        this.onModuleEvent.fire("eventCallBack", id, [type, ev]);
    },
    playerInitialCallBack: function (id, type, buf, len) {
        this.onModuleEvent.fire("playerInitialCallBack", id, [type, buf, len]);
    },
    onQueueClear: function (id, result) {
        this.onModuleEvent.fire("onQueueClear", id, [result]);
    }
};