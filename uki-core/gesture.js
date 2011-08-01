/**
* Copyright (c) 2011, Vladimir Kolesnikov, Facebook, Inc.
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
* This file was automatically generated from uki source by Facebook.
* @providesModule uki-gesture
* @option preserve-header
*/

var utils = require("./utils"),
    env = require("./env"),
    evt = require("./event");

var gesture = {
    draggable: null,
    position: null,
    cursor: null
};

var handlers = {},
    mark = '__draggesturebound';

// add single drag set of drag events for an element
// regardless of the number of listeners
var addDraggestures = {
    setup: function(el) {
        if (el[mark]) {
            el[mark]++;
        } else {
            el[mark] = 1;
            evt.on(el, 'mousedown', dragGestureStart);
        }
    },
    teardown: function(el) {
        el[mark]--;
        if (!el[mark]) {
            evt.removeListener(el, 'mousedown', dragGestureStart);
        }
    }
};

// drag gestures
utils.extend(evt.special, {
    draggesturestart: addDraggestures,
    draggestureend: addDraggestures,
    draggesture: addDraggestures
});

function startGesture (el, e) {
    if (gesture.draggable) return;
    gesture.draggable = e.draggable || el;
    if (e.cursor) {
        gesture.cursor = env.doc.body.style.cursor;
        env.doc.body.style.cursor = e.cursor;
    }
    evt.on(env.doc, 'mousemove scroll', dragGesture);
    evt.on(env.doc, 'mouseup dragend', dragGestureEnd);
    evt.on(env.doc, 'selectstart mousedown', evt.preventDefaultHandler);
}

function stopGesture () {
    gesture.draggable = null;
    env.doc.body.style.cursor = gesture.cursor;
    gesture.cursor = null;
    evt.removeListener(env.doc, 'mousemove scroll', dragGesture);
    evt.removeListener(env.doc, 'mouseup dragend', dragGestureEnd);
    evt.removeListener(env.doc, 'selectstart mousedown', evt.preventDefaultHandler);
}

function addOffset(e) {
    e.dragOffset = {
        x: e.pageX - gesture.position.x,
        y: e.pageY - gesture.position.y
    };
}

function dragGestureStart (e) {
    e = evt.createEvent(e, { type: 'draggesturestart', simulatePropagation: true });
    e.dragOffset = {
        x: 0,
        y: 0
    };
    evt.trigger(this, e);
    if (!e.isDefaultPrevented()) {
        gesture.position = { x: e.pageX, y: e.pageY };
        startGesture(this, e);
    }
}

function dragGesture (e) {
    e = evt.createEvent(e, { type: 'draggesture', simulatePropagation: true });
    addOffset(e);
    evt.trigger(gesture.draggable, e);

    if (e.isDefaultPrevented()) stopGesture(gesture.draggable);
}

function dragGestureEnd (e) {
    e = evt.createEvent(e, { type: 'draggestureend', simulatePropagation: true });
    addOffset(e);
    evt.trigger(gesture.draggable, e);

    stopGesture(gesture.draggable);
}

module.exports = gesture;
