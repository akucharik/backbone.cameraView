'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

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

            if (this.camera.isShaking) {
                if (this.camera.shakeHorizontal) {
                    x += Math.random() * this.camera.shakeIntensity * this.camera.width * 2 - this.camera.shakeIntensity * this.camera.width;
                }

                if (this.camera.shakeVertical) {
                    y += Math.random() * this.camera.shakeIntensity * this.camera.height * 2 - this.camera.shakeIntensity * this.camera.height;
                }
            }
            
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
            this.camera.isAnimating = false;
            this.camera.draggable.enable();
            this.camera._renderDebug();
        }, null, this);
    }
    
    _animate (props, duration, options) {
        options = options || {};
        
        var mainTimeline = new TimelineMax();
        var shakeTimeline = null;
        
        var centre;
        var focus = {};
        var origin = {};
        var rotation;
        var shake = {};
        var zoom = {};
        
        // Focus
        if (isString(props.focus)) {
            props.focus = document.querySelector(props.focus);
        }
        
        if (isElement(props.focus)) {
            centre = this.camera.getElementCentre(this.camera.content.transformEl, props.focus, this.camera.zoomX, this.camera.zoomY);
            focus.x = centre.x;
            focus.y = centre.y;
        }
        else if (isObject(props.focus)) {
            focus.x = props.focus.x;
            focus.y = props.focus.y;
        }
        
        // Origin
        if (isString(props.origin)) {
            props.origin = document.querySelector(props.origin);
        }
        
        if (isElement(props.origin)) {
            centre = this.camera.getElementCentre(this.camera.content.transformEl, props.origin, this.camera.zoomX, this.camera.zoomY);
            origin.x = centre.x;
            origin.y = centre.y;
        }
        else if (isObject(props.origin)) {
            origin.x = props.origin.x;
            origin.y = props.origin.y;
        }
        
        // Rotation
        if (isFinite(props.rotation)) {
            rotation = props.rotation;
        }
        
        // Shake
        if (props.shake) {
            shake.intensity = isNil(props.shake.intensity) ? 0 : props.shake.intensity;
            shake.direction = isNil(props.shake.direction) ? Camera.shakeDirection.BOTH : props.shake.direction;
            shake.easeIn = props.shake.easeIn;
            shake.easeOut = props.shake.easeOut;    
        }
        
        // Zoom
        if (isFinite(props.zoom)) {
            zoom.x = props.zoom;
            zoom.y = props.zoom;
        }
        else if (isObject(props.zoom)) {
            zoom.x = props.zoom.x;
            zoom.y = props.zoom.y;
        }
        
        // Tween core camera functions
        mainTimeline.add(TweenMax.to(this.camera, duration, Object.assign({}, options, {
            data: {
                focus: focus,
                origin: origin,
                rotation: rotation,
                zoom: zoom
            },
            callbackScope: this,
            onStart: function (tween) {
                var zoomFocus, position;
                var focus = {
                    x: isNil(tween.data.focus.x) ? this.camera.focusX : tween.data.focus.x,
                    y: isNil(tween.data.focus.y) ? this.camera.focusY : tween.data.focus.y
                };
                var origin = {
                    x: isNil(tween.data.origin.x) ? this.camera.focusX : tween.data.origin.x,
                    y: isNil(tween.data.origin.y) ? this.camera.focusY : tween.data.origin.y
                };
                var rotation = isNil(tween.data.rotation) ? this.camera.rotation : tween.data.rotation;
                var zoom = {
                    x: this.camera.clampZoom(isNil(tween.data.zoom.x) ? this.camera.zoomX : tween.data.zoom.x),
                    y: this.camera.clampZoom(isNil(tween.data.zoom.y) ? this.camera.zoomY : tween.data.zoom.y)
                };
                
                origin = this.camera.checkFocusBounds(origin.x, origin.y);
                
                if (isNil(tween.data.focus.x) && isNil(tween.data.focus.y) && isFinite(tween.data.origin.x) && isFinite(tween.data.origin.y)) {
                    zoomFocus = this.camera.calculateFocus(this.camera.focusX, this.camera.focusY, origin.x, origin.y, this.camera.zoomX / zoom.x, this.camera.zoomY / zoom.y);
                    focus.x = zoomFocus.x;
                    focus.y = zoomFocus.y;
                }
                
                position = this.camera.calculatePosition(focus.x, focus.y, this.camera.viewportWidth, this.camera.viewportHeight, zoom.x, zoom.y, rotation);
                
                //this.camera.rotationOriginX = origin.x;
                //this.camera.rotationOriginY = origin.y;
                this.camera.zoomOriginX = focus.x;
                this.camera.zoomOriginY = focus.y;
                
                tween.updateTo({
                    rotation: rotation,
                    x: position.x,
                    y: position.y,
                    zoomX: zoom.x,
                    zoomY: zoom.y
                });
            },
            onStartParams: ['{self}']
        })), 0);
        
        // Tween shake effect
        if (shake.intensity > 0) {
            this.camera.shakeHorizontal = shake.direction === Camera.shakeDirection.VERTICAL ? false : true;
            this.camera.shakeVertical = shake.direction === Camera.shakeDirection.HORIZONTAL ? false : true;
            
            shakeTimeline = new TimelineMax(Object.assign({}, options, {
                callbackScope: this,
                onStart: function (timeline) {
                    this.camera.isShaking = true;
                },
                onStartParams: ['{self}'],
                onComplete: function (timeline) {
                    TweenMax.set(this.camera, { 
                        shakeIntensity: 0
                    });
                    this.camera.isShaking = false;
                },
                onCompleteParams: ['{self}']
            }));
            
            if (shake.easeIn && shake.easeOut) {
                shakeTimeline.fromTo(this.camera, duration * 0.5, {
                    shakeIntensity: 0
                }, {
                    ease: shake.easeIn || Power0.easeNone,
                    shakeIntensity: shake.intensity
                }, 0);

                shakeTimeline.to(this.camera, duration * 0.5, {
                    ease: shake.easeOut || Power0.easeNone,
                    shakeIntensity: 0
                }, duration * 0.5);
            }
            else if (shake.easeIn && !shake.easeOut) {
                shakeTimeline.fromTo(this.camera, duration, {
                    shakeIntensity: 0
                }, {
                    ease: shake.easeIn || Power0.easeNone,
                    shakeIntensity: shake.intensity
                }, 0);
            }
            else if (!shake.easeIn && shake.easeOut) {
                shakeTimeline.fromTo(this.camera, duration, {
                    shakeIntensity: shake.intensity
                }, {
                    ease: shake.easeOut || Power0.easeNone,
                    shakeIntensity: 0
                }, 0);
            }
            else if (options.ease) {
                shakeTimeline.fromTo(this.camera, duration, {
                    shakeIntensity: 0
                }, {
                    ease: options.ease,
                    shakeIntensity: shake.intensity
                }, 0);
            }
            else {
                this.camera.shakeIntensity = shake.intensity;
                shakeTimeline.to(this.camera, duration, {}, 0);
            }
            
            mainTimeline.add(shakeTimeline, 0);
        }
        
        this.add(mainTimeline);
        
        return this;
    }
    
    /**
    * Animate the camera.
    *
    * @param {string|Element|Object} focus - The location to focus on. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [focus.x] - The x coordinate on the raw content.
    * @param {number} [focus.y] - The y coordinate on the raw content.
    * @param {string|Element|Object} origin - The location for the zoom's origin. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [origin.x] - The x coordinate on the raw content.
    * @param {number} [origin.y] - The y coordinate on the raw content.
    * @param {Object} [shake] - An object of shake effect properties.
    * @param {number} [shake.intensity] - A {@link Camera#shakeIntensity|shake intensity}.
    * @param {Camera.shakeDirection} [shake.direction=Camera.shakeDirection.BOTH] - A shake direction. 
    * @param {Object} [shake.easeIn] - An {@link external:Easing|Easing}.
    * @param {Object} [shake.easeOut] - An {@link external:Easing|Easing}.
    * @param {number|Object} zoom - A zoom value for the axes. It can be a number or an object with x/y zoom values.
    * @param {number} [zoom.x] - A {@link Camera.zoomX|zoomX} value for the x axis.
    * @param {number} [zoom.y] - A {@link Camera.zoomY|zoomY} value for the y axis.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.animate({focus: '#box100', zoom: 2}, 1);
    * myAnimation.animate({focus: {x: 200, y: 50}, zoom: {x: 2}}, 1);
    * myAnimation.animate({origin: '#box100', zoom: 2}, 1);
    * myAnimation.animate({origin: {x: 200, y: 50}, zoom: {x: 2}}, 1);
    */
    animate (props, duration, options) {
        this._animate({
            focus: props.focus,
            origin: props.origin,
            rotation: props.rotation,
            shake: props.shake,
            zoom: props.zoom
        }, duration, options);

        return this;
    }
    
    /**
    * Focus on a specific location.
    *
    * @param {string|Element|Object} target - The location to focus on. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [target.x] - The x coordinate on the raw content.
    * @param {number} [target.y] - The y coordinate on the raw content.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.focusOn('#box100', 1);
    * myAnimation.focusOn(document.getElementById('box100'), 1);
    * myAnimation.focusOn({x:200, y: 50}, 1);
    * myAnimation.focusOn({x: 200}, 1);
    * myAnimation.focusOn({y: 200}, 1);
    */
    focusOn (target, duration, options) {
        this._animate({
            focus: target
        }, duration, options);

        return this;
    }
    
    /**
    * Rotates at the current focus.
    *
    * @param {number|string} rotation - The rotation.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    */
    rotate (rotation, duration, options) {
        this._animate({
            rotation: rotation
        }, duration, options);

        return this;
    }
    
    /**
    * Shake the camera.
    *
    * @param {number} intensity - A {@link Camera#shakeIntensity|shake intensity}.
    * @param {number} duration - A duration.
    * @param {Camera.shakeDirection} [direction=Camera.shakeDirection.BOTH] - A shake direction. 
    * @param {Object} [options] - An object of {@link external:TimelineMax|TimelineMax} options plus:
    * @param {Object} [options.easeIn] - An {@link external:Easing|Easing}.
    * @param {Object} [options.easeOut] - An {@link external:Easing|Easing}.
    * @returns {this} self
    *
    * @example
    * myAnimation.shake(0.1, 4);
    * myAnimation.shake(0.1, 4, camera.shakeDirection.HORIZONTAL, { easeIn: Power2.easeIn, easeOut: Power2.easeOut })
    */
    shake (intensity, duration, direction, options) {
        options = options || {};
        
        this.animate({
            shake: {
                intensity: intensity,
                direction: direction,
                easeIn: options.easeIn,
                easeOut: options.easeOut
            }
        }, duration, options);

        return this;
    }
    
    /**
    * Zoom in/out at a specific location.
    *
    * @param {string|Element|Object} origin - The location for the zoom's origin. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [origin.x] - The x coordinate on the raw content.
    * @param {number} [origin.y] - The y coordinate on the raw content.
    * @param {number|Object} zoom - A zoom value for the axes. The zoom can be a number or an object with x/y zoom values.
    * @param {number} [zoom.x] - A {@link Camera.zoomX|zoomX} value for the x axis.
    * @param {number} [zoom.y] - A {@link Camera.zoomY|zoomY} value for the y axis.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.zoomAt('#box100', 2, 1);
    * myAnimation.zoomAt(document.getElementById('box100'), 2, 1);
    * myAnimation.zoomAt({x: 200, y: 50}, 2, 1);
    * myAnimation.zoomAt({x: 200, y: 50}, {x: 2, y: 1}, 1);
    */
    zoomAt (origin, zoom, duration, options) {
        this._animate({
            origin: origin,
            zoom: zoom
        }, duration, options);
        
        return this;
    }
    
    /**
    * Zoom in/out at the current focus.
    *
    * @param {number|Object} zoom - A zoom value for the axes. It can be a number or an object with x/y zoom values.
    * @param {number} [zoom.x] - A {@link Camera.zoomX|zoomX} value for the x axis.
    * @param {number} [zoom.y] - A {@link Camera.zoomY|zoomY} value for the y axis.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.zoomTo(2, 1);
    * myAnimation.zoomTo({x:2, y: 0.5}, 1);
    * myAnimation.zoomTo({x: 2}, 1);
    * myAnimation.zoomTo({y: 2}, 1);
    */
    zoomTo (zoom, duration, options) {
        this._animate({ 
            zoom: zoom 
        }, duration, options);

        return this;
    }
}