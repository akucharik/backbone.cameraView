'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import clamp      from 'lodash/clamp';
import isElement  from 'lodash/isElement';
import isFinite   from 'lodash/isFinite';
import isFunction from 'lodash/isFunction';
import isNil      from 'lodash/isNil';
import isObject   from 'lodash/isObject';
import isString   from 'lodash/isString';
import uniqueId   from 'lodash/uniqueId';
import _Math      from './math/math';
import Matrix2    from './math/matrix2';
import Utils      from './utils';
import Vector2    from './math/vector2';

//if (typeof(global) !== 'undefined') {
//    var TimelineMax = function () {};
//    TimelineMax.prototype.eventCallback = function () {};
//    TimelineMax.prototype.kill = function () {};
//    TimelineMax.prototype.pause = function () {};
//}

/**
* @class Oculo.Animation
* @constructor
* @memberof Oculo
* @extends external:TimelineMax
* @param {Camera} camera - The camera to be animated.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
*
* @example
* var myAnimation = new Oculo.Animation(myCamera).zoomTo(2,1).shake(0.1,2).resume();
*/
class Animation extends TimelineMax {
    constructor (camera, options) {
        options = options || {};
        
        super(Object.assign({}, {
            data: {
                id: uniqueId()
            },
            paused: true
        }, options));
        
        /**
        * @property {Camera} - The camera on which the animation will be applied.
        */
        this.camera = camera || null;
        
        this.eventCallback('onStart', Animation._onStart, [camera, options], this);
        this.eventCallback('onUpdate', Animation._onUpdate, [camera, options], this);
        this.eventCallback('onComplete', Animation._onComplete, [camera, options], this);
    }
    
    /**
    * Called when the animation has started.
    *
    * @private
    * @param {Oculo.Camera} camera - The camera.
    * @param {Object} config - An object of {@link external:TweenMax|TweenMax} options.
    */
    static _onStart (camera, config) {
        if (camera.isDraggable) {
            camera.draggable.disable();
        }

        if (camera.isManualZoomable) {
            camera.disableManualZoom();
        }

        if (config.onStart !== undefined) {
            config.onStart.apply(this, config.onStartParams);
        }
        
        // TODO: Remove once dev is complete
        //console.log('animation started');
    }
    
    /**
    * Called when the animation has updated.
    *
    * @private
    * @param {Oculo.Camera} camera - The camera.
    * @param {Object} config - An object of {@link external:TweenMax|TweenMax} options.
    */
    static _onUpdate (camera, config) {
        var offset, position;
            
        position = camera._calculatePosition(camera.offset, camera.viewportCenter, camera.scene.origin, camera.sceneTransformation);
        camera.applyBounds(position);
        offset = camera.offset.clone();

        if (camera.isShaking) {
            if (camera.shakeHorizontal) {
                offset.x += Math.random() * camera.shakeIntensity * camera.viewportWidth * 2 - camera.shakeIntensity * camera.viewportWidth;
            }

            if (camera.shakeVertical) {
                offset.y += Math.random() * camera.shakeIntensity * camera.viewportHeight * 2 - camera.shakeIntensity * camera.viewportHeight;
            }
        }
        
        // render
        TweenMax.set(camera.scene.view, { 
            css: {
                rotation: -camera.rotation,
                scaleX: camera.zoom,
                scaleY: camera.zoom,
                x: -offset.x,
                y: -offset.y
            },
            force3D: false
        });

        if (config.onUpdate !== undefined) {
            config.onUpdate.apply(this, config.onUpdateParams);
        }

        camera._renderDebug();
        // TODO: Remove once dev is complete
        //console.log('animation updated');
    }
    
    /**
    * Called when the animation has completed.
    *
    * @private
    * @param {Oculo.Camera} camera - The camera.
    * @param {Object} config - An object of {@link external:TweenMax|TweenMax} options.
    */
    static _onComplete (camera, config) {
        if (camera.isDraggable) {
            camera.draggable.enable();
        }

        if (camera.isManualZoomable) {
            camera.enableManualZoom();
        }

        if (config.onComplete !== undefined) {
            config.onComplete.apply(this, config.onCompleteParams);
        }

        camera._renderDebug();
        // TODO: Remove once dev is complete
        console.log('animation completed');
    }
    
    static set (camera, props, config) {
        props = props || {};
        config = config || {};
        
        var animation = new Oculo.Animation(camera);
        var parsedProps = animation._parseProps(props, camera);
        var props = animation._calculateEndProps(parsedProps.origin, parsedProps.position, parsedProps.rotation, parsedProps.zoom, camera);
                
        // Smooth origin change
        if (!props.endOrigin.equals(camera.scene.origin)) {
            animation._updateOrigin(props.endOrigin, camera);
        }
        
        animation.add(TweenMax.set(camera, Object.assign({}, config, {
            data: props,
            offsetX: props.endOffset.x,
            offsetY: props.endOffset.y,
            rotation: props.endRotation,
            zoom: props.endZoom,
            onUpdate: Animation._onUpdate,
            onUpdateParams: [camera, config],
            onComplete: Animation._onComplete,
            onCompleteParams: [camera, config]
        })));
        
        return animation;
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
    _parseCoreProps (sourceOrigin, sourcePosition, sourceRotation, sourceZoom, camera) {
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
                direction: isNil(shake.direction) ? Animation.shakeDirection.BOTH : shake.direction,
                easeIn: shake.easeIn,
                easeOut: shake.easeOut
            };
        }
        
        return parsedShake;
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
        
        var position = new Vector2(isFinite(sourcePosition.x) ? sourcePosition.x : camera.position.x, isFinite(sourcePosition.y) ? sourcePosition.y : camera.position.y);
        var origin = new Vector2(isFinite(sourceOrigin.x) ? sourceOrigin.x : camera.scene.origin.x, isFinite(sourceOrigin.y) ? sourceOrigin.y : camera.scene.origin.y);
        var rotation = isFinite(sourceRotation) ? sourceRotation : camera.rotation;
        var zoom = camera._clampZoom(isFinite(sourceZoom) ? sourceZoom : camera.zoom);
        var transformation = new Matrix2().scale(zoom, zoom).rotate(_Math.degToRad(-rotation));
        var cameraContextPosition = camera.viewportCenter;
        var offset = new Vector2();

        var isMoving = isFinite(sourcePosition.x) || isFinite(sourcePosition.y);
        var isRotating = isFinite(sourceRotation) && sourceRotation !== camera.rotation;
        var isZooming = isFinite(sourceZoom) && sourceZoom !== camera.zoom;

        if (!isMoving && !isFinite(sourceOrigin.x) && !isFinite(sourceOrigin.y)) {
            origin.copy(camera.position);
        }
        
        if (!isMoving) {
            position.copy(origin);
            cameraContextPosition = camera._calculateContextPosition(origin, camera.position, camera.viewportCenter, camera.sceneTransformation);
        }

        offset = camera._calculateOffset(position, cameraContextPosition, origin, transformation);
        
        return {
            isMoving: isMoving,
            isRotating: isRotating,
            isZooming: isZooming,
            endOffset: isMoving ? offset : null,
            endOrigin: (sourceOrigin.x || sourceOrigin.y) ? origin : null,
            endRotation: !isNil(sourceRotation) ? rotation : null,
            endZoom: sourceZoom ? zoom : null
        };
    }
    
    /**
    * Updates the origin.
    *
    * @private
    * @param {Vector2} origin - The origin.
    * @param {Oculo.Camera} camera - The camera.
    */
    _updateOrigin (origin, camera) {
        var originOffset = origin.clone().transform(camera.sceneTransformation).subtract(camera.scene.origin.clone().transform(camera.sceneTransformation), origin.clone().subtract(camera.scene.origin));

        if (camera.isRotated || camera.isZoomed) {
            camera.offset.set(camera.offset.x - originOffset.x, camera.offset.y - originOffset.y);
        }

        camera.scene.origin.copy(origin);
        TweenMax.set(camera.scene.view, { 
            css: {
                transformOrigin: origin.x + 'px ' + origin.y + 'px',
                x: -camera.offset.x,
                y: -camera.offset.y
            },
        });
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
        
        var mainTimeline = new TimelineMax();
        var shakeTimeline = null;
        var shake = this._parseShake(props.shake);
        
        // Tween core camera properties
        mainTimeline.add(TweenMax.to(this.camera, duration, Object.assign({}, options, {
            data: {
                sourceOrigin: props.origin,
                sourcePosition: props.position,
                sourceRotation: props.rotation,
                sourceZoom: props.zoom
            }, 
            callbackScope: this,
            immediateRender: false,
            onStart: function (tween) {
                var parsedProps = this._parseCoreProps(tween.data.sourceOrigin, tween.data.sourcePosition, tween.data.sourceRotation, tween.data.sourceZoom, this.camera);
                var endProps = this._calculateEndProps(parsedProps.parsedOrigin, parsedProps.parsedPosition, parsedProps.parsedRotation, parsedProps.parsedZoom, this.camera);
                var endOffset = endProps.endOffset || {};
                
                Object.assign(tween.data, parsedProps);
                Object.assign(tween.data, endProps);
                
                // Smooth origin change
                if (endProps.endOrigin && !endProps.endOrigin.equals(this.camera.scene.origin)) {
                    this._updateOrigin(endProps.endOrigin, this.camera);
                }
                
                console.log('tween data: ', tween.data);
                
                tween.updateTo({
                    offsetX: endOffset.x,
                    offsetY: endOffset.y,
                    rotation: endProps.endRotation,
                    zoom: endProps.endZoom
                });
            },
            onStartParams: ['{self}']
        })), 0);
        
        // Tween shake effect
        if (duration > 0 && shake && shake.intensity > 0) {
            this.camera.shakeHorizontal = shake.direction === Oculo.Animation.shakeDirection.VERTICAL ? false : true;
            this.camera.shakeVertical = shake.direction === Oculo.Animation.shakeDirection.HORIZONTAL ? false : true;
            
            shakeTimeline = new TimelineMax(Object.assign({}, options, {
                data: {
                    type: 'fx'
                },
                callbackScope: this,
                onStart: function (timeline) {
                    this.camera.isShaking = true;
                    
                    // TODO: For dev only
                    console.log('shake props: ', shake);
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
                shakeTimeline.fromTo(this.camera, duration, {
                    shakeIntensity: shake.intensity
                }, {
                    shakeIntensity: shake.intensity
                }, 0);
            }
            
            mainTimeline.add(shakeTimeline, 0);
        }
        
        this.add(mainTimeline);
        
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
        this.pause();
        this.camera = null;
        this.kill();
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
    * @param {Oculo.Animation.shakeDirection} [props.shake.direction=Oculo.Animation.shakeDirection.BOTH] - A shake direction. 
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
    * @param {Oculo.Animation.shakeDirection} [direction=Oculo.Animation.shakeDirection.BOTH] - A shake direction. 
    * @param {Object} [options] - An object of {@link external:TimelineMax|TimelineMax} options plus:
    * @param {Object} [options.easeIn] - An {@link external:Easing|Easing}.
    * @param {Object} [options.easeOut] - An {@link external:Easing|Easing}.
    * @returns {this} self
    *
    * @example
    * myAnimation.shake(0.1, 4);
    * myAnimation.shake(0.1, 4, Oculo.Animation.shakeDirection.HORIZONTAL, { easeIn: Power2.easeIn, easeOut: Power2.easeOut })
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
Animation.shakeDirection = {
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

export default Animation;