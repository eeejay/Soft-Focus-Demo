const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://softfocusdemo/content/Console.js");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var EXPORTED_SYMBOLS = ["SoftFocusView"];

function PivotObserver(aPivot, aSoftFocuRing) {
  this.pivot = aPivot;
  this.softFocusRing = aSoftFocuRing;
}

PivotObserver.prototype = {
  onAccessibleChanged: function onAccessibleChanged (aOldAccessible,
                                                     aNewAccessible) {
    this.softFocusRing.show(this.pivot);
  },

  onTextOffsetChanged: function onTextOffsetChanged (aOldStart, aOldEnd,
                                                     aNewStart, aNewEnd) {
    this.softFocusRing.show(this.pivot);
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAccessiblePivotObserver])
}

var SoftFocusView = {
  observerService : Cc["@mozilla.org/observer-service;1"]
    .getService(Ci.nsIObserverService),
  pivotObservers: [],

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
    console.log(event.eventType);
    if (event.eventType == Ci.nsIAccessibleEvent.EVENT_DOCUMENT_LOAD_COMPLETE) {
      let doc = event.accessible.QueryInterface(Ci.nsIAccessibleDocument);
      let pivotObserver = new PivotObserver(doc.virtualCursor,
                                            this.softFocusRing);
      doc.virtualCursor.addObserver(pivotObserver);
      this.pivotObservers.push(pivotObserver);
      console.logObj(doc.virtualCursor);
    }
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

  _getSoftFocusRect: function _getSoftFocusRect(acc, startOffset, endOffset) {
    let ax = {}, ay = {}, aw = {}, ah = {};

    if (endOffset >= 0 && startOffset >= 0 && endOffset != startOffset) {
      try {
        let textAcc = acc.QueryInterface(Ci.nsIAccessibleText);
        textAcc.getRangeExtents(
          startOffset, endOffset, ax, ay, aw, ah,
          Ci.nsIAccessibleCoordinateType.COORDTYPE_SCREEN_RELATIVE);
        return {left: ax.value, top: ay.value,
                right: ax.value + aw.value, bottom: ay.value + ah.value};
      } catch (e) {
      }
    }

    acc.getBounds(ax, ay, aw, ah);
    return {left: ax.value, top: ay.value,
            right: ax.value + aw.value, bottom: ay.value + ah.value};
  },

  show: function show(pivot) {
    if (!pivot.accessible) {
      this.hide();
      return;
    }

    let accRect = {};

    try {
      let self = this;
      let accNode = pivot.accessible.QueryInterface(Ci.nsIAccessNode);
      accNode.scrollTo(Ci.nsIAccessibleScrollType.SCROLL_TYPE_ANYWHERE);
      this.window.setTimeout(function () {
        let rect = self._getSoftFocusRect(pivot.accessible,
                                          pivot.startOffset,
                                          pivot.endOffset);
        let dx = {}, dy = {}, dw = {}, dh = {};
        let docRoot = accNode.rootDocument.QueryInterface(Ci.nsIAccessible);
        docRoot.getBounds(dx, dy, dw, dh);
        accRect = {left: rect.left - dx.value,
                   top: rect.top - dy.value,
                   right: rect.right - dx.value,
                   bottom: rect.bottom - dy.value};
        self.highlight(accRect);
      }, 0);
    } catch (e) {
      console.log("Error getting bounds:", e);
      return;
    }

  }
}