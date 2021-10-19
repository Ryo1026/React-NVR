aui.nvr.WebAssemblyWebGLAdapter = function (wasmBinary) {
    this.preRun = [];
    this.postRun = [];
    //this.totalDependencies = 0;
    this.wasmBinaryBytes = new Uint8Array(wasmBinary);
    this.flagInitialized = false;

    this.onModuleEvent = new aui.lang.util.CustomEvent("onModuleEvent", this);
};

aui.nvr.WebAssemblyWebGLAdapter.prototype = {
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
    //webGLAdapterRunDependencies: function (left) {
    //    this.totalDependencies = Math.max(this.totalDependencies, left);
    //    //this.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    //},
    onRuntimeInitialized: function () {
        this.flagInitialized = true;
        this.print("Initial finished");
        this.onModuleEvent.fire("onRuntimeInitialized");
    },
    instantiateWasm: function (imports, successCallback) {
        var me = this;
        var wasmInstantiate = WebAssembly.instantiate(me.wasmBinaryBytes, imports).then(function (output) {
            successCallback(output.instance);
        }).catch(function (e) {
            me.printErr("wasm instantiation failed! " + e);
        });
        return {};
    }
};