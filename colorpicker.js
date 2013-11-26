/**
 * ColorPicker - pure JavaScript color picker without using images, external CSS or 1px divs.
 * Copyright © 2011 David Durman, All rights reserved.
 */
(function(window, document, undefined) {

    var type = (window.SVGAngle || document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? "SVG" : "VML"),
        picker, slide, hueOffset = 15, svgNS = 'http://www.w3.org/2000/svg';

    /**
     * Return mouse position relative to the element el.
     */
    function mousePosition(evt) {
        // IE:
        if (window.event && window.event.contentOverflow !== undefined) {
            return { x: window.event.offsetX, y: window.event.offsetY };
        }
        // Webkit:
        if (evt.offsetX !== undefined && evt.offsetY !== undefined) {
            return { x: evt.offsetX, y: evt.offsetY };
        }
        // Firefox:
        var wrapper = evt.target.parentNode.parentNode;
        return { x: evt.layerX - wrapper.offsetLeft, y: evt.layerY - wrapper.offsetTop };
    }

    /**
     * Create SVG element.
     */
    function $(el, attrs, children) {
        el = document.createElementNS(svgNS, el);
        for (var key in attrs)
            el.setAttribute(key, attrs[key]);
        if (Object.prototype.toString.call(children) != '[object Array]') children = [children];
        var i = 0, len = (children[0] && children.length) || 0;
        for (; i < len; i++)
            el.appendChild(children[i]);
        return el;
    }

    /**
     * Create slide and picker markup depending on the supported technology.
     */
    if (type == 'SVG') {

        slide = $('svg', { xmlns: 'http://www.w3.org/2000/svg', version: '1.1', width: '100%', height: '100%' },
                  [
                      $('defs', {},
                        $('linearGradient', { id: 'gradient-hsv', x1: '0%', y1: '100%', x2: '0%', y2: '0%'},
                          [
                              $('stop', { offset: '0%', 'stop-color': '#FF0000', 'stop-opacity': '1' }),
                              $('stop', { offset: '13%', 'stop-color': '#FF00FF', 'stop-opacity': '1' }),
                              $('stop', { offset: '25%', 'stop-color': '#8000FF', 'stop-opacity': '1' }),
                              $('stop', { offset: '38%', 'stop-color': '#0040FF', 'stop-opacity': '1' }),
                              $('stop', { offset: '50%', 'stop-color': '#00FFFF', 'stop-opacity': '1' }),
                              $('stop', { offset: '63%', 'stop-color': '#00FF40', 'stop-opacity': '1' }),
                              $('stop', { offset: '75%', 'stop-color': '#0BED00', 'stop-opacity': '1' }),
                              $('stop', { offset: '88%', 'stop-color': '#FFFF00', 'stop-opacity': '1' }),
                              $('stop', { offset: '100%', 'stop-color': '#FF0000', 'stop-opacity': '1' })
                          ]
                         )
                       ),
                      $('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: 'url(#gradient-hsv)'})
                  ]
                 );

        picker = $('svg', { xmlns: 'http://www.w3.org/2000/svg', version: '1.1', width: '100%', height: '100%' },
                   [
                       $('defs', {},
                         [
                             $('linearGradient', { id: 'gradient-black', x1: '0%', y1: '100%', x2: '0%', y2: '0%'},
                               [
                                   $('stop', { offset: '0%', 'stop-color': '#000000', 'stop-opacity': '1' }),
                                   $('stop', { offset: '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0' })
                               ]
                              ),
                             $('linearGradient', { id: 'gradient-white', x1: '0%', y1: '100%', x2: '100%', y2: '100%'},
                               [
                                   $('stop', { offset: '0%', 'stop-color': '#FFFFFF', 'stop-opacity': '1' }),
                                   $('stop', { offset: '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0' })
                               ]
                              )
                         ]
                        ),
                       $('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: 'url(#gradient-white)'}),
                       $('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: 'url(#gradient-black)'})
                   ]
                  );

    } else if (type == 'VML') {
        slide = [
            '<DIV style="position: relative; width: 100%; height: 100%">',
            '<v:rect style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" stroked="f" filled="t">',
            '<v:fill type="gradient" method="none" angle="0" color="red" color2="red" colors="8519f fuchsia;.25 #8000ff;24903f #0040ff;.5 aqua;41287f #00ff40;.75 #0bed00;57671f yellow"></v:fill>',
            '</v:rect>',
            '</DIV>'
        ].join('');

        picker = [
            '<DIV style="position: relative; width: 100%; height: 100%">',
            '<v:rect style="position: absolute; left: -1px; top: -1px; width: 101%; height: 101%" stroked="f" filled="t">',
            '<v:fill type="gradient" method="none" angle="270" color="#FFFFFF" opacity="100%" color2="#CC9A81" o:opacity2="0%"></v:fill>',
            '</v:rect>',
            '<v:rect style="position: absolute; left: 0px; top: 0px; width: 100%; height: 101%" stroked="f" filled="t">',
            '<v:fill type="gradient" method="none" angle="0" color="#000000" opacity="100%" color2="#CC9A81" o:opacity2="0%"></v:fill>',
            '</v:rect>',
            '</DIV>'
        ].join('');

        if (!document.namespaces['v'])
            document.namespaces.add('v', 'urn:schemas-microsoft-com:vml', '#default#VML');
    }

    /**
     * Convert HSV representation to RGB HEX string.
     * Credits to http://www.raphaeljs.com
     */
    function hsv2rgb(h, s, v) {
        var R, G, B, X, C;
        h = (h % 360) / 60;
            C = v * s;
        X = C * (1 - Math.abs(h % 2 - 1));
        R = G = B = v - C;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];

        var r = R * 255,
            g = G * 255,
            b = B * 255;
        return { r: r, g: g, b: b, hex: "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1) };
    }

    /**
     * Convert RGB representation to HSV.
     * r, g, b can be either in <0,1> range or <0,255> range.
     * Credits to http://www.raphaeljs.com
     */
    function rgb2hsv(r, g, b) {
        if (r > 1 || g > 1 || b > 1) {
            r /= 255;
            g /= 255;
            b /= 255;
        }
        var H, S, V, C;
        V = Math.max(r, g, b);
        C = V - Math.min(r, g, b);
        H = (C == 0 ? null :
             V == r ? (g - b) / C + (g < b ? 6 : 0) :
             V == g ? (b - r) / C + 2 :
                      (r - g) / C + 4);
        H = (H % 6) * 60;
        S = C == 0 ? 0 : C / V;
        return { h: H, s: S, v: V };
    }

    /**
     * Return click event handler for the slider.
     * Sets picker background color and calls ctx.callback if provided.
     */
    function slideListener(ctx, slideElement, pickerElement) {
        return function(evt, callback) {
            evt = evt || window.event;
            var mouse = mousePosition(evt);
            ctx.h = mouse.y / slideElement.offsetHeight * 360 + hueOffset;
            if (this.resetOnHueChange) {
                ctx.s = ctx.v = 1;
            }
            var c = hsv2rgb(ctx.h, ctx.s, ctx.v);
            pickerElement.style.backgroundColor = hsv2rgb(ctx.h,1,1).hex;
            callback && callback(c.hex, { h: ctx.h - hueOffset, s: ctx.s, v: ctx.v }, { r: c.r, g: c.g, b: c.b }, undefined, mouse);
            return false;
        };
    }

    /**
     * Return click event handler for the picker.
     * Calls ctx.callback if provided.
     */
    function pickerListener(ctx, pickerElement) {
        return function(evt, callback) {
            evt = evt || window.event;
            var mouse = mousePosition(evt),
                width = pickerElement.offsetWidth,
                height = pickerElement.offsetHeight;

            ctx.s = mouse.x / width;
            ctx.v = (height - mouse.y) / height;
            var c = hsv2rgb(ctx.h, ctx.s, ctx.v);
            callback && callback(c.hex, { h: ctx.h - hueOffset, s: ctx.s, v: ctx.v }, { r: c.r, g: c.g, b: c.b }, mouse);
            return false;
        };
    }

    function addDragDropListeners(element,listener,dragCallback,dropCallback){
      var held = false;
      function mouseDownListener(evt){
        held = true;
        listener(evt,dragCallback);
      }
      function mouseMoveListener(evt){
        if (held) {
          listener(evt,dragCallback);
        }
      }
      function mouseUpListener(evt){
        if (held) {
          held = false;
          listener(evt,dropCallback);
        }
      }
      if (element.addEventListener) {
        element.addEventListener('mousedown', mouseDownListener, false);
        element.addEventListener('mousemove', mouseMoveListener, false);
        element.addEventListener('mouseup', mouseUpListener, false);
        element.addEventListener('mouseout', mouseUpListener, false);
      } else if (element.attachEvent) {
        element.attachEvent('onmousedown', mouseDownListener);
        element.attachEvent('onmousemove', mouseMoveListener);
        element.attachEvent('onmouseup', mouseUpListener);
        element.attachEvent('onmouseout', mouseUpListener);
      }
    }

    /**
     * ColorPicker.
     * @param {DOMElement} slideElement HSV slide element.
     * @param {DOMElement} pickerElement HSV picker element.
     * @param {Function} moveCallback Called whenever the color is changed. Provides the hex, HSV, and RGB colors, as well as the picker or slide mouse event (if any).
     * @param {Function} moveCallback Called when the color is chosen (mouseup). Provides the hex, HSV, and RGB colors, as well as the picker or slide mouse event (if any).
     */
    function ColorPicker(slideElement, pickerElement, moveCallback, finalizeCallback) {
        if (!(this instanceof ColorPicker)) return new ColorPicker(slideElement, pickerElement, moveCallback, finalizeCallback);

        this.moveCallback = moveCallback;
        this.finalizeCallback = finalizeCallback;
        this.h = 0;
        this.s = 1;
        this.v = 1;
        this.pickerElement = pickerElement;
        this.slideElement = slideElement;

        if (type == 'SVG') {
            slideElement.appendChild(slide.cloneNode(true));
            pickerElement.appendChild(picker.cloneNode(true));
        } else {
            slideElement.innerHTML = slide;
            pickerElement.innerHTML = picker;
        }

        addDragDropListeners(slideElement,slideListener(this, slideElement, pickerElement),moveCallback,finalizeCallback);
        addDragDropListeners(pickerElement, pickerListener(this, pickerElement),moveCallback,finalizeCallback);
    }

    /**
     * Sets color of the picker in hsv/rgb/hex format.
     * @param {object} ctx ColorPicker instance.
     * @param {object} hsv Object of the form: { h: <hue>, s: <saturation>, v: <value> }.
     * @param {object} rgb Object of the form: { r: <red>, g: <green>, b: <blue> }.
     * @param {string} hex String of the form: #RRGGBB.
     */
     function setColor(ctx, hsv, rgb, hex) {
        //Don't modify the last chosen hue if there's no saturation value
        if (ctx.s > 0) {
          ctx.h = hsv.h % 360;
        }
        ctx.s = hsv.s;
        ctx.v = hsv.v;
        var c = hsv2rgb(ctx.h, ctx.s, ctx.v),
            mouseSlide = {
                y: (ctx.h * ctx.slideElement.offsetHeight) / 360,
                x: 0    // not important
            },
            pickerHeight = ctx.pickerElement.offsetHeight,
            mousePicker = {
                x: ctx.s * ctx.pickerElement.offsetWidth,
                y: pickerHeight - ctx.v * pickerHeight
            };
        ctx.pickerElement.style.backgroundColor = hsv2rgb(ctx.h, 1, 1).hex;
        ctx.moveCallback && ctx.moveCallback(hex || c.hex, { h: ctx.h, s: ctx.s, v: ctx.v }, rgb || { r: c.r, g: c.g, b: c.b }, mousePicker, mouseSlide);
    }

    /**
     * Sets color of the picker in rgb format.
     * @param {object} rgb Object of the form: { r: <red>, g: <green>, b: <blue> }.
     */
    ColorPicker.prototype.setHsv = function(hsv) {
        setColor(this, hsv);
    };

    /**
     * Sets color of the picker in rgb format.
     * @param {object} rgb Object of the form: { r: <red>, g: <green>, b: <blue> }.
     */
    ColorPicker.prototype.setRgb = function(rgb) {
        setColor(this, rgb2hsv(rgb.r, rgb.g, rgb.b), rgb);
    };

    /**
     * Sets color of the picker in hex format.
     * @param {string} hex Hex color format #RRGGBB.
     */
    ColorPicker.prototype.setHex = function(hex) {
        setColor(this, rgb2hsv(parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)), undefined, hex);
    };

    ColorPicker.hsv2rgb = hsv2rgb;
    ColorPicker.rgb2hsv = rgb2hsv;

    /**
     * Helper to position indicators.
     * @param {HTMLElement} slideIndicator DOM element representing the indicator of the slide area.
     * @param {HTMLElement} pickerIndicator DOM element representing the indicator of the picker area.
     * @param {object} mouseSlide Coordinates of the mouse cursor in the slide area.
     * @param {object} mousePicker Coordinates of the mouse cursor in the picker area.
     * @param {string} unit Unit to set position in. px or % are supported (percentage is decided by height of parentElement).
     */
    ColorPicker.positionIndicators = function(slideIndicator, pickerIndicator, mouseSlide, mousePicker, unit) {
        unit = unit || 'px';
        if (mouseSlide) {
            if (unit == 'px') {
                if (this.resetOnHueChange) {
                    pickerIndicator.style.left = 'auto';
                    pickerIndicator.style.right = '0px';
                    pickerIndicator.style.top = '0px';
                }
                slideIndicator.style.top = (mouseSlide.y - slideIndicator.offsetHeight / 2) + 'px';
            } else if (unit == '%') {
                if (this.resetOnHueChange) {
                    pickerIndicator.style.left = 'auto';
                    pickerIndicator.style.right = '100%';
                    pickerIndicator.style.top = '100%';
                }
                var parentHeight = slideIndicator.parentElement.offsetHeight;
                slideIndicator.style.top = (mouseSlide.y / parentHeight - slideIndicator.offsetHeight / parentHeight / 2) * 100 + '%';
            }
        }
        if (mousePicker) {
            if (unit == 'px') {
                pickerIndicator.style.top = (mousePicker.y - pickerIndicator.offsetHeight / 2) + 'px';
                pickerIndicator.style.left = (mousePicker.x - pickerIndicator.offsetWidth / 2) + 'px';
            } else if (unit == '%') {
                var parentHeight = pickerIndicator.parentElement.offsetHeight;
                var parentWidth = pickerIndicator.parentElement.offsetWidth;
                pickerIndicator.style.top = (mousePicker.y / parentHeight - pickerIndicator.offsetHeight / parentHeight / 2) * 100 + '%';
                pickerIndicator.style.left = (mousePicker.x / parentWidth - pickerIndicator.offsetWidth / parentWidth / 2) * 100 + '%';
            }
        }
    };

    window.ColorPicker = ColorPicker;

})(window, window.document);
