'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/




// focus: 500, 250      position: 0, 0
// focus1: 200, 50      position: 300, 200
// focus50: 350, 150    position: 150, 100

// focus: 500, 250      position: 0, 0
// focus1: 200, 50      position: 300, 200
// focus50: 350, 150    position: 150, 100





var clamp = _.clamp;
var isElement = _.isElement;
var isFinite = _.isFinite;
var isNil = _.isNil;
var isObject = _.isObject;
var isString = _.isString;
var pick = _.pick;
var uniqueId = _.uniqueId;

var Matrix2 = Oculo.Matrix2;
var Vector2 = Oculo.Vector2;

/**
* @class Camera.Animation
* @constructor
* @memberof Camera
* @extends external:TimelineMax
* @param {Camera} camera - The camera on which the animation will be applied.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
*
* @example
* var myAnimation = new Camera.Animation(myCamera, { paused: true }).zoomTo(2,1).shake(0.1,2).resume();
*/
class Animation2 extends TimelineMax {
    constructor (camera, options) {
        super(Object.assign({}, options, {
            data: {
                id: uniqueId()
            },
            paused: true
        }));
                                   
        /**
        * @property {Camera} - The camera on which the animation will be applied.
        */
        this.camera = camera;
        
        this.eventCallback('onStart', function () { 
            this.camera.isAnimating = true;
            this.camera.draggable.disable();
        }, null, this);

        this.eventCallback('onUpdate', function () {
            var x = this.camera.content.x;
            var y = this.camera.content.y;

            //var position = this.camera.calculatePosition99(this.camera);
            //x = -position.x;
            //y = -position.y;
            
            //console.log('position: ', x, y);
            //var position = new Vector2(x, y);
            //var rad = Oculo.Math.degToRad(this.camera.content.rotation);
            //var rotatedPosition = Vector2.transform(position, new Matrix2(Math.cos(rad), -Math.sin(rad), Math.sin(rad), Math.cos(rad)));
            //console.log('rotated: ', rotatedPosition.x, rotatedPosition.y);
            
            //var rotatedFocus = Vector2.transform(position, new Matrix2(Math.cos(rad), -Math.sin(rad), Math.sin(rad), Math.cos(rad)));
            //console.log('rotated focus: ', focus.x, focus.y);
            
//            if (this.data.startFocusX && this.data.startFocusY) {
//                var focus = new Vector2(this.camera.focusX, this.camera.focusY).transform(new Matrix2().rotate(Oculo.Math.degToRad(this.camera.content.rotation)));
//                var position = this.camera.calculatePosition(focus.x, focus.y, this.camera.viewportWidth, this.camera.viewportHeight, this.camera.zoomX, this.camera.zoomY);
//                x = -position.x;
//                y = -position.y;
//            }
            
            //var position = this.camera.calculatePosition2(this.camera, this.camera.focusX3, this.camera.focusY3, this.camera.zoomX, this.camera.zoomY, this.camera.rotation);
            //x = -position.x;
            //y = -position.y;
            //console.log(this.camera.focusX, this.camera.focusY);
            //console.log(this.camera.focusX3, this.camera.focusY3);
            
            // tween content position
            // 497.49, 248.75
            // 484.26, 241.3
            
            // tween focus
            // 
            
            // render
            TweenMax.set(this.camera.content.transformEl, { 
                css: {
                    scaleX: this.camera.content.scaleX,
                    scaleY: this.camera.content.scaleY,
                    x: x,
                    y: y
                }
            });
            
            TweenMax.set(this.camera.content.rotateEl, { 
                css: {
                    rotation: this.camera.content.rotation,
                    transformOrigin: this.camera.rotationOriginX + 'px ' + this.camera.rotationOriginY + 'px'
                }
            });

            this.camera._renderDebug();
        }, null, this);

        this.eventCallback('onComplete', function () { 
            console.log('camera TL complete');
            // render position without effects applied
            TweenMax.set(this.camera.content.transformEl, { 
                css: {
                    //x: this.camera.content.x,
                    //y: this.camera.content.y
                }
            });
            this.camera.isAnimating = false;
            this.camera.draggable.enable();
            this.camera._renderDebug();
        }, null, this);
    }

    /**
    * Zooms in/out at a specific point.
    *
    * @private
    * @param {number} zoomX - A {@link Camera#zoomX|zoomX} value for the x axis.
    * @param {number} zoomY - A {@link Camera#zoomY|zoomY} value for the y axis.
    * @param {number} x - A x axis anchor value.
    * @param {number} y - A y axis anchor value.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @param {number} [position] - The placement of the effect in the timeline.
    * @returns {this} self
    */
    _zoomAtXY (zoomX, zoomY, x, y, duration, options, position) {
        this.add(TweenMax.to(this.camera, duration, Object.assign({}, options, {
            data: {
                zoomX: this.camera.clampZoom(zoomX === null ? this.camera.zoomX : zoomX),
                zoomY: this.camera.clampZoom(zoomY === null ? this.camera.zoomY : zoomY),
                x: x === null ? this.camera.focusX : x,
                y: y === null ? this.camera.focusY : y
            },
            callbackScope: this,
            onStart: function (tween) { 
                var anchor = this.camera.checkFocusBounds(tween.data.x, tween.data.y);
                var focus = this.camera.calculateFocus(this.camera.focusX, this.camera.focusY, anchor.x, anchor.y, this.camera.zoomX / tween.data.zoomX, this.camera.zoomY / tween.data.zoomY);
                var position = this.camera.calculatePosition(focus.x, focus.y, this.camera.viewportWidth, this.camera.viewportHeight, tween.data.zoomX, tween.data.zoomY);

                this.camera.zoomOriginX = tween.data.x;
                this.camera.zoomOriginY = tween.data.y;

                tween.updateTo({
                    x: position.x,
                    y: position.y,
                    zoomX: tween.data.zoomX,
                    zoomY: tween.data.zoomY
                });
            },
            onStartParams: ['{self}']
        })), position);

        return this;
    }
    
    /**
    * Focus on a point or an element.
    *
    * @param {Object|Element|String} focus - A object with x/y coordinates, an element, or a selector.
    * @param {number} [focus.x] - The x coordinate on the raw content.
    * @param {number} [focus.y] - The y coordinate on the raw content.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *//**
    * Focus on a point.
    *
    * @param {number} x - The x coordinate on the raw content.
    * @param {number} y - The y coordinate on the raw content.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.focusOn(document.getElementById('box100'), 1)
    * myAnimation.focusOn('#box100', 1)
    * myAnimation.focusOn({x: 200}, 1)
    * myAnimation.focusOn({y: 200}, 1)
    * myAnimation.focusOn({x:200, y: 50}, 1)
    * myAnimation.focusOn(200, 50, 1)
    */
    focusOn (focusX, focusY, duration, options) {
        var element = null;
        var focus = {};
        
        // Focus on an element
        if (arguments.length > 1 && (isObject(focusX) || isString(focusX))) {
            options = duration;
            duration = focusY;
            focus = focusX;
        }
        // Focus on an x/y coordinate
        else if (arguments.length > 2) {
            focus.x = focusX;
            focus.y = focusY;
        }
        else {
            throw new Error(constants.errorMessage.METHOD_SIGNATURE);
        }

        this.animate({
            focus: focus
        }, duration, options);

        return this;
    }
    
    /**
    * Zooms in/out on an element.
    *
    * @param {number|Object} zoom - A zoom value for both axes.
    * @param {number} [zoom.x] - A {@link Camera.zoomX|zoomX} value for the x axis.
    * @param {number} [zoom.y] - A {@link Camera.zoomY|zoomY} value for the y axis.
    * @param {Element} element - An element.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.zoomTo(2, document.getElementById('door'), 1)
    * myAnimation.zoomTo({x: 2}, document.getElementById('door'), 1)
    * myAnimation.zoomTo({y: 2}, document.getElementById('door'), 1)
    * myAnimation.zoomTo({x:2, y: 0.5}, document.getElementById('door'), 1)
    *//**
    * Zooms in/out at a point.
    *
    * @param {number} zoom - A zoom value for both axes.
    * @param {number} [zoom.x] - A {@link Camera.zoomX|zoomX} value for the x axis.
    * @param {number} [zoom.y] - A {@link Camera.zoomY|zoomY} value for the y axis.
    * @param {number} x - The x coordinate on the raw content.
    * @param {number} y - The y coordinate on the raw content.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.zoomTo(2, 100, 100, 1)
    * myAnimation.zoomTo({x: 2}, 100, 100, 1)
    * myAnimation.zoomTo({y: 2}, 100, 100, 1)
    * myAnimation.zoomTo({x:2, y: 0.5}, 100, 100, 1)
    */
    zoomAt (target, zoom, duration, options) {
        this.animate({
            origin: target,
            zoom: zoom
        }, duration, options);
        
        return this;
    }
    
    _tween (props, duration, options) {
        this.add(TweenMax.to(this.camera, duration, Object.assign({}, options, {
            data: {
                focusX: props.focusX,
                focusY: props.focusY,
                originX: props.originX,
                originY: props.originY,
                rotation: props.rotation,
                zoomX: props.zoomX,
                zoomY: props.zoomY
            },
            callbackScope: this,
            onStart: function (tween) {
                var focusX = isNil(tween.data.focusX) ? this.camera.focusX : tween.data.focusX;
                var focusY = isNil(tween.data.focusY) ? this.camera.focusY : tween.data.focusY;
                var originX = isNil(tween.data.originX) ? this.camera.focusX : tween.data.originX;
                var originY = isNil(tween.data.originY) ? this.camera.focusY : tween.data.originY;
                var rotation = isNil(tween.data.rotation) ? this.camera.endRotation : tween.data.rotation;
                var zoomX = this.camera.clampZoom(isNil(tween.data.zoomX) ? this.camera.zoomX : tween.data.zoomX);
                var zoomY = this.camera.clampZoom(isNil(tween.data.zoomY) ? this.camera.zoomY : tween.data.zoomY);
                
                var origin = this.camera.checkFocusBounds(originX, originY);
                var focus = this.camera.calculateFocus(focusX, focusY, origin.x, origin.y, this.camera.zoomX / zoomX, this.camera.zoomY / zoomY);
                var position = this.camera.calculatePosition(focus.x, focus.y, this.camera.viewportWidth, this.camera.viewportHeight, zoomX, zoomY);
                
                this.camera.zoomOriginX = focus.x;
                this.camera.zoomOriginY = focus.y;
                
                tween.updateTo({
                    rotation: rotation,
                    x: position.x,
                    y: position.y,
                    zoomX: zoomX,
                    zoomY: zoomY
                });
            },
            onStartParams: ['{self}']
        })));

        return this;
    }
    
    animate (props, duration, options) {
        var centre;
        var focus = {};
        var origin = {};
        var rotation = null;
        var zoom = {};
        
        if (isString(props.origin)) {
            props.origin = document.querySelector(props.origin);
        }
        
        if (isElement(props.origin)) {
            centre = this.camera.getElementCenter(window, this.camera.content.transformEl.getBoundingClientRect(), props.origin.getBoundingClientRect(), this.camera.zoomX, this.camera.zoomY);
            origin.x = centre.x;
            origin.y = centre.y;
        }
        else if (isObject(props.origin)) {
            origin.x = props.origin.x;
            origin.y = props.origin.y;
        }
        
        if (isFinite(props.rotation)) {
            rotation = props.rotation;
        }
        
        // Zoom symmetrically
        if (isFinite(props.zoom)) {
            zoom.x = props.zoom;
            zoom.y = props.zoom;
        }
        // Zoom asymmetrically
        else if (isObject(props.zoom)) {
            zoom.x = props.zoom.x;
            zoom.y = props.zoom.y;
        }
        
        if (isString(props.focus)) {
            props.focus = document.querySelector(props.focus);
        }
        
        // Focus on an element
        if (isElement(props.focus)) {
            centre = this.camera.getElementCenter(window, this.camera.content.transformEl.getBoundingClientRect(), props.focus.getBoundingClientRect(), this.camera.zoomX, this.camera.zoomY);
            focus.x = centre.x;
            focus.y = centre.y;
        }
        // Focus on an x/y coordinate
        else if (isObject(props.focus)) {
            focus.x = props.focus.x;
            focus.y = props.focus.y;
        }
        
        this._tween({
            focusX: focus.x,
            focusY: focus.y,
            originX: origin.x,
            originY: origin.y,
            rotation: rotation,
            zoomX: zoom.x,
            zoomY: zoom.y
        }, duration, options);

        return this;
    }
    
    /**
    * Zooms in/out at the current focus.
    *
    * @param {number|Object} zoom - A zoom value for both axes.
    * @param {number} [zoom.x] - A {@link Camera.zoomX|zoomX} value for the x axis.
    * @param {number} [zoom.y] - A {@link Camera.zoomY|zoomY} value for the y axis.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.zoomTo(2, 1)
    * myAnimation.zoomTo({x: 2}, 1)
    * myAnimation.zoomTo({y: 2}, 1)
    * myAnimation.zoomTo({x:2, y: 0.5}, 1)
    */
    zoomTo (zoom, duration, options) {
        this.animate({ 
            zoom: zoom 
        }, duration, options);

        return this;
    }
}