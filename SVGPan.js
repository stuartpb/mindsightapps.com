/**
 *  SVGPan library 1.2.2 (with local tweaks)
 * ======================
 *
 * Given an unique existing element with id "viewport" (or when missing, the first g
 * element), including the the library into any SVG adds the following capabilities:
 *
 *  - Mouse panning
 *  - Mouse zooming (using the wheel)
 *  - Object dragging
 *
 * You can configure the behaviour of the pan/zoom/drag with the variables
 * listed in the CONFIGURATION section of this file.
 *
 * Known issues:
 *
 *  - Zooming (while panning) on Safari has still some issues
 *
 * Releases:
 *
 * 1.2.2, xxxx, Andrea Leofreddi
 *  - Fixed viewBox on root tag (#7)
 *  - Improved zoom speed (#2)
 *
 * 1.2.1, Mon Jul  4 00:33:18 CEST 2011, Andrea Leofreddi
 *  - Fixed a regression with mouse wheel (now working on Firefox 5)
 *  - Working with viewBox attribute (#4)
 *  - Added "use strict;" and fixed resulting warnings (#5)
 *  - Added configuration variables, dragging is disabled by default (#3)
 *
 * 1.2, Sat Mar 20 08:42:50 GMT 2010, Zeng Xiaohui
 *  Fixed a bug with browser mouse handler interaction
 *
 * 1.1, Wed Feb  3 17:39:33 GMT 2010, Zeng Xiaohui
 *  Updated the zoom code to support the mouse wheel on Safari/Chrome
 *
 * 1.0, Andrea Leofreddi
 *  First release
 *
 * This code is licensed under the following BSD license:
 *
 * Copyright 2009-2010 Andrea Leofreddi <a.leofreddi@itcharm.com>. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 *    1. Redistributions of source code must retain the above copyright notice, this list of
 *       conditions and the following disclaimer.
 *
 *    2. Redistributions in binary form must reproduce the above copyright notice, this list
 *       of conditions and the following disclaimer in the documentation and/or other materials
 *       provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY Andrea Leofreddi ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Andrea Leofreddi OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * The views and conclusions contained in the software and documentation are those of the
 * authors and should not be interpreted as representing official policies, either expressed
 * or implied, of Andrea Leofreddi.
 */

"use strict";

/// CONFIGURATION
/// ====>

var enablePan = 1; // 1 or 0: enable or disable panning (default enabled)
var enableZoom = 1; // 1 or 0: enable or disable zooming (default enabled)
var enableDrag = 1; // 1 or 0: enable or disable dragging (default disabled)
var zoomScale = 0.4; // Zoom sensitivity

/// <====
/// END OF CONFIGURATION

var root, viewport;
var state = 'none', stateTarget, stateOrigin, stateTf;

/**
 * Register handlers
 */
function setupHandlers(root){
  setAttributes(root, {
    "onmouseup" : "handleMouseUp(evt)",
    "onmousedown" : "handleMouseDown(evt)",
    "onmousemove" : "handleMouseMove(evt)",
    //"onmouseout" : "handleMouseUp(evt)",
  });

  if(navigator.userAgent.toLowerCase().indexOf('webkit') >= 0)
    window.addEventListener('mousewheel', handleMouseWheel, false); // Chrome/Safari
  else
    window.addEventListener('DOMMouseScroll', handleMouseWheel, false); // Others
}

function setupSVGPan(svgNode, vpNode) {
  root = svgNode;
  viewport = vpNode;

  //viewBox, much to my dismay, changes the reported getCTM for the
  //viewport, which this script uses in several places.
  //This is cheap, but it works.
  var initialCTM = viewport.getCTM();
  root.removeAttribute('viewBox');
  setCTM(viewport,initialCTM);

  setupHandlers(svgNode);
}

/**
 * Instance an SVGPoint object with given event coordinates.
 */
function getEventPoint(evt) {
  var p = root.createSVGPoint();

  // Webkit, IE9
  if (evt.offsetX !== undefined && evt.offsetY !== undefined) {
    p.x= evt.offsetX; p.y= evt.offsetY;
  // Firefox
  } else if (evt.layerX !== undefined && evt.layerY !== undefined){
    p.x= evt.layerX; p.y= evt.layerY;
  // Older IEs
  } else if (window.event && window.event.contentOverflow !== undefined) {
    p.x= window.event.offsetX; p.y= window.event.offsetY;
  // Worst-case scenario, try this
  } else {
    p.x = evt.clientX;
    p.y = evt.clientY;
  }

  return p;
}

/**
 * Sets the current transform matrix of an element.
 */
function setCTM(element, matrix) {
  element.transform.baseVal.initialize(
    root.createSVGTransformFromMatrix(matrix));
}

/**
 * Sets attributes of an element.
 */
function setAttributes(element, attributes){
  for (var i in attributes)
    element.setAttributeNS(null, i, attributes[i]);
}

function preventDefault(evt){
  if(evt.preventDefault)
    evt.preventDefault();

  evt.returnValue = false;
}

/**
 * Handle mouse wheel event.
 */
function handleMouseWheel(evt) {
  if(!enableZoom)
    return;

  if(evt.preventDefault)
    evt.preventDefault();

  evt.returnValue = false;

  var delta;

  if(evt.wheelDelta)
    delta = evt.wheelDelta / 360; // Chrome/Safari
  else
    delta = evt.detail / -9; // Mozilla

  var z = Math.pow(1 + zoomScale, delta);

  var p = getEventPoint(evt);

  p = p.matrixTransform(viewport.getCTM().inverse());

  // Compute new scale matrix in current mouse position
  var k = root.createSVGMatrix()
    .translate(p.x, p.y)
    .scale(z)
    .translate(-p.x, -p.y);

  setCTM(viewport, viewport.getCTM().multiply(k));

  if(typeof(stateTf) == "undefined")
    stateTf = viewport.getCTM().inverse();

  stateTf = stateTf.multiply(k.inverse());
}

/**
 * Handle mouse move event.
 */
function handleMouseMove(evt) {
  var p;
  if(state){
    if(state == 'pan') {
      // Pan mode
      p = getEventPoint(evt).matrixTransform(stateTf);

      setCTM(viewport, stateTf.inverse()
        .translate(p.x - stateOrigin.x, p.y - stateOrigin.y));
    } else if(state == 'drag') {
      // Drag mode
      p = getEventPoint(evt).matrixTransform(viewport.getCTM().inverse());

      setCTM(stateTarget, root.createSVGMatrix()
        .translate(p.x - stateOrigin.x, p.y - stateOrigin.y)
        .multiply(viewport.getCTM().inverse())
        .multiply(stateTarget.getCTM()));

      stateOrigin = p;
    }
    preventDefault(evt);
  }
}

/**
 * Handle click event.
 */
function handleMouseDown(evt) {
  function stateFrom(target){
    if(target.getAttribute("data-fixed") !== null) {
      stateTarget = target;
      return "pan";
    } else if(target.getAttribute("data-draggable") !== null){
      stateTarget = target;
      return "drag";
    } else if(target != root){
      return stateFrom(target.parentNode);
    } else {
      return null;
    }
  }

  state = stateFrom(evt.target);

  if(state){
    preventDefault(evt);

    stateTf = viewport.getCTM().inverse();

    stateOrigin = getEventPoint(evt).matrixTransform(stateTf);
  }
}

/**
 * Handle mouse button release event.
 */
function handleMouseUp(evt) {
  if(state) {
    // Quit pan mode
    state = null;

    preventDefault(evt);
  }
}
