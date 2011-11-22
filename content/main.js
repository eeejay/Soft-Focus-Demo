dump("LOADED MAIN!\n\n");

Components.utils.import("resource://" + extName + "/content/Console.js");
Components.utils.import("resource://" + extName + "/content/SoftFocusController.js")
Components.utils.import("resource://" + extName + "/content/SoftFocusView.js");

var SoftFocusDemo = {
  view: null,
  controller: null,

  onUIReady : function (event) {
    console.log("onUIReady");
    let doc = event.originalTarget;
    SoftFocusView.init(doc);
    SoftFocusController.init(doc.defaultView || event.originalTarget);
  },

  unloadFunc: function () {
  }
}

var unloadFunc = SoftFocusDemo.unloadFunc

// Try to load into a window, if it is premature listen for events.
if (window.document.readyState == "complete")
  SoftFocusDemo.onUIReady({originalTarget: window.document});
else 
  window.addEventListener("load", SoftFocusDemo.onUIReady, true);
