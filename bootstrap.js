const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

Cu.import("resource://gre/modules/Services.jsm");

var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader);

var unloadFuncs = [];

var windowListener = {
  data: null,
  onOpenWindow: function(aWindow) {
      let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
      loadIntoWindow(domWindow, this.data);
  },
  onCloseWindow: function(aWindow) { },
  onWindowTitleChange: function(aWindow, aTitle) { }
};

function loadIntoWindow (aWindow, data) {
  dump("loadIntoWindow" + aWindow + "\n");
  try {
    let extName = data.id.substring(0, data.id.indexOf('@'));
    let installPathURI = Services.io.newFileURI(data.installPath);
    let _globals = {window: aWindow, extName: extName};
    loader.loadSubScript("resource://" + extName + "/content/main.js", _globals);
    unloadFuncs.push(_globals.unloadFunc);
  } catch (e) {
    dump("ERROR " + e + "\n");
  }
 }

function startup (data, reason) {
  let extName = data.id.substring(0, data.id.indexOf('@'));
  dump ("started! " + extName + "\n");

  let resource = Services.io.getProtocolHandler("resource").
    QueryInterface(Ci.nsIResProtocolHandler);

  let alias = Services.io.newFileURI(data.installPath);
  resource.setSubstitution(extName, alias);

  try {
    // Load into any existing windows
    let enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
      let win = enumerator.getNext();
      loadIntoWindow(win, data);
    }
    // Load into any new windows
    windowListener.data = data;
    Services.wm.addListener(windowListener);
  } catch (e) {
    console.printException (e);
  }
}

function install (data, reason) { }

function shutdown (data, reason) {
    let resource = Services.io.getProtocolHandler("resource").
        QueryInterface(Ci.nsIResProtocolHandler);
    resource.setSubstitution(data.id.substring(0, data.id.indexOf('@')), null);

    // Unload all windows
    for (let i in unloadFuncs) {
        let unloadFunc = unloadFuncs[i];
        if (unloadFunc)
            unloadFunc();
    }
}

function uninstall (reason, data) {
}