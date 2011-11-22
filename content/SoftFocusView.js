const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://softfocusdemo/content/Console.js");

var EXPORTED_SYMBOLS = ["SoftFocusView"];

var SoftFocusView = {
  observerService : Cc["@mozilla.org/observer-service;1"]
    .getService(Ci.nsIObserverService),

  init: function init(xulDoc) {
    this.softFocusRing = new SoftFocusRing(xulDoc);
    this.observerService.addObserver(this, "accessible-event", false);
  },

  observe: function observe(aSubject, aTopic, aData)
  {
    if (aTopic != "accessible-event")
      return;

    var event;
    try {
      event = aSubject.QueryInterface(Ci.nsIAccessibleEvent);
    } catch (ex) {
      console.log("Error", ex);
      return;
    }
    this.handleEvent(event);
  },

  handleEvent: function handleEvent(event) {
    if (event.eventType != Ci.nsIAccessibleEvent.EVENT_SOFT_FOCUS_CHANGED)
      return;

    let softFocusEvent = event
      .QueryInterface(Ci.nsIAccessibleSoftFocusChangeEvent);

    // Only interested in pivot 0
    if (softFocusEvent.pivotIndex != 0)
      return;

    if (softFocusEvent.isFocused)
      this.softFocusRing.show(event.accessible);
    else
      this.softFocusRing.hide();
  }
};

function SoftFocusRing(document) {
  let contentElement = document.getElementById('appcontent');
  this.window = document.defaultView;

  this._highlightRect = document.createElementNS(
    "http://www.w3.org/1999/xhtml", "div");
  this._highlightRect.style.position = "fixed";
  this._highlightRect.style.borderStyle = "solid";
  this._highlightRect.style.pointerEvents = "none";
  this._highlightRect.style.display = "none";
  contentElement.appendChild(this._highlightRect);
  
  // style it
  this._highlightRect.style.borderColor = "orange";
  this._highlightRect.style.borderRadius = "4px";
  this._highlightRect.style.borderWidth = "2px";
  
  this._highlightRect.style.boxShadow = "1px 1px 1px #444";
  
  // Create inset for inner shadow
  let inset = document.createElementNS(
    "http://www.w3.org/1999/xhtml", "div");
  inset.style.width = "100%";
  inset.style.height = "100%";
  inset.style.borderRadius = (this.borderRadius/2) + "px";
  inset.style.boxShadow = "inset 1px 1px 1px #444";
  this._highlightRect.appendChild(inset);
}

SoftFocusRing.prototype = {
  borderWidth: 2,
  borderRadius: 4,

  hide: function hide () {
    this._highlightRect.style.display = "none";
  },

  highlight: function _highlight(rect) {
    console.log("highlight");

    this._highlightRect.style.display = "none";
    this._highlightRect.style.top = (rect.top - this.borderWidth/2) + "px";
    this._highlightRect.style.left = (rect.left - this.borderWidth/2) + "px";
    this._highlightRect.style.width =
        (rect.right - rect.left - this.borderWidth) + "px";
    this._highlightRect.style.height =
        (rect.bottom - rect.top - this.borderWidth) + "px";
    this._highlightRect.style.display = "block";
  },

  show: function show(acc) {
    let accRect = {};

    try {
      let self = this;
      let accNode = acc.QueryInterface(Ci.nsIAccessNode);
      accNode.scrollTo(Ci.nsIAccessibleScrollType.SCROLL_TYPE_ANYWHERE);
      this.window.setTimeout(function () {
        let ax = {}, ay = {}, aw = {}, ah = {};
        let dx = {}, dy = {}, dw = {}, dh = {};
        acc.getBounds(ax, ay, aw, ah);
        let docRoot = accNode.rootDocument.QueryInterface(Ci.nsIAccessible);
        docRoot.getBounds(dx, dy, dw, dh);
        accRect = {left: ax.value - dx.value,
                   top: ay.value - dy.value,
                   right: ax.value + aw.value - dx.value,
                   bottom: ay.value + ah.value - dy.value};
        self.highlight(accRect);
      }, 0);
    } catch (e) {
      console.log("Error getting bounds:", e);
      return;
    }

  }
}