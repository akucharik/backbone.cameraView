'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

var isElement = _.isElement;
var isFinite = _.isFinite;
var isNil = _.isNil;
var isObject = _.isObject;
var isString = _.isString;
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
class Animation3 extends TimelineMax {
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
            if (this.camera.isDraggable) {
                this.camera.draggable.disable();
            }
            
            if (this.camera.isManualZoomable) {
                this.camera.isManualZoomEnabled = false;
            }
        }, null, this);

        this.eventCallback('onUpdate', function () {
            var x = this.camera.offset.x;
            var y = this.camera.offset.y;

            this.camera.position.copy(this.camera._calculatePosition(this.camera.offset, this.camera.viewportCenter, this.camera.scene.origin, this.camera.sceneTransformation));
            
            if (this.camera.isShaking) {
                if (this.camera.shakeHorizontal) {
                    x += Math.random() * this.camera.shakeIntensity * this.camera.viewportWidth * 2 - this.camera.shakeIntensity * this.camera.viewportWidth;
                }

                if (this.camera.shakeVertical) {
                    y += Math.random() * this.camera.shakeIntensity * this.camera.viewportHeight * 2 - this.camera.shakeIntensity * this.camera.viewportHeight;
                }
            }
            
            // render
            TweenMax.set(this.camera.scene.view, { 
                css: {
                    rotation: -this.camera.rotation,
                    scaleX: this.camera.zoomX,
                    scaleY: this.camera.zoomY,
                    x: -x,
                    y: -y
                }
            });

            this.camera._renderDebug();
        }, null, this);

        this.eventCallback('onComplete', function () { 
            console.log('camera TL complete');
            if (this.camera.isDraggable) {
                var sceneRect = this.camera.scene.view.getBoundingClientRect();
                var bounds = {
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0
                };

                var cameraSceneDiff = {
                    width: sceneRect.width - this.camera.viewportWidth,
                    height: sceneRect.height - this.camera.viewportHeight
                };

//                if (cameraSceneDiff.width > 0 && cameraSceneDiff.height > 0) {
//                    bounds.left = -cameraSceneDiff.width;
//                    bounds.top = -cameraSceneDiff.height;
//                    bounds.width = sceneRect.width + cameraSceneDiff.width;
//                    bounds.height = sceneRect.height + cameraSceneDiff.height;
//                }
//                else {
                    bounds.left = this.camera.viewportCenter.x;
                    bounds.top = this.camera.viewportCenter.y;
                    bounds.width = 0;
                    bounds.height = 0;
//                }
                this.camera.bounds = bounds;
                
                this.camera.draggable.update().applyBounds(this.camera.bounds).enable();
            }
            
            if (this.camera.isManualZoomable) {
                this.camera.isManualZoomEnabled = true;
            }
            
            this.camera._renderDebug();
        }, null, this);
    }
    
    /**
    * Parse the position of the given input within the world.
    *
    * @param {string|Element|Object} [input] - The input to parse.
    * @returns {Object} The position.
    */
    _parsePosition (input) {
        var objectPosition;
        var position = {
            x: null,
            y: null
        };
        
        if (isString(input)) {
            input = document.querySelector(input);
        }
        
        if (isElement(input)) {
            objectPosition = this.camera.scene.getObjectWorldPosition(input);
            position.x = objectPosition.x;
            position.y = objectPosition.y;
        }
        else if (isObject(input)) {
            position.x = input.x;
            position.y = input.y;
        }
        
        return position;
    }
    
    _animate (props, duration, options) {
        options = options || {};
        
        var mainTimeline = new TimelineMax();
        var shakeTimeline = null;
        
        var position = {};
        var origin = {};
        var rotation;
        var shake = {};
        var zoom = {};
        
        // Position
        position = this._parsePosition(props.position);
        
        // Origin
        origin = this._parsePosition(props.origin);
        
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
                position: position,
                origin: origin,
                rotation: rotation,
                zoom: zoom
            }, 
            callbackScope: this,
            immediateRender: false,
            onStart: function (tween) {
                var isMoving = (isFinite(tween.data.position.x) && Math.round(tween.data.position.x) !== Math.round(this.camera.position.x)) || (isFinite(tween.data.position.y) && Math.round(tween.data.position.y) !== Math.round(this.camera.position.y));
                var isRotating = !isNil(tween.data.rotation) && tween.data.rotation !== this.camera.rotation;
                var isZooming = !isNil(tween.data.zoom.x) || !isNil(tween.data.position.x);
                var isAnchored = (!isNil(tween.data.origin.x) || !isNil(tween.data.origin.y)) && !isMoving;
                
                var position = new Vector2(isNil(tween.data.position.x) ? this.camera.position.x : tween.data.position.x, isNil(tween.data.position.y) ? this.camera.position.y : tween.data.position.y);
                var origin = new Vector2(isNil(tween.data.origin.x) ? this.camera.scene.origin.x : tween.data.origin.x, isNil(tween.data.origin.y) ? this.camera.scene.origin.y : tween.data.origin.y);
                var rotation = isNil(tween.data.rotation) ? this.camera.rotation : tween.data.rotation;
                var zoom = {
                    x: this.camera.clampZoom(isNil(tween.data.zoom.x) ? this.camera.zoomX : tween.data.zoom.x),
                    y: this.camera.clampZoom(isNil(tween.data.zoom.y) ? this.camera.zoomY : tween.data.zoom.y)
                };
                
                var transformation = new Matrix2().scale(zoom.x, zoom.y).rotate(Oculo.Math.degToRad(-rotation));
                var originOffset = new Vector2();
                var cameraContextPosition = new Vector2();
                var offset = new Vector2();
                
                // Smooth origin change
                if (!origin.equals(this.camera.scene.origin)) {
                    originOffset = origin.clone().transform(this.camera.sceneTransformation).subtract(this.camera.scene.origin.clone().transform(this.camera.sceneTransformation), origin.clone().subtract(this.camera.scene.origin));
                    
                    if (this.camera.isRotated || this.camera.isZoomed) {
                        this.camera.offset.set(this.camera.offset.x - originOffset.x, this.camera.offset.y - originOffset.y);
                    }
                    
                    this.camera.scene.origin.copy(origin);
                    TweenMax.set(this.camera.scene.view, { 
                        css: {
                            transitionDuration: '0s',
                            transformOrigin: origin.x + 'px ' + origin.y + 'px',
                            x: -this.camera.offset.x,
                            y: -this.camera.offset.y
                        }
                    });    
                }
                
                //origin = this.camera.checkFocusBounds(origin.x, origin.y);
                
                if (isRotating && !isAnchored && !isMoving) {
                    origin = this.camera.position;
                }
                
                if (isAnchored) {
                    position = origin;
                    cameraContextPosition = this.camera._calculateContextPosition(origin, this.camera.position, this.camera.viewportCenter, this.camera.sceneTransformation);
                }
                else {
                    cameraContextPosition = this.camera.viewportCenter;
                }
                
                offset = this.camera._calculateOffset(position, cameraContextPosition, origin, transformation);
                
                // TODO: For dev only
                console.log('props: ', {
                    position: position,
                    origin: origin,
                    rotation: rotation,
                    zoom: zoom
                });
                
                tween.updateTo({
                    rotation: rotation,
                    offsetX: offset.x,
                    offsetY: offset.y,
                    zoomX: zoom.x,
                    zoomY: zoom.y
                });
            },
            onStartParams: ['{self}']
        })), 0);
        
        // Tween shake effect
        if (duration > 0 && shake.intensity > 0) {
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
    * @param {string|Element|Object} position - The location to move to. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [position.x] - The x coordinate on the raw scene.
    * @param {number} [position.y] - The y coordinate on the raw scene.
    * @param {string|Element|Object} origin - The location for the zoom's origin. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [origin.x] - The x coordinate on the raw scene.
    * @param {number} [origin.y] - The y coordinate on the raw scene.
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
    * myAnimation.animate({position: '#box100', zoom: 2}, 1);
    * myAnimation.animate({position: {x: 200, y: 50}, zoom: {x: 2}}, 1);
    * myAnimation.animate({origin: '#box100', zoom: 2}, 1);
    * myAnimation.animate({origin: {x: 200, y: 50}, zoom: {x: 2}}, 1);
    */
    animate (props, duration, options) {
        this._animate({
            position: props.position,
            origin: props.origin,
            rotation: props.rotation,
            shake: props.shake,
            zoom: props.zoom
        }, duration, options);

        return this;
    }
    
    /**
    * Move to a specific position.
    *
    * @param {string|Element|Object} position - The position to move to. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [position.x] - The x coordinate on the raw scene.
    * @param {number} [position.y] - The y coordinate on the raw scene.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.moveTo('#box100', 1);
    * myAnimation.moveTo(document.getElementById('box100'), 1);
    * myAnimation.moveTo({x:200, y: 50}, 1);
    * myAnimation.moveTo({x: 200}, 1);
    * myAnimation.moveTo({y: 200}, 1);
    */
    moveTo (position, duration, options) {
        this._animate({
            position: position
        }, duration, options);

        return this;
    }
    
    /**
    * Rotate at the specified location.
    *
    * @param {string|Element|Object} origin - The location for the rotation's origin. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [origin.x] - The x coordinate on the raw scene.
    * @param {number} [origin.y] - The y coordinate on the raw scene.
    * @param {number|string} rotation - The rotation.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.rotateAt('#box100', 20, 1);
    * myAnimation.rotateAt(document.getElementById('box100'), 20, 1);
    * myAnimation.rotateAt({x: 200, y: 50}, 20, 1);
    */
    rotateAt (origin, rotation, duration, options) {
        this._animate({
            origin: origin,
            rotation: rotation
        }, duration, options);

        return this;
    }
    
    /**
    * Rotate at the current position.
    *
    * @param {number|string} rotation - The rotation.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    */
    rotateTo (rotation, duration, options) {
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
    * @param {number} [origin.x] - The x coordinate on the raw scene.
    * @param {number} [origin.y] - The y coordinate on the raw scene.
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
    * Zoom in/out at the current position.
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