'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import isElement  from 'lodash/isElement';
import isFinite   from 'lodash/isFinite';
import isFunction from 'lodash/isFunction';
import isNil      from 'lodash/isNil';
import isObject   from 'lodash/isObject';
import isString   from 'lodash/isString';
import _Math      from './math/math';
import Matrix2    from './math/matrix2';
import Utils      from './utils';
import Vector2    from './math/vector2';

/**
* @class Oculo.Animation
* @constructor
* @memberof Oculo
* @extends external:TimelineMax
* @param {Camera} camera - The camera to be animated.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @param {Object} [options.destroyOnComplete] - Whether the animation should be destroyed once it has completed.
*
* @example
* var myAnimation = new Oculo.Animation(myCamera, { 
*   destroyOnComplete: true
* }).zoomTo(2, 1).shake(0.1, 2).play();
*/
class Animation extends TimelineMax {
    constructor (camera, options) {
        options = Object.assign({
            paused: true
        }, options);
        
        super(Object.assign({}, options));

        /**
        * @property {object} - The initial configuration.
        * @default {};
        */
        this.config = options;
        
        /**
        * @property {Camera} - The camera on which the animation will be applied.
        */
        this.camera = camera || null;
        
        /**
        * @property {TimelineLite} - The current active sub-animation consisting of the core camera animation and effect animations.
        */
        this.currentSubAnimation = null;
        
        /**
        * @property {boolean} - Whether the animation should be destroyed once it has completed.
        */
        this.destroyOnComplete = options.destroyOnComplete ? true : false;
        
        /**
        * @property {object} - The camera values of the previous sub-animation.
        */
        this.previousProps = {};
        
        /**
        * Called when the animation has started.
        *
        * @private
        */
        this._onStart = function () {
            if (this.duration() > 0) {
                if (this.camera.isDraggable) {
                    this.camera.trackControl.disableDrag();
                }

                if (this.camera.isManualZoomable) {
                    this.camera.trackControl.disableWheel();
                }
            }

            if (this.config.onStart !== undefined) {
                this.config.onStart.apply(this, this.config.onStartParams);
            }
            // TODO: Remove once dev is complete
            console.log('animation started');
        }
        
        /**
        * Called when the animation has updated.
        *
        * @private
        */
        this._onUpdate = function () {
            // Clamping here ensures bounds have been updated (if zoom has changed) and bounds are enforced during rotateAt
            // Position is manually maintained so animations can smoothly continue when camera is resized
            this.camera.position = this.camera._clampPosition(this.camera._calculatePositionFromOffset(this.camera.rawOffset, this.camera.center, this.camera.scene.origin, this.camera.transformation));
            
            if (this.camera.isShaking) {
                this.camera.position.add(this.camera.shakeOffset);
                
                if (this.camera.shakeRespectBounds) {
                    this.camera._clampPosition(this.camera.position);
                }
            }
            
            this.camera.offset = this.camera._calculateOffsetFromPosition(this.camera.position, this.camera.center, this.camera.scene.origin, this.camera.transformation);

            if (this.config.onUpdate !== undefined) {
                this.config.onUpdate.apply(this, this.config.onUpdateParams);
            }
            
            this.camera.renderer.render();
        }
        
        /**
        * Called when the animation has completed.
        *
        * @private
        */
        this._onComplete = function () {
            if (this.duration() > 0) {
                if (this.camera.isDraggable) {
                    this.camera.trackControl.enableDrag();
                }

                if (this.camera.isManualZoomable) {
                    this.camera.trackControl.enableWheel();
                }
            }

            if (this.config.onComplete !== undefined) {
                this.config.onComplete.apply(this, this.config.onCompleteParams);
            }

            if (this.destroyOnComplete) {
                this.destroy();
            }
            // TODO: Remove once dev is complete
            console.log('animation completed');
        },
        
        this.eventCallback('onStart', this._onStart);
        this.eventCallback('onUpdate', this._onUpdate);
        this.eventCallback('onComplete', this._onComplete);
    }
    
    /**
    * Animate the camera.
    *
    * @private
    * @param {Object} props - The properties to animate.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    */
    _animate (props, duration, options) {
        options = options || {};
        
        var mainTimeline = new TimelineLite({
            callbackScope: this,
            onStartParams: ['{self}'],
            onStart: function (self) {
                this.currentSubAnimation = self;
            }
        });
        var shakeTimeline = null;
        var shake = this._parseShake(props.shake);
        
        // Tween core camera properties
        if (props.origin || props.position || props.rotation || props.zoom) {
            mainTimeline.add(TweenMax.to(this.camera, duration, Object.assign({}, options, {
                data: {
                    sourceOrigin: props.origin,
                    sourcePosition: props.position,
                    sourceRotation: props.rotation,
                    sourceZoom: props.zoom
                }, 
                immediateRender: false,
                callbackScope: this,
                onStartParams: ['{self}'],
                onStart: function (self) {
                    var parsedProps = this._parseProps(self.data.sourceOrigin, self.data.sourcePosition, self.data.sourceRotation, self.data.sourceZoom, this.camera);
                    var endProps = this._calculateEndProps(parsedProps.parsedOrigin, parsedProps.parsedPosition, parsedProps.parsedRotation, parsedProps.parsedZoom, this.camera);
                    Object.assign(self.data, parsedProps, endProps);

                    this.previousProps.position = this.camera.position;
                    this.previousProps.rotation = this.camera.rotation;
                    this.previousProps.zoom = this.camera.zoom;

                    // Smooth origin change
                    this._updateOrigin(endProps.endOrigin, this.camera);

                    // TODO: For dev only
                    console.log('tween data: ', self.data);

                    self.updateTo({
                        rawOffsetX: endProps.endOffsetX,
                        rawOffsetY: endProps.endOffsetY,
                        rotation: endProps.endRotation,
                        zoom: endProps.endZoom
                    });

                    self.timeline.core = self;
                }
            })), 0);
        }
        
        // Tween shake effect
        if (duration > 0 && shake && shake.intensity > 0) {
            shakeTimeline = new TimelineLite(Object.assign({}, options, {
                data: {
                    intensity: 0,
                    direction: shake.direction,
                    respectBounds: shake.respectBounds
                },
                callbackScope: this,
                onStartParams: ['{self}'],
                onStart: function (self) {
                    self.timeline.shake = self;
                    this.camera.isShaking = true;
                    this.camera.shakeRespectBounds = (this.data.respectBounds === false) ? false : true;
                },
                onUpdateParams: ['{self}'],
                onUpdate: function (self) {
                    if (self.data.direction === Animation.shake.direction.HORIZONTAL || self.data.direction === Animation.shake.direction.BOTH) {
                        this.camera.shakeOffset.x = Math.random() * self.data.intensity * this.camera.width * 2 - self.data.intensity * this.camera.width;
                    }

                    if (self.data.direction === Animation.shake.direction.VERTICAL || self.data.direction === Animation.shake.direction.BOTH) {
                        this.camera.shakeOffset.y = Math.random() * self.data.intensity * this.camera.height * 2 - self.data.intensity * this.camera.height;
                    }
                },
                onCompleteParams: ['{self}'],
                onComplete: function (self) {
                    this.camera.shakeOffset.x = 0;
                    this.camera.shakeOffset.y = 0;
                    this.camera.isShaking = false;
                    this.camera.shakeRespectBounds = true;
                }
            }));
            
            // Ease in/out
            if (shake.easeIn && shake.easeOut) {
                shakeTimeline.fromTo(shakeTimeline.data, duration * 0.5, {
                    intensity: 0
                }, {
                    intensity: shake.intensity,
                    ease: shake.easeIn || Power0.easeNone
                }, 0);

                shakeTimeline.to(shakeTimeline.data, duration * 0.5, { 
                    intensity: 0,
                    ease: shake.easeOut || Power0.easeNone
                }, duration * 0.5);
            }
            // Ease in or ease
            else if (shake.easeIn && !shake.easeOut) {
                shakeTimeline.fromTo(shakeTimeline.data, duration, {
                    intensity: 0
                }, {
                    intensity: shake.intensity,
                    ease: shake.easeIn || Power0.easeNone
                }, 0);
            }
            // Ease out
            else if (!shake.easeIn && shake.easeOut) {
                shakeTimeline.fromTo(shakeTimeline.data, duration, {
                    intensity: shake.intensity
                }, {
                    intensity: 0,
                    ease: shake.easeOut || Power0.easeNone
                }, 0);
            }
            // Ease
            else if (options.ease) {
                shakeTimeline.fromTo(shakeTimeline.data, duration, {
                    intensity: 0
                }, {
                    intensity: shake.intensity,
                    ease: options.ease || Power0.easeNone
                }, 0);
            }
            // No ease
            else {
                shakeTimeline.data.intensity = shake.intensity;
                shakeTimeline.to(shakeTimeline.data, duration, {}, 0);
            }
            
            mainTimeline.add(shakeTimeline, 0);
        }
        
        this.add(mainTimeline);
        
        return this;
    }
    
    /**
    * Calculates the end property values.
    *
    * @private
    * @param {Object|Vector2} sourceOrigin - The source origin.
    * @param {Object|Vector2} sourcePosition - The source position.
    * @param {number} sourceRotation - The source rotation.
    * @param {number} sourceZoom - The source zoom.
    * @param {Oculo.Camera} camera - The camera.
    * @returns {Object} - The end properties.
    */
    _calculateEndProps (sourceOrigin, sourcePosition, sourceRotation, sourceZoom, camera) {
        sourceOrigin = sourceOrigin || {};
        sourcePosition = sourcePosition || {};
        
        var endPosition, endOffset;
        var position = new Vector2(isFinite(sourcePosition.x) ? sourcePosition.x : camera.position.x, isFinite(sourcePosition.y) ? sourcePosition.y : camera.position.y);
        var origin = new Vector2(isFinite(sourceOrigin.x) ? sourceOrigin.x : camera.scene.originX, isFinite(sourceOrigin.y) ? sourceOrigin.y : camera.scene.originY);
        var rotation = isFinite(sourceRotation) ? sourceRotation : camera.rotation;
        var zoom = camera._clampZoom(isFinite(sourceZoom) ? sourceZoom : camera.zoom);
        var transformation = new Matrix2().scale(zoom, zoom).rotate(_Math.degToRad(-rotation));
        var cameraFOVPosition = camera.center;

        var isMoving = isFinite(sourcePosition.x) || isFinite(sourcePosition.y);
        var isRotating = isFinite(sourceRotation) && sourceRotation !== camera.rotation;
        var isZooming = isFinite(sourceZoom) && sourceZoom !== camera.zoom;

        // rotateTo, zoomTo
        if (!isMoving && !isFinite(sourceOrigin.x) && !isFinite(sourceOrigin.y)) {
            origin.copy(camera.position);
        }
        
        // rotateAt, rotateTo, zoomAt, zoomTo
        if (!isMoving) {
            position.copy(origin);
            cameraFOVPosition = camera._calculateContextPosition(origin, camera.position, camera.center, camera.transformation);
        }

        endPosition = camera._calculatePositionFromPosition(position, cameraFOVPosition, camera.center, origin, transformation);
        endOffset = camera._calculateOffsetFromPosition(endPosition, camera.center, origin, transformation);
        
        return {
            isMoving: isMoving,
            isRotating: isRotating,
            isZooming: isZooming,
            endOffsetX: isMoving ? endOffset.x : null,
            endOffsetY: isMoving ? endOffset.y : null,
            endOrigin: (sourceOrigin.x || sourceOrigin.y || !isMoving) ? origin : null,
            endRotation: !isNil(sourceRotation) ? rotation : null,
            endZoom: sourceZoom ? zoom : null
        };
    }
    
    /**
    * Parses the core animation properties.
    *
    * @private
    * @param {Object} sourceOrigin - The origin.
    * @param {Object} sourcePosition - The origin.
    * @param {number} sourceRotation - The rotation.
    * @param {number} sourceZoom - The zoom.
    * @param {Oculo.Camera} camera - The camera.
    * @returns {Object} - The parsed properties.
    */
    _parseProps (sourceOrigin, sourcePosition, sourceRotation, sourceZoom, camera) {
        if (sourcePosition === 'previous' && this.previousProps.position) {
            sourcePosition = this.previousProps.position;
        }
        
        if (sourceRotation === 'previous' && !isNil(this.previousProps.rotation)) {
            sourceRotation = this.previousProps.rotation;
        }
        
        if (sourceZoom === 'previous' && !isNil(this.previousProps.zoom)) {
            sourceZoom = this.previousProps.zoom;
        }
        
        return { 
            parsedOrigin: Utils.parsePosition(sourceOrigin, camera.scene.view),
            parsedPosition: Utils.parsePosition(sourcePosition, camera.scene.view),
            parsedRotation: !isNil(sourceRotation) ? sourceRotation : null,
            parsedZoom: sourceZoom || null
        };
    }
    
    /**
    * Parses the shake properties.
    *
    * @private
    * @param {Object} shake - The shake properties.
    * @returns {Object} - The parsed properties.
    */
    _parseShake (shake) {
        var parsedShake = null;
        
        if (shake) {
            parsedShake = {
                intensity: isNil(shake.intensity) ? 0 : shake.intensity,
                direction: isNil(shake.direction) ? Animation.shake.direction.BOTH : shake.direction,
                easeIn: shake.easeIn,
                easeOut: shake.easeOut,
                respectBounds: shake.respectBounds
            };
        }
        
        return parsedShake;
    }
    
    /**
    * Updates the origin.
    *
    * @private
    * @param {Vector2} origin - The origin.
    * @param {Oculo.Camera} camera - The camera.
    * @returns {this} self
    */
    _updateOrigin (origin, camera) {
        var sceneOrigin = camera.scene.origin;
        
        if (origin && !origin.equals(sceneOrigin)) {
            var transformation = camera.transformation;
            var originOffset = origin.clone().transform(transformation).subtract(sceneOrigin.clone().transform(transformation)).subtract(origin.clone().subtract(sceneOrigin));

            if (camera.isRotated || camera.isZoomed) {
                camera.rawOffset.x -= originOffset.x;
                camera.rawOffset.y -= originOffset.y;
            }

            camera.scene.originX = origin.x;
            camera.scene.originY = origin.y;

            if (camera.scene.view) {    
                TweenMax.set(camera.scene.view, { 
                    css: {
                        transformOrigin: camera.scene.originX + 'px ' + camera.scene.originY + 'px',
                        x: -camera.rawOffset.x,
                        y: -camera.rawOffset.y
                    },
                });
            }
        }
        
        return this;
    }
    
    /**
    * Stops the animation and releases it for garbage collection.
    *
    * @returns {this} self
    *
    * @example
    * myAnimation.destroy();
    */
    destroy () {
        super.kill();
        this.camera = null;
        this.currentSubAnimation = null;
        this.previousProps = null;
    }
    
    /**
    * Animate the camera.
    *
    * @param {Object} props - The properties to animate.
    * @param {string|Element|Object} [props.position] - The location to move to. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [props.position.x] - The x coordinate on the raw scene.
    * @param {number} [props.position.y] - The y coordinate on the raw scene.
    * @param {string|Element|Object} [props.origin] - The location for the zoom's origin. It can be a selector, an element, or an object with x/y coordinates.
    * @param {number} [props.origin.x] - The x coordinate on the raw scene.
    * @param {number} [props.origin.y] - The y coordinate on the raw scene.
    * @param {number|string} [props.rotation] - The rotation.
    * @param {Object} [props.shake] - An object of shake effect properties.
    * @param {number} [props.shake.intensity] - A {@link Camera#shakeIntensity|shake intensity}.
    * @param {Oculo.Animation.shake.direction} [props.shake.direction=Oculo.Animation.shake.direction.BOTH] - A shake direction. 
    * @param {Object} [props.shake.easeIn] - An {@link external:Easing|Easing}.
    * @param {Object} [props.shake.easeOut] - An {@link external:Easing|Easing}.
    * @param {number} [props.zoom] - A zoom value.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.animate({position: '#box100', zoom: 2}, 1);
    * myAnimation.animate({position: {x: 200, y: 50}, zoom: 2}, 1);
    * myAnimation.animate({origin: '#box100', zoom: 2}, 1);
    * myAnimation.animate({origin: {x: 200, y: 50}, zoom: 2}, 1);
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
    *
    * @example
    * myAnimation.rotateTo(20, 1);
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
    * @param {Oculo.Animation.shake.direction} [direction=Oculo.Animation.shake.direction.BOTH] - A shake direction. 
    * @param {Object} [options] - An object of {@link external:TimelineMax|TimelineMax} options plus:
    * @param {Object} [options.easeIn] - An {@link external:Easing|Easing}.
    * @param {Object} [options.easeOut] - An {@link external:Easing|Easing}.
    * @returns {this} self
    *
    * @example
    * myAnimation.shake(0.1, 4);
    * myAnimation.shake(0.1, 4, Oculo.Animation.shake.direction.HORIZONTAL, { easeIn: Power2.easeIn, easeOut: Power2.easeOut })
    */
    shake (intensity, duration, direction, options) {
        options = options || {};
        
        this.animate({
            shake: {
                intensity: intensity,
                direction: direction,
                easeIn: options.easeIn,
                easeOut: options.easeOut,
                respectBounds: options.respectBounds
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
    * @param {number} zoom - A zoom value.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.zoomAt('#box100', 2, 1);
    * myAnimation.zoomAt(document.getElementById('box100'), 2, 1);
    * myAnimation.zoomAt({x: 200, y: 50}, 2, 1);
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
    * @param {number} zoom - A zoom value.
    * @param {number} duration - A duration.
    * @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
    * @returns {this} self
    *
    * @example
    * myAnimation.zoomTo(2, 1);
    */
    zoomTo (zoom, duration, options) {
        this._animate({ 
            zoom: zoom 
        }, duration, options);

        return this;
    }
}

/**
* Shake directions.
* @enum {number}
*/
Animation.shake = {
    direction: {
        /**
        * Both the x and y axes.
        */
        BOTH: 0,
        /**
        * The x axis.
        */
        HORIZONTAL: 1,
        /**
        * The y axis.
        */
        VERTICAL: 2
    }
}

export default Animation;