'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import isElement            from 'lodash/isElement';
import isFinite             from 'lodash/isFinite';
import isFunction           from 'lodash/isFunction';
import isNil                from 'lodash/isNil';
import isObject             from 'lodash/isObject';
import { zoomDirection }    from './constants';
import _Math                from './math/math';
import Matrix2              from './math/matrix2';
import { Type }             from './constants';
import Utils                from './utils';
import Vector2              from './math/vector2';

const animation = {
    type: {
        CORE: 1
    }
};

/**
* Description.
* 
* @class Oculo.Animation
* @constructor
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
        * @property {number} - The type of this object.
        * @readonly
        */
        this.type = Type.ANIMATION;
        
        /**
        * @property {Camera} - The camera on which the animation will be applied.
        */
        this.camera = camera || null;
        
        /**
        * @property {array} - The core tweens of this animation in order of execution.
        */
        this.coreTweens = [];
        
        /**
        * @property {TimelineLite} - The current active sub-animation consisting of the core camera animation and effect animations.
        */
        this.currentKeyframe = null;
        
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
            this._initCoreTween(this.coreTweens[0]);
            
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
            if (this.config.onUpdate !== undefined) {
                this.config.onUpdate.apply(this, this.config.onUpdateParams);
            }
            
            this.camera.render();
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
                this.currentKeyframe = self;
            }
        });
        var shakeTimeline = null;
        var shake = this._parseShake(props.shake);
        
        // Tween core camera properties
        if (props.origin || props.position || props.rotation || props.zoom) {
            var coreTween = TweenMax.to(this.camera, duration, Object.assign({}, options, {
                rawOffsetX: 0,
                rawOffsetY: 0,
                rotation: 0,
                zoom: 0,
                immediateRender: false,
                callbackScope: this,
                onStartParams: ['{self}'],
                onStart: function (self) {
                    var zDirection = zoomDirection.NONE;
                    self.timeline.core = self;
                    this.camera.setTransformOrigin(self.props.to.origin);
                    
                    if (self.props.to.zoom > this.camera.zoom) {
                        zDirection = zoomDirection.IN;
                    }
                    else if (self.props.to.zoom < this.camera.zoom) {
                        zDirection = zoomDirection.OUT;
                    }
                    
                    this.camera.zoomDirection = zDirection;
                                        
                    // TODO: For dev only
                    console.log('core tween started');
                    console.log('tween vars: ', self.vars);
                    console.log('tween props: ', self.props);
                },
                onUpdateParams: ['{self}'],
                onUpdate: function (self) {
                    // Position is manually maintained so animations can smoothly continue when camera is resized
                    this.camera.setRawPosition(this.camera._convertOffsetToPosition(this.camera.rawOffset, this.camera.center, this.camera.transformOrigin, this.camera.transformation));
                },
                onCompleteParams: ['{self}'],
                onComplete: function (self) {
                    this._initCoreTween(this.coreTweens[self.index + 1], self.props.end);
                    // TODO: For dev only
                    console.log('core tween completed');
                }
            }));
            
            coreTween.type = animation.type.CORE;
            coreTween.props = {
                source: {},
                parsed: {},
                to: {},
                start: {},
                end: {}
            };
            coreTween.props.source.origin = props.origin;
            coreTween.props.source.position = props.position;
            coreTween.props.source.rotation = props.rotation;
            coreTween.props.source.zoom = props.zoom;
            coreTween.index = this.coreTweens.length;
            this.coreTweens.push(coreTween);
            mainTimeline.add(coreTween, 0);
        }
        
        // Tween shake effect
        if (duration > 0 && shake && shake.intensity > 0) {
            shakeTimeline = new TimelineLite(Object.assign({}, options, {
                data: {
                    intensity: 0,
                    direction: shake.direction,
                    enforceBounds: (shake.enforceBounds === false) ? false : true
                },
                callbackScope: this,
                onStartParams: ['{self}'],
                onStart: function (self) {
                    self.timeline.shake = self;
                },
                onUpdateParams: ['{self}'],
                onUpdate: function (self) {
                    var isFinalFrame = self.time() === self.duration();
                    var offsetX = 0;
                    var offsetY = 0;
                    var position = this.camera.rawPosition.clone();
                    
                    if (self.data.direction === Animation.shake.direction.HORIZONTAL || self.data.direction === Animation.shake.direction.BOTH) {
                        if (!isFinalFrame) {
                            offsetX = Math.random() * self.data.intensity * this.camera.width * 2 - self.data.intensity * this.camera.width;
                            position.x += offsetX;
                        }
                    }

                    if (self.data.direction === Animation.shake.direction.VERTICAL || self.data.direction === Animation.shake.direction.BOTH) {
                        if (!isFinalFrame) {
                            offsetY = Math.random() * self.data.intensity * this.camera.height * 2 - self.data.intensity * this.camera.height;
                            position.y += offsetY;
                        }
                    }
                    
                    this.camera.setPosition(position, self.data.enforceBounds);
                },
                onCompleteParams: ['{self}']
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
    * Calculates the "to" property values.
    *
    * @private
    * @param {Object|Vector2} sourceOrigin - The source origin.
    * @param {Object|Vector2} sourcePosition - The source position.
    * @param {number} sourceRotation - The source rotation.
    * @param {number} sourceZoom - The source zoom.
    * @param {Oculo.Camera} camera - The camera.
    * @returns {Object} - The end properties.
    */
    _calculateToProps (parsed, start) {
        var source = {
            origin: (parsed.origin !== null) ? parsed.origin : {},
            position: (parsed.position !== null) ? parsed.position : {},
            rotation: parsed.rotation,
            zoom: parsed.zoom
        }
        
        var isAnchored = false;
        // Changing to same origin is necessary for wheel zoom
        var isOriginXChanging = Number.isFinite(source.origin.x);
        var isOriginYChanging = Number.isFinite(source.origin.y);
        var isOriginChanging = isOriginXChanging || isOriginYChanging;
        // Changing to same position is necessary for camera resize
        var isPositionXChanging = Number.isFinite(source.position.x);
        var isPositionYChanging = Number.isFinite(source.position.y);
        var isPositionChanging = isPositionXChanging || isPositionYChanging;
        var isOffsetChanging = isPositionChanging;
        var isRotationChanging = Number.isFinite(source.rotation) && source.rotation !== start.rotation;
        var isZoomChanging = Number.isFinite(source.zoom) && source.zoom !== start.zoom;

        var startTransformation = new Matrix2().scale(start.zoom, start.zoom).rotate(_Math.degToRad(-start.rotation));
        var fovPosition = this.camera.center;
        var toOffset;
        var toOrigin = new Vector2(isOriginXChanging ? source.origin.x : start.origin.x, isOriginYChanging ? source.origin.y : start.origin.y);
        var toPosition = new Vector2(isPositionXChanging ? source.position.x : start.position.x, isPositionYChanging ? source.position.y : start.position.y);
        var toRotation = isRotationChanging ? source.rotation : start.rotation;
        var toZoom = isZoomChanging ? source.zoom : start.zoom;
        var toTransformation = new Matrix2().scale(toZoom, toZoom).rotate(_Math.degToRad(-toRotation));
        
        // rotateTo, zoomTo
        if (!isOriginChanging && !isPositionChanging) {
            isAnchored = true;
            toOrigin.copy(start.position);
        }
        // rotateAt, zoomAt
        else if (isOriginChanging && !isPositionChanging) {
            isAnchored = true;
            isPositionChanging = true;
            fovPosition = this.camera._convertScenePositionToFOVPosition(toOrigin, start.position, this.camera.center, startTransformation);
            console.log('fov pos: ', fovPosition);
            toPosition = this.camera._convertScenePositionToCameraPosition(toOrigin, fovPosition, this.camera.center, toOrigin, toTransformation);
        }
        
        toOffset = this.camera._convertPositionToOffset(toPosition, this.camera.center, toOrigin, toTransformation);
        
        return {
            offsetX: isOffsetChanging ? toOffset.x : null,
            offsetY: isOffsetChanging ? toOffset.y : null,
            origin: isAnchored || isOriginChanging ? toOrigin : null,
            position: isPositionChanging ? toPosition : null,
            rotation: isRotationChanging ? toRotation : null,
            zoom: isZoomChanging ? toZoom : null
        };
    }
    
    /**
    * Gets the starting property values.
    *
    * @private
    * @returns {Object} - The starting properties.
    */
    _getStartProps () {
        return {
            origin: this.camera.transformOrigin.clone(),
            position: this.camera.position.clone(),
            rotation: this.camera.rotation,
            zoom: this.camera.zoom
        };
    }
    
    /**
    * Gets the ending property values.
    *
    * @private
    * @returns {Object} - The ending properties.
    */
    _getEndProps (to, start) {
        return {
            origin: (to.origin !== null) ? to.origin : start.origin,
            position: (to.position !== null) ? to.position : start.position,
            rotation: (to.rotation !== null) ? to.rotation : start.rotation,
            zoom: (to.zoom !== null) ? to.zoom : start.zoom
        };
    }
    
    /**
    * Initializes a core tween.
    *
    * @private
    * @param {TweenMax} tween - The tween.
    * @returns {this} self
    */
    _initCoreTween (tween, startProps) {
        if (tween !== undefined) {
            startProps = (startProps !== undefined) ? startProps : this._getStartProps();

            var parsedProps = this._parseProps(tween.props.source.origin, tween.props.source.position, tween.props.source.rotation, tween.props.source.zoom);
            var toProps = this._calculateToProps(parsedProps, startProps);
            var endProps = this._getEndProps(toProps, startProps);

            this.previousProps = startProps;
            tween.props.start = startProps;
            tween.props.end = endProps;
            tween.props.parsed = parsedProps;
            tween.props.to = toProps;
            
            tween.vars.rawOffsetX = toProps.offsetX;
            tween.vars.rawOffsetY = toProps.offsetY;
            tween.vars.rotation = toProps.rotation;
            tween.vars.zoom = toProps.zoom;
        }
        
        return this;
    }
    
    /**
    * Parses the core animation properties.
    *
    * @private
    * @param {Object} origin - The origin.
    * @param {Object} position - The origin.
    * @param {number} rotation - The rotation.
    * @param {number} zoom - The zoom.
    * @returns {Object} - The parsed properties.
    */
    _parseProps (origin, position, rotation, zoom) {
        if (position === 'previous' && this.previousProps.position) {
            position = this.previousProps.position;
        }
        
        if (rotation === 'previous' && !isNil(this.previousProps.rotation)) {
            rotation = this.previousProps.rotation;
        }
        
        if (zoom === 'previous' && !isNil(this.previousProps.zoom)) {
            zoom = this.previousProps.zoom;
        }
        
        return { 
            origin: Utils.parsePosition(origin, this.camera.scene.view),
            position: Utils.parsePosition(position, this.camera.scene.view),
            rotation: !isNil(rotation) ? rotation : null,
            zoom: zoom || null
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
                enforceBounds: shake.enforceBounds
            };
        }
        
        return parsedShake;
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
        this.currentKeyframe = null;
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
                enforceBounds: options.enforceBounds
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