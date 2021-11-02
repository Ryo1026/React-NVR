aui.lang = {};

/**
 * @static
 */
aui.lang.Class = {
  /**
   * @static
   * @function
   * @param {object} from
   * @param {object} to
   * @param {object} init
   */
  extend: function (from, to, init) {
    YAHOO.lang.extend(from, to, init);
  },
  augment: function (from, to, init) {
    YAHOO.lang.augment(from, to, init);
  },
};

/**
 * @static
 * @function
 * @param {object} object1
 * @param {object} object2
 * @return {object} Merged object.
 */
aui.lang.merge = function (object1, object2) {
  return YAHOO.lang.merge(object1, object2);
};

/**
 * @namespace
 */

aui.lang.util = {
  /**
   * @static
   * @function
   * @param {string} eventName
   * @param {object} owner
   */
  CustomEvent: function (eventName, owner) {
    /*Solution 1 : Write a CustomEvent ACTi self*/
    //@todo

    /*Solution 2 : If event is both subscribe & fire , then use Yahoo CustomEvent*/
    return new aui.lang.LiteCustomEvent(eventName, owner);

    /*Solution 3 : use Yahoo CustomEvent*/
    //return new YAHOO.util.CustomEvent(eventName, owner);
  },
};
var LiteCustomEventCount = 0;
var YahooCustomEventCount = 0;

aui.lang.LiteCustomEvent = function (eventName, owner) {
  this.arr = [];
  this.eventName = eventName;
  this.owner = owner;
  this._YAHOO = null;
  LiteCustomEventCount++;
};
aui.lang.LiteCustomEvent.prototype = {
  fire: function () {
    if (!this._YAHOO && this.arr.length > 0) {
      YahooCustomEventCount++;
      //window.status = "LiteCustomEventCount "+LiteCustomEventCount+" YahooCustomEventCount "+YahooCustomEventCount;
      this._YAHOO = new YAHOO.util.CustomEvent(this.eventName, this.owner);
      for (var key in this.arr)
        this._YAHOO.subscribe(this.arr[key].f, this.arr[key].c);
    }
    if (this._YAHOO)
      return this._YAHOO.fire.apply(this._YAHOO, [].slice.call(arguments));
  },
  subscribe: function (fn, cal) {
    this._YAHOO
      ? this._YAHOO.subscribe(fn, cal)
      : this.arr.push({ f: fn, c: cal });
  },
  unsubscribe: function (fn, cal) {
    if (this._YAHOO) {
      this._YAHOO.unsubscribe(fn, cal);
    } else {
      if (fn) {
        for (var key in this.arr)
          if (this.arr[key].f == fn && this.arr[key].c == cal) {
            this.arr.splice(key, 1);
            break;
          }
      } else {
        this.arr = [];
      }
    }
  },
  unsubscribeAll: function () {
    this._YAHOO ? this._YAHOO.unsubscribeAll() : (this.arr = []);
  },
  contains: function (fn, cal) {
    if (this._YAHOO) {
      for (var key in this._YAHOO.subscribers) {
        if (this._YAHOO.subscribers[key].contains(fn, cal)) {
          return true;
        }
      }
      return false;
    } else {
      for (var key in this.arr) {
        if (this.arr[key].f == fn && this.arr[key].c == cal) {
          return true;
        }
      }
      return false;
    }
  },
};

aui.lang.Delegate = function (type, context) {
  this.pvtEventType = type;
  this.pvtEventContext = context;
};
aui.lang.Delegate.prototype = {
  pvtEventType: null,
  pvtEventContext: null,
  pvtEventObject: null,
  pvtGetEvent: function () {
    if (this.pvtEventObject == null)
      this.pvtEventObject = new YAHOO.util.CustomEvent(
        this.pvtEventName,
        this.pvtEventOwner,
        true,
        YAHOO.util.CustomEvent.LIST
      );
    return this.pvtEventObject;
  },
  fire: function () {
    var evt = this.pvtEventObject;
    return evt ? evt.fire.apply(evt, arguments) : false;
  },
  subscribe: function (fn, obj, overrideContext) {
    var evt = this.pvtGetEvent();
    evt.subscribe(fn, obj, overrideContext);
  },
  unsubscribe: function (fn, obj) {
    var evt = this.pvtEventObject;
    if (evt) evt.unsubscribe(fn, obj);
  },
  unsubscribeAll: function () {
    var evt = this.pvtEventObject;
    if (evt) evt.unsubscribeAll();
  },
};

/**
 * Create interface.
 * @class
 */
aui.lang.Interface = {
  /**
   * @static
   * @function
   * @param {object} interface
   */
  create: function (interface) {
    return {
      interc: interface,
      implementTo: this._implementTo,
      interfaceOf: this._interfaceOf,
    };
  },
  _implementTo: function (implec) {
    var obj = implec.prototype;
    /* append all defined function */
    for (var i in this.interc) {
      if (!obj[i])
        obj[i] = (function (method) {
          return function () {
            exception("Interface Error:\n" + method, "aui.lang.Interface");
          };
        })(i);
    }
  },
  _interfaceOf: function (implec) {
    var regx = /function\s*\((.*)\)\s*\{/;
    var regx_debug = /Error\(\"Interface Error/;

    for (var method in this.interc) {
      var funcArgs = undefined,
        debugArgs = undefined,
        decArgs = undefined;
      /* detect method */
      if (typeof implec == "object" && implec[method] != undefined) {
        /* detect arguments number */
        try {
          funcArgs = implec[method].toString().match(regx)[1];
        } catch (e) {}
        try {
          debugArgs = implec[method].toString().match(regx_debug);
        } catch (e) {}
        try {
          decArgs = this.interc[method].toString().match(regx)[1];
        } catch (e) {}
        decArgs = !decArgs ? [] : decArgs.split(",");
        funcArgs = debugArgs ? decArgs : !funcArgs ? [] : funcArgs.split(",");
        if (decArgs.length != funcArgs.length) return false;
      } else return false;
    }
    return true;
  },
};
var Interface = aui.lang.Interface;

/**
 *
 */
aui.lang.Date = function (date, UTC) {
  var dateobj = date ? new Date(date) : new Date();
  if (UTC && typeof date == "string") {
    var test2 = dateobj.getMinutes();
    var test = dateobj.getTimezoneOffset();
    dateobj.setMinutes(dateobj.getMinutes() - dateobj.getTimezoneOffset());
  }
  return dateobj.valueOf() > 0 ? dateobj : null;
};

aui.lang.Date.timestamp = function (date, UTC) {
  return typeof date == "number" ? date : aui.lang.Date(date, UTC).valueOf();
};

aui.lang.Date.format = function (date, format, UTC) {
  format = format || "%Y-%m-%d %H:%i:%s %u";
  var dateobj = aui.lang.Date(date, UTC);
  var weekday = ["日", "ㄧ", "二", "三", "四", "五", "六"];

  return format.replace(/%([dHhimnpstuwY])/g, function (match0, match1) {
    function pad(num, dig) {
      num += "";
      var temp = num.length;
      for (var i = dig; i > temp; i--) num = "0" + num;
      return num;
    }

    switch (match1) {
      case "d":
        /* day 01-31 */ return pad(dateobj.getDate(), 2);
      case "H":
        /* hour 00-23 */ return pad(dateobj.getHours(), 2);
      case "h":
        /* hour 01-12 */ return pad(dateobj.getHours() % 12, 2);
      case "i":
        /* minute 01-60 */ return pad(dateobj.getMinutes(), 2);
      case "m":
        /* month 01-12 */ return pad(dateobj.getMonth() + 1, 2);
      case "n":
        /* newline */ return "\n";
      case "p":
        /* am / pm */ return dateobj.getHours() < 12 ? "am" : "pm";
      case "s":
        /* second 01-60 */ return pad(dateobj.getSeconds(), 2);
      case "t":
        /* tab */ return "\t";
      case "u":
        /* msecond 000-999 */ return pad(dateobj.getMilliseconds(), 3);
      case "w":
        /* weekday */ return weekday[dateobj.getDay()];
      case "Y":
        /* full year */ return dateobj.getFullYear();
      default:
        return match0;
    }
  });
};
/* date functions */

/* binary functions */
aui.lang.binaryHas = function (a, b) {
  return Math.floor(a / Math.pow(2, Math.log(b) / Math.LN2)) % 2;
};
/* binary functions */

//NewObj use simply function to create DOM object with classname / innerHTML
aui.lang.NewObj = function (type, classname, content, params) {
  var obj = document.createElement(type);
  if (classname) obj.className = classname;
  if (content) {
    switch (type) {
      case "img":
        obj.src = content;
        break;
      case "a":
        obj.href = content;
        obj.target = "_blank";
      default:
        if (typeof content == "object") obj.appendChild(content);
        else if (typeof content == "string")
          content.indexOf("TXT_") + content.indexOf("MSG_") > -2
            ? (obj.innerHTML = Lang(content, params).innerText)
            : (obj.innerHTML = content);
        break;
    }
  }

  return obj;
};

var NewObj = aui.lang.NewObj;

//ErrObj is public parser for error message from Media Server
aui.lang.ErrObj = function (xml) {
  if (!xml) return null;
  var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
  xmlDoc.async = "false";
  xmlDoc.loadXML(xml);
  var errObj = null;
  var Response = xmlDoc.selectNodes("/Response")[0];

  if (Response) {
    errObj = {};
    errObj.Command = Response.selectNodes("Command")[0].text;
    if (Response.selectNodes("ErrorCode")[0])
      errObj.ErrorCode = Response.selectNodes("ErrorCode")[0].text;
    errObj.Status = Response.selectNodes("Status")[0].text;

    var dataNodes = Response.selectNodes("Data")[0].childNodes[0];
    if (dataNodes) {
      var items = dataNodes.childNodes;
      errObj.Data = {};
      errObj.Data.ItemName = dataNodes.nodeName;
      errObj.Data.Items = [];
      for (var i = 0, Ilen = items.length; i < Ilen; i++) {
        var obj = {};
        var attrs = items[i].attributes;
        for (var j = 0, Jlen = attrs.length; j < Jlen; j++) {
          obj[attrs[j].nodeName] = attrs[j].text;
        }
        errObj.Data.Items.push(obj);
      }
    }
  }
  return errObj;
};

var ErrObj = aui.lang.ErrObj;

aui.lang.attachEvent = function (dom, event, fn, capture) {
  capture = capture || false;
  if (window.addEventListener) dom.addEventListener(event, fn, capture);
  else dom.attachEvent("on" + event, fn);
  if (capture && dom.setCapture) dom.setCapture();
};

var AttachEvent = aui.lang.attachEvent;

aui.lang.detachEvent = function (dom, event, fn, capture) {
  capture = capture || false;
  if (window.removeEventListener) dom.removeEventListener(event, fn, capture);
  else dom.detachEvent("on" + event, fn);
  if (capture && dom.releaseCapture) dom.releaseCapture();
};

var DetachEvent = aui.lang.detachEvent;

aui.lang.swapText = function swapText(node, text) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  node.appendChild(document.createTextNode(text));
};

var SwapText = aui.lang.swapText;
