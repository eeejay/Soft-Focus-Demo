const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://softfocusdemo/content/Console.js");

var EXPORTED_SYMBOLS = ["SimpleFilter", "AccessibleTreeWalker"];

var SimpleFilter = {
  FILTER_ACCEPT: 1,
  FILTER_REJECT: 2,
  FILTER_SKIP: 3,

  roles: [Ci.nsIAccessibleRole.ROLE_TEXT_LEAF],
  states: [],

  acceptAccessible: null
};

function AccessibleTreeWalker (root, filter) {
  this.root = root;
  this.currentNode = root;
  this.filter = filter;
}

AccessibleTreeWalker.prototype = {
  NEXT: 0,
  PREV: 1,

  setFilter: function setFilter (filter) {
    this.filter = filter;
  },

  next: function next () {
    return this._walk(this.NEXT);
  },

  previous: function previous () {
    return this._walk(this.PREV);
  },

  _walk: function _walk (direction) {
    let obj = null;
    let nextNode = null;

    if (this.currentNode == this.root)
      nextNode = this.root;
    else
      nextNode = this._nextNode(this.currentNode, direction);

    while (nextNode) {
      let obj = this._searchSubtreeDepth(nextNode, direction);

      if (obj) {
        this.currentNode = obj;
        return obj;
      }

      nextNode = this._nextNode(nextNode, direction);
    }

    return null;
  },

  _nextNode: function _nextNode (node, direction) {
    let sibling = direction == this.NEXT ? "nextSibling" : "previousSibling";
    let nextNode = node;

    while (nextNode && nextNode != this.root)  {
      try {
        if (nextNode[sibling])
          return nextNode[sibling];
      } catch (e) {
      }

      nextNode = nextNode.parent;
    }
    
    return null;
  },

  _searchSubtreeDepth: function _searchSubtreeDepth (obj, direction) {
    if (!obj)
        return null;

    let filterResult = this._applyFilter(obj)

    if (filterResult == this.filter.FILTER_ACCEPT)
      return obj;

    if (filterResult == this.filter.FILTER_REJECT)
      return null;

    let child = direction == this.NEXT ? obj.firstChild : obj.lastChild;

    while (child) {
      let ret = this._searchSubtreeDepth (child, direction);
      if (ret)
        return ret;
      
      try {
        child = child[direction == this.NEXT ? "nextSibling" : "previousSibling"];
      } catch (e) {
        break;
      }
    }
    
    return null;
  },

  _applyFilter: function _applyFilter (node) {
    if (this.filter.roles.length && this.filter.roles.indexOf(node.role) < 0)
      return this.filter.FILTER_SKIP;

    if (this.filter.states.length) {
      let statesMatch = false;
      accState = {};
      acc.getState(accState, null);

      for each (var state in this.filter.states) {
        if (state & accState.value == state) {
          statesMatch = true;
          break;
        }
      }

      if (!statesMatch)
        return this.filter.FILTER_SKIP;
    }

    if (this.filter.acceptAccessible)
      return this.filter.acceptAccessible(node);
    
    return this.filter.FILTER_ACCEPT;
  }
};
