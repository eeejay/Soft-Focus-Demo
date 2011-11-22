const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

dump('console\n\n');
var EXPORTED_SYMBOLS = ["console"];

dump('console\n\n');
var gAccRetrieval = Cc["@mozilla.org/accessibleRetrieval;1"]
    .getService(Ci.nsIAccessibleRetrieval);

dump('console\n\n');
var console = {
  log: function log () {
    let args = Array.prototype.slice.call(arguments);
    if (!this._log) {
      try {
        let liblog=ctypes.open('liblog.so');
        let _android_log = liblog.declare("__android_log_write",
                                          ctypes.default_abi,
                                          ctypes.int32_t,
                                          ctypes.int32_t,
                                          ctypes.char.ptr,
                                          ctypes.char.ptr);
        this._log = function (s) {
          _android_log(3, "CursorNav", String(s));
        };
      } catch (e) {
        this._log = function (s) {
          dump(s);
        }
      }
    }
    this._log(args.map(function (i) {return String(i);}).join(' ') + '\n');
  },

  logObj: function logObj (obj, attribs) {
    this.log(obj);
    for (let i in (attribs || obj)) {
      let attrib_name = attribs ? attribs[i] : i
      try {
        this.log(" " + attrib_name + ":", obj[attrib_name]);
      } catch (e) {
        this.log(" " + attrib_name + ":");
      }
    }
  },

  _indentSpace: function _indentSpace (indent) {
    let indentStr = "";
    for (let i=0;i<indent;i++)
      indentStr += " ";
    return indentStr;
  },

  dumpDOM: function dumpDOM (node, indent) {
    this.log(this._indentSpace(indent || 0) + node);

    for (let i in node.childNodes) {
      this.dumpDOM(node.childNodes[i], (indent || 0) + 1);
    }
  },

  dumpAccTree: function dumpAccTree (acc, indent) {
    this.log(this._indentSpace(indent || 0) + this.accToString(acc));

    for (let i=0;i < acc.childCount;i++) {
      this.dumpAccTree(acc.getChildAt(i), (indent || 0) + 1);
    }
  },

  accToString: function accToString (acc) {
    if (!acc)
        return "[ null ]";
    return "[ " + (acc.name || "") + " | " +
      gAccRetrieval.getStringRole(acc.role) + " ]";
  }
};

