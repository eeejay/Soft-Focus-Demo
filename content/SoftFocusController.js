const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

try {
  Cu.import("resource://softfocusdemo/content/Console.js");
  Cu.import("resource://softfocusdemo/content/AccessibleTreeWalker.js");
} catch (e) {
  dump("Error?? " + e + "\n");
}

var EXPORTED_SYMBOLS = ["SoftFocusController"];

var gAccRetrieval = Cc["@mozilla.org/accessibleRetrieval;1"]
    .getService(Ci.nsIAccessibleRetrieval);

const STATE_BUSY = Ci.nsIAccessibleStates.STATE_BUSY;
const STATE_CHECKED = Ci.nsIAccessibleStates.STATE_CHECKED;

var Preferences = {
  keyCodesNext: [39, 40],
  keyCodesPrevious: [37, 38],
};

var SoftFocusController = {
  FORWARD: 1,
  BACKWARD: 2,

  init: function init(window) {
    if (window.document instanceof Ci.nsIDOMXULDocument) {
      console.log("attaching to document");
      window.document.addEventListener("keypress", this._onInputKeyPress, true);
    } else {
      console.log("not attaching to document");
      /*getDocRoot(window,
                 function (docRoot) {
                   console.dumpAccTree(docRoot);
                 }); */
      window.addEventListener("keypress", this._onInputKeyPressInner, true);
    }
  },

  uninit: function uninit(window) {
    if (window.document instanceof Ci.nsIDOMXULDocument)
      window.document.removeEventListener("keypress", this._onInputKeyPress, true);
    else
      window.removeEventListener("keypress", this._onInputKeyPressInner, true);
  },

  _onInputKeyPress: function _onInputKeyPress (event) {
    let document = event.target.ownerDocument;
    return SoftFocusController._onInputKeyPressInner.apply(document.defaultView,
                                                        [event]);
  },

  _onInputKeyPressInner: function _onInputKeyPressInner (event) {
    // If it is XUL content (e.g. about:config), bail.
    if (this.document instanceof Ci.nsIDOMXULDocument)
      return ;

    // Use whatever key value is available (either keyCode or charCode).
    // It might be useful for addons or whoever wants to set different
    // key to be used here (e.g. "a", "F1", "arrowUp", ...).
    var key = event.which || event.keyCode;

    console.log('keypress', key);

    let direction = 0;

    if ((Preferences.keyCodesNext || []).indexOf(key) != -1)
      direction = SoftFocusController.FORWARD;

    if ((Preferences.keyCodesPrevious || []).indexOf(key) != -1)
      direction = SoftFocusController.BACKWARD;

    if (!direction)
      return;

    SoftFocusController.navigate(getAccessible(this.document), direction);
      
    event.preventDefault();
    event.stopPropagation();
  },
  
  navigate: function navigate (rootAcc, direction) {
    let treeWalker = new AccessibleTreeWalker(rootAcc, SimpleFilter);
    var docAcc = rootAcc.QueryInterface(Ci.nsIAccessibleDocument);
    if (docAcc.softFocusPivotCount > 0)
      treeWalker.currentNode = docAcc.getSoftFocusAtPivot(0);

    let newNode = (direction == this.FORWARD) ? treeWalker.next() :
      treeWalker.previous();

    if (newNode)
      newNode.takeSoftFocus(0);
  }
}

function getAccessible (node) {
  return gAccRetrieval.getAccessibleFor(node).QueryInterface(Ci.nsIAccessible);
}

function getDocRoot (window, onLoadFunc) {
  function getDocRootInner() {
    let docRoot = getAccessible(window.document);
    
    let state = {};
    docRoot.getState(state, {});
    if (state.value & STATE_BUSY)
      return getDocRoot (window, onLoadFunc); // Try again
    
    if (onLoadFunc)
      onLoadFunc(docRoot);
    }

    window.setTimeout (getDocRootInner, 0);
};