/**
 * aui.data.WebAssemblyMultimedia
 */
aui.data.WebAssemblyMultimedia = function (options) {
    var me = this;
    var defaultValues = {
        type: "Video",  // Video, Audio
        //mode: 1,
        updateflag: 0,
        framebuffer: null,
        //mimeCodec: null,
        mediaSource: null,
        mediaSourceURL: null,
        sourceBuffer: null,
        removeBufferPoint: 0,
        removeBufferNextPoint: 0,
        delay: 0,
        buffered: 0,
    };
    options = aui.lang.merge(defaultValues, options || {});
    
    this.type = options.type;
    //this.mode = options.mode;
    this.mode = 0;
    switch (this.type) {
        case "Video":
            this.mode = 1;
            break;
        case "Audio":
            this.mode = 2;
            break;
    }
    this.updateflag = options.updateflag;
    this.framebuffer = options.framebuffer;
    //this.mimeCodec = options.mimeCodec;
    this.mediaSource = options.mediaSource;
    this.mediaSourceURL = options.mediaSourceURL;
    this.sourceBuffer = options.sourceBuffer;
    this.removeBufferPoint = options.removeBufferPoint;
    this.removeBufferNextPoint = options.removeBufferNextPoint;
    this.delay = options.delay;

    this.reset = function () {
        if (me.sourceBuffer != null) {
            me.sourceBuffer.onupdateend = null;
            if (me.mediaSource) {
                if (me.readState == 'open') {
                    me.sourceBuffer.abort();
                    me.mediaSource.endOfStream();
                }
			    me.mediaSource.removeSourceBuffer(me.sourceBuffer);
            }
			me.sourceBuffer = null;
		}
        if (me.mediaSource) {
            me.mediaSource.onsourceopen = null;
            me.mediaSource.onsourceended = null;
            me.mediaSource.onsourceclose = null;
            me.mediaSource.onerror = null;
            if (me.mediaSourceURL) {
                URL.revokeObjectURL(me.mediaSourceURL);
                me.mediaSourceURL = null;
            }
			me.mediaSource = null;
        }
		me.updateflag = 0;
		me.framebuffer = null;
		//me.delay = 0;
        me.removeBufferPoint = 0;
        me.removeBufferNextPoint = 0;
    }
};
