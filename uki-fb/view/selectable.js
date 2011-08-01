/**
* Copyright (c) 2011, Facebook, Inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*   * Redistributions of source code must retain the above copyright notice,
*     this list of conditions and the following disclaimer.
*   * Redistributions in binary form must reproduce the above copyright notice,
*     this list of conditions and the following disclaimer in the documentation
*     and/or other materials provided with the distribution.
*   * Neither the name Facebook nor the names of its contributors may be used to
*     endorse or promote products derived from this software without specific
*     prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*
*/


var env   = require("../../uki-core/env"),
    fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    dom   = require("../../uki-core/dom"),
    view  = require("../../uki-core/view");


var Selectable = {};

Selectable._initSelectable = function() {
  this._selectedIndexes = [];
  this._lastClickIndex = [];
  this._addSelectionEvents();
};

fun.addProp(Selectable, 'multiselect');
Selectable._multiselect = false;

Selectable._setSelected = function(index, state) {
  // abstract
};

Selectable.scrollToIndex = function(pos) {
  // abstract
};

/**
* Read/write current selected index for selectable lists
* @function
* @param {Number} position
*/
Selectable.selectedIndex = function(position) {
  if (position === undefined) {
    return this._selectedIndexes.length ? this._selectedIndexes[0] : -1;
  }
  this.selectedIndexes([position]);
  return this;
};

/**
* Read/write all selected indexes for multiselectable lists
* @function
* @param {Array.<Number>} position
*/
Selectable.selectedIndexes = function(indexes) {
  if (indexes === undefined) {
    return this._selectedIndexes;
  }
  this.clearSelection(true);
  this._selectedIndexes = indexes;
  for (var i = 0; i < this._selectedIndexes.length; i++) {
    this._setSelected(this._selectedIndexes[i], true);
  }
  return this;
};

Selectable.moveSelectedIndex = function(offset) {
  var newIndex = this.selectedIndex() + offset;
  newIndex = Math.min(newIndex, this.data().length - 1);
  newIndex = Math.max(0, newIndex);
  if (newIndex != this.selectedIndex()) {
    this.selectedIndex(newIndex);
    return true;
  }
  return false;
};

Selectable.clearSelection = function(skipClickIndex) {
  for (var i = 0; i < this._selectedIndexes.length; i++) {
    this._setSelected(this._selectedIndexes[i], false);
  }
  this._selectedIndexes = [];
  if (!skipClickIndex) {
    this._lastClickIndex = -1;
  }
};

Selectable.isSelected = function(index) {
  var found = utils.binarySearch(this._selectedIndexes, index);
  return this._selectedIndexes[found] == index;
};

Selectable._toggleSelection = function(p) {
  var indexes = [].concat(this._selectedIndexes);
  var addTo = utils.binarySearch(indexes, p);
  if (indexes[addTo] == p) {
    indexes.splice(addTo, 1);
  } else {
    indexes.splice(addTo, 0, p);
  }
  this.selectedIndexes(indexes);
};

/** ---------- Selection Events -------------- **/

Selectable.keyPressEvent = function() {
  var useKeyPress = window.opera ||
    (/mozilla/i.test(env.ua) && !(/(compatible|webkit)/i).test(env.ua));
  return useKeyPress ? 'keypress' : 'keydown';
};

Selectable._addSelectionEvents = function() {
  this.on('mousedown', this._selectionMousedown);
  this.on('mouseup', this._selectionMouseup);
  this.on(this.keyPressEvent(), this._selectionKeypress);
  this.on('focus', this._selectionFocus);
  this.on('blur', this._selectionBlur);
};

function range(from, to) {
  var result = new Array(to - from);
  for (var idx = 0; from <= to; from++, idx++) {
    result[idx] = from;
  }
  return result;
}

function removeRange(array, from, to) {
  var p = utils.binarySearch(array, from),
      initialP = p;
  while (array[p] <= to) { p++; }
  if (p > initialP) { array.splice(initialP, p - initialP); }
}

Selectable._itemUnderCursor = function(e) {
  var o = this.clientRect(),
      y = e.pageY - o.top;

  return y / this._rowHeight << 0;
};

Selectable._selectionMouseup = function(e) {
  var p = this._itemUnderCursor(e);

  if (!this._multiselect || !this._selectionInProcess) {
    if (this._lastClickIndex == p && !this._multiselect) {
      if (this._hadFocusOnSelectionStart) {
        this._selectionEdit(e);
      }
    }
    return;
  }

  if (this._lastClickIndex == p && this.isSelected(p)) {
    if (this.selectedIndexes().length === 1) {
      if (this._hadFocusOnSelectionStart) {
        this._selectionEdit(e);
      }
    } else {
      this.selectedIndexes([p]);
      this._triggerSelection();
    }
  }
  this._selectionInProcess = false;
};

Selectable._selectionEdit = function() {};

Selectable._removeFromSelection = function(from, to) {
  indexes = [].concat(this.selectedIndexes());
  removeRange(indexes, from, to);
  this.selectedIndexes(indexes);
};

Selectable._selectionMousedown = function(e) {
  var p = this._itemUnderCursor(e),
  indexes = this._selectedIndexes;

  this._hadFocusOnSelectionStart = this.hasFocus() &&
  this.isSelected(p);

  if (this._multiselect) {
    this._selectionInProcess = false;
    if (e.shiftKey && indexes.length > 0) {
      if (this.isSelected(p)) {
        this._removeFromSelection(
          Math.min(p + 1, this._lastClickIndex),
          Math.max(p - 1, this._lastClickIndex)
        );
      } else {
        this.selectedIndexes(range(
          Math.min(p, indexes[0]),
          Math.max(p, indexes[indexes.length - 1])
        ));
      }
      this._triggerSelection();
    } else if (e.metaKey || e.ctrlKey) {
      this._toggleSelection(p);
      this._triggerSelection();
    } else {
      if (this.isSelected(p)) {
        this._selectionInProcess = true;
      } else {
        this.selectedIndexes([p]);
        this._triggerSelection();
      }
    }
  } else {
    this.selectedIndexes([p]);
    this._triggerSelection();
  }
  this._lastClickIndex = p;
};

Selectable._selectionKeypress = function(e) {
  if (!this.hasFocus()) { return; }

  var indexes = this._selectedIndexes,
    nextIndex = -1;
  if (e.which == 38 || e.keyCode == 38) { // UP
    nextIndex = Math.max(0, this._lastClickIndex - 1);
    e.preventDefault();
  } else if (e.which == 40 || e.keyCode == 40) { // DOWN
    nextIndex = Math.min(this.data().length - 1, this._lastClickIndex + 1);
    e.preventDefault();
  } else if (this._multiselect &&
    (e.which == 97 || e.which == 65) &&
    (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    this.selectedIndexes(range(0, this.data().length - 1));
    this._triggerSelection();
  }
  if (nextIndex > -1 && nextIndex != this._lastClickIndex) {
    if (e.shiftKey && this._multiselect) {
      if (this.isSelected(nextIndex)) {
        this._toggleSelection(this._lastClickIndex);
      } else {
        this._toggleSelection(nextIndex);
      }
    } else {
      this.selectedIndex(nextIndex);
    }
    this._triggerSelection();
    this.scrollToIndex(nextIndex);
    this._lastClickIndex = nextIndex;
  }
};

Selectable._selectionFocus = function(e) {
  if (this._selectedIndexes.length === 0 && this.data().length > 0) {
    this.selectedIndexes([0])
      .lastClickIndex(0)
      .scrollToIndex(0)
      ._triggerSelection();
  } else {
    if (this._deferedTriggerSelection) {
      this._triggerSelection();
    }
  }
};

Selectable._selectionBlur = function(e) {
};

Selectable._triggerSelection = function(force) {
  // never fire selection when unfocused
  // wait till focus to fire
  if (this.hasFocus() || force) {
    this.trigger({type: 'selection', target: this});
    this._deferedTriggerSelection = false;
  } else {
    this._deferedTriggerSelection = true;
  }
};


exports.Selectable = Selectable;
