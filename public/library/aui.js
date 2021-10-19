this.aui = {
    debug: false,
    data: {},
    ui: {},
    nvr: {
        ui: {}
    },
    lang: {}
};

aui.lang.Class = {
    /**
     * @static
     * @function
     * @param {object} from
     * @param {object} to
     * @param {object} init
     */
	extend: function(from , to , init){
        if (to) {
            var toWithoutConstructor = function () { };
            toWithoutConstructor.prototype = to.prototype;
    
            from.prototype = new toWithoutConstructor();
            from.prototype.constructor = from;
            from.superclass = to.prototype;
    
            if (to.prototype.constructor == Object.prototype.constructor) to.prototype.constructor = to;
        }
        
        for(var i in init) from.prototype[i] = init[i];
    
        from = null;
        to = null;
        init = null;
        toWithoutConstructor = null;
	}
};

/**
 * @static
 * @function
 * @param {object} object1
 * @param {object} object2
 * @return {object} Merged object.
 */
aui.lang.merge =  function(object1 , object2) {
    var obj = {};

    for (var attrname in object1) { obj[attrname] = object1[attrname]; }
    for (var attrname in object2) { obj[attrname] = object2[attrname]; }

    return obj;
};

aui.lang.util = {
    /**
     * @static
     * @function
     * @param {string} type
     * @param {object} target
     */
	CustomEvent: function(type, target) {
	    var cache = {};
        return {
            fire: function() {
                var args = arguments;
                cache[type] && cache[type].forEach(function(element, idx) {
                    
                    element.f.apply(target, [type, [].slice.call(args), element.c]);

                });
            },
            subscribe: function(fn, cal) {
                if (!cache[type]) cache[type] = [];
                cache[type].push({f:fn, c:cal});
            },
            unsubscribe: function(fn, cal) {
                if (cache[type]) {
                    cache[type].forEach(function(element, idx) {
                        if (fn === cache[type][idx].f)
                            cache[type].splice(idx, 1);
                    });
                }
            },
            unsubscribeAll: function() {
                if (cache[type]) {
                    var len = cache[type].length;
                    while (len > 0) {
                        cache[type].shift();
                        len--;
                    }
                }
            },
            contains: function(fn, cal) {
                if (cache[type]) {
                    for (var i = 0, l = cache[type].length; i < l; i++) {
                        if (!cache[type][i]) continue;
                        if (cache[type][i].f == fn && cache[type][i].c == cal) {
                            return true;
                        }
                    }
                }
                return false;
            }
        }
	}
};

aui.lang.getRegion = function(el) {
    if (!el) return;

    // A Region or array of Region instances containing "top, left, bottom, right" member data.
    var rect = el.getBoundingClientRect();
    // return [rect.top, rect.left, rect.bottom, rect.right];
    return rect;
};

aui.lang.NewObj = function (type, classname, content, params) {
    var obj = document.createElement(type);
    if (classname) obj.className = classname;
    if (content) {
        switch (type) {
            case 'img':
                obj.src = content;
                break;
            case 'a':
                obj.href = content;
                obj.target = "_blank";
            default:
                if (typeof content == "object") {
                    if (content.render) {
                        content.render(obj);
                    }
                    else {
                        obj.appendChild(content);
                    }
                }
                else if (typeof content == 'string') {
                    obj.textContent = content;
                }
                else if (typeof content == 'number') {
                    obj.textContent = content;
                }
                break;
        }
    }

    return obj
};
var NewObj = aui.lang.NewObj;

aui.lang.Date = function(date, UTC){
	var dateobj = date ? new Date(date) : new Date();
	if(UTC && typeof date=="string"){
	    var test2 = dateobj.getMinutes();
	    var test = dateobj.getTimezoneOffset();
	    dateobj.setMinutes(dateobj.getMinutes() - dateobj.getTimezoneOffset());
	}
	return dateobj.valueOf()>0 ? dateobj : null;
};

aui.lang.Date.timestamp = function(date, UTC){
	return typeof date=="number" ? date : aui.lang.Date(date, UTC).valueOf();
};

aui.lang.Date.format = function(date, format, UTC){
	format = format || "%Y-%m-%d %H:%i:%s %u";
	var dateobj = aui.lang.Date(date, UTC);
	var weekday = ["日", "ㄧ", "二", "三", "四", "五", "六"];

	return format.replace(/%([dHhimnpstuwY])/g, function(match0, match1){
		function pad(num,dig){
			num += '';
			var temp = num.length;
			for(var i=dig; i>temp; i--) num = "0"+num;
			return num;
		}

		switch (match1){
			case 'd': /* day 01-31 */		return pad(dateobj.getDate(), 2);
			case 'H': /* hour 00-23 */		return pad(dateobj.getHours(), 2);
			case 'h': /* hour 01-12 */		return pad(dateobj.getHours() % 12, 2);
			case 'i': /* minute 01-60 */	return pad(dateobj.getMinutes(), 2);
			case 'm': /* month 01-12 */		return pad(dateobj.getMonth() + 1, 2);
			case 'n': /* newline */			return '\n';
			case 'p': /* am / pm */			return dateobj.getHours() < 12 ? 'am' : 'pm';
			case 's': /* second 01-60 */	return pad(dateobj.getSeconds(), 2);
			case 't': /* tab */				return '\t';
			case 'u': /* msecond 000-999 */	return pad(dateobj.getMilliseconds(), 3);
			case 'w': /* weekday */			return weekday[dateobj.getDay()];
			case 'Y': /* full year */		return dateobj.getFullYear();
			default: return match0;
		}
	});
};


/* Base64 */
var Base64 = { _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function(input) {
    input = input.toString(); var output = ""; var chr1, chr2, chr3, enc1, enc2, enc3, enc4; var i = 0; input = Base64._utf8_encode(input); while (i < input.length) {
        chr1 = input.charCodeAt(i++); chr2 = input.charCodeAt(i++); chr3 = input.charCodeAt(i++); enc1 = chr1 >> 2; enc2 = ((chr1 & 3) << 4) | (chr2 >> 4); enc3 = ((chr2 & 15) << 2) | (chr3 >> 6); enc4 = chr3 & 63; if (isNaN(chr2)) { enc3 = enc4 = 64; } else if (isNaN(chr3)) { enc4 = 64; }
        output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
    } return output;
}, decode: function(input) {
    var output = ""; var chr1, chr2, chr3; var enc1, enc2, enc3, enc4; var i = 0; input = input.replace(/[^A-Za-z0-9\+\/\=]/g, ""); while (i < input.length) {
        enc1 = (i < input.length) ? this._keyStr.indexOf(input.charAt(i)) : undefined; i++; enc2 = (i < input.length) ? this._keyStr.indexOf(input.charAt(i)) : undefined; i++; enc3 = (i < input.length) ? this._keyStr.indexOf(input.charAt(i)) : undefined;
        i++; enc4 = (i < input.length) ? this._keyStr.indexOf(input.charAt(i)) : undefined; i++; chr1 = (enc1 << 2) | (enc2 >> 4); chr2 = ((enc2 & 15) << 4) | (enc3 >> 2); chr3 = ((enc3 & 3) << 6) | enc4; if (enc2 != undefined && enc2 != 64) { output = output + String.fromCharCode(chr1); } if (enc3 != undefined && enc3 != 64) { output = output + String.fromCharCode(chr2); } if (enc4 != undefined && enc4 != 64) { output = output + String.fromCharCode(chr3); }
    } output = Base64._utf8_decode(output); return output;
}, _utf8_encode: function(string) {
    string = string.replace(/\r\n/g, "\n"); var utftext = ""; for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n); if (c < 128) { utftext += String.fromCharCode(c); }
        else if ((c > 127) && (c < 2048)) { utftext += String.fromCharCode((c >> 6) | 192); utftext += String.fromCharCode((c & 63) | 128); } else { utftext += String.fromCharCode((c >> 12) | 224); utftext += String.fromCharCode(((c >> 6) & 63) | 128); utftext += String.fromCharCode((c & 63) | 128); }
    } return utftext;
}, _utf8_decode: function(utftext) {
    var string = ""; var i = 0; var c = c1 = c2 = 0; while (i < utftext.length) {
        c = utftext.charCodeAt(i); if (c < 128) { string += String.fromCharCode(c); i++; } else if ((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i + 1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63)); i += 2;
        } else { c2 = utftext.charCodeAt(i + 1); c3 = utftext.charCodeAt(i + 2); string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)); i += 3; }
    } return string;
}
};

var trace = function (text) {
    if (aui.debug) {
        console.log(text);
    }
};

(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;

    var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
    window.cancelAnimationFrame = cancelAnimationFrame;
})();
