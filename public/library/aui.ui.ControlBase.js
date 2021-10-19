/**
 * Abstracts
 */
aui.ui.ControlBase = function (options) {
    var me = this;
    /* declare custom events or default */
    if (options && options.events) this.events = options.events;
    else this.events = [
        'onchange', 'onclick', 'ondblclick',
        'onkeydown', 'onkeypress', 'onkeyup',
        'onmousedown', 'onmouseover', 'onmouseup', 'onmouseout',
        'onselect', 'onsubmit', 'oncontextmenu'
    ];
    //Extra Event
    //'onmousemove', 'onload', 'onreset',  'onabort', 'onblur', 'onunload' , 'onfocus'

    this.custom_events = [
    	'onRendered',
        'onUnrendered'
    ];

    this._appendToNode = null;//(appendToNode)?appendToNode:null;
    this._managedNode = document.createElement("div");
    this._managedNode.style.overflowX = "hidden";
    this._managedNode.style.overflowY = "hidden";

    for (var key in this.events) {
        this[this.events[key]] = new aui.lang.util.CustomEvent(this.events[key], this);

        var evt = new function (handle) {
            this.fire = function (e) {
                if (me.getEnable())
                    handle.fire((arguments.length > 0) ? e : event);
            }
        }(this[this.events[key]]);

        this._managedNode[this.events[key]] = evt.fire;
    }

    /* custom events */
    for (var key in this.custom_events) {
        this[this.custom_events[key]] = new aui.lang.util.CustomEvent(this.custom_events[key], this);
    }

    this.prepareNode(this._managedNode);
};


/**
 * This method will append those prepared node into target element.
 *
 * @param [HTMLElement] appendToNode
 *        Target element for rendering current control. You can 
 *        also provide the id of existed element.
 *
 * @param [string] appendToNode
 *        The id of existed target element for rendering.
 *
 * @param [HTMLElement] content
 *        Provide a custom content, this param can be null. Not 
 *        every control supports this feature. It depends on
 *        different implementation of prepareNode().
 */
aui.ui.ControlBase.prototype = {
    render: function (appendToNode) {
        if (!appendToNode)
            exception("Specify node not exist.", "aui.ui.ControlBase.prototype.render");

        if (typeof appendToNode == 'string')
            appendToNode = document.getElementById(appendToNode);

        this._appendToNode = appendToNode;

        appendToNode.appendChild(this._managedNode);

        /* onRendered  event fire */
        this.onRendered.fire(appendToNode);
    },

    unrender: function (removeFromNode) {
        if (!removeFromNode)
            exception("Specify node not exist.", "aui.ui.ControlBase.prototype.unrender");

        if (typeof removeFromNode == 'string')
            removeFromNode = document.getElementById(removeFromNode);

        if (this._managedNode.parentNode == removeFromNode)
            removeFromNode.removeChild(this._managedNode);
        else {
            if (this._managedNode.parentNode)
                this._managedNode.parentNode.removeChild(this._managedNode);
        }

        this.onUnrendered.fire();
    },

    destroy: function () {
        this._appendToNode.removeChild(this._managedNode);

        for (var key in this.events) {
            this[this.events[key]].unsubscribe();
        }

        for (var key in this.custom_events) {
            this[this.custom_events[key]].unsubscribe();
        }

        this.destructor();

        //todo. VAL: 列舉清除比全部清除好，因為某些Object/Array的子成員若是Object或Array，需要對每個子成員做清除。 1.this.events, 2.this.custom_events, 3.this._appendToNode, 4.this._managedNode, 5.this[events & custom_events]
        for (var key in this)
            this[key] = null;
    },

    insertBefore: function (appendToNode, beforeNode) {
        if (!appendToNode)
            exception("Specify node not exist.", "aui.ui.ControlBase.prototype.insertBefore");

        if (typeof appendToNode == 'string')
            appendToNode = document.getElementById(appendToNode);

        if (beforeNode) {   // optional
            if (typeof beforeNode == 'string')
                beforeNode = document.getElementById(beforeNode);
            else if (beforeNode._managedNode)
                beforeNode = beforeNode._managedNode;
        }

        this._appendToNode = appendToNode;

        appendToNode.insertBefore(this._managedNode, beforeNode);

        /* onRendered  event fire */
        this.onRendered.fire(appendToNode);
    },

    /**
     * Return the node for rendering.
     */
    prepareNode: function (nodeToPrepare) {
        // render your html nodes into "nodeToPrepare".
    },

    /**
     * overwrite the destructor
     */
    destructor: function (nodeToPrepare) {
        //overwrite the destructor
    },
    //IE9 bug, the value of width and height must end with 'px'
    ToolTips: function (text) { this._managedNode.title = text; },
    getX: function () { return this._managedNode.offsetLeft; },
    setX: function (value) {
        value = parseFloat(value.toString().replace("px", ""));
        this._managedNode.style.left = value + "px";
    },
    getY: function () { return this._managedNode.offsetTop; },
    setY: function (value) {
        value = parseFloat(value.toString().replace("px", ""));
        this._managedNode.style.top = value + "px";
    },
    getWidth: function () { return this._managedNode.offsetWidth; },
    getStyleWidth: function () { return parseFloat(this._managedNode.style.width.replace("px", "")); },
    setWidth: function (value) {
        value = parseFloat(value.toString().replace("px", ""));
        if (value > 0)
            this._managedNode.style.width = value + "px";
    },
    getHeight: function () { return this._managedNode.offsetHeight; },
    getStyleHeight: function () { return parseFloat(this._managedNode.style.height.replace("px", "")); },
    setHeight: function (value) {
        if (value) {
            value = parseFloat(value.toString().replace("px", ""));
            if (value > 0) this._managedNode.style.height = value + "px";
        }
    },
    getClientRegion: function () { return aui.lang.getRegion(this._managedNode); },
    show: function () { this._managedNode.style.display = ""; },
    hide: function () { this._managedNode.style.display = "none"; },
    setVisible: function () { this._managedNode.style.visibility = ""; },
    setInvisible: function () { this._managedNode.style.visibility = "hidden"; },
    setClassName: function (className) { this._managedNode.className = className; },
    addClassName: function (className) {
        if (!className) return;

        var names = (this._managedNode.className || "").split(" ");
        names.push(className);
        this._managedNode.className = names.join(" ");
    },
    removeClassName: function (className) {
        if (!className) return;

        var names = (this._managedNode.className || "").split(" ");
        for (var i = 0, l = names.length; i < l; i++) {
            if (names[i] == className) {
                names.splice(i, 1);
                break;
            }
        }

        this._managedNode.className = names.join(" ");
    },
    setEnable: function (isEnable) {
        this._disabled = !isEnable;
    },
    getEnable: function () {
        return !this._disabled;
    },
    isRendered: function () {
        return (this._managedNode.parentNode);
    },
    isHidden: function () {
        return (this._managedNode.style.display == "none");
    }
}