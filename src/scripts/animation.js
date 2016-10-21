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
import Matrix2    from './math/matrix2';
import Utils      from './utils';
import Vector2    from './math/vector2';

/**
* @class Oculo.Animation
* @constructor
* @memberof Camera
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
        this.camera = camera;
        
        this.eventCallback('onStart', Oculo.Animation._onStart, [camera, options], this);
        this.eventCallback('onUpdate', Oculo.Animation._onUpdate, [camera, options], this);
        this.eventCallback('onComplete', Oculo.Animation._onComplete, [camera, options], this);
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
        var parsedProps = Animation._parseProps(props, camera);
        var props = Animation._calculateTweenProps(camera, parsedProps.origin, parsedProps.position, parsedProps.rotation, parsedProps.zoom);
        
        var tween = TweenMax.set(camera, Object.assign({}, config, props.tweenProps, {
            onUpdate: Animation._onUpdate,
            onUpdateParams: [camera, config],
            onComplete: Animation._onComplete,
            onCompleteParams: [camera, config]
        }));
        
        return animation;
    }
    
    static _parseProps (props, camera) {
        var parsedProps = {
            position: {},
            origin: {},
            rotation: null,
            shake: {},
            zoom: props.zoom
        };
        
        parsedProps.position = Utils.parsePosition(props.position, camera.scene.view);
        
        parsedProps.origin = Utils.parsePosition(props.origin, camera.scene.view);
        
        if (isFinite(props.rotation)) {
            parsedProps.rotation = props.rotation;
        }
        
        if (props.shake) {
            parsedProps.shake.intensity = isNil(props.shake.intensity) ? 0 : props.shake.intensity;
            parsedProps.shake.direction = isNil(props.shake.direction) ? Oculo.Animation.shakeDirection.BOTH : props.shake.direction;
            parsedProps.shake.easeIn = props.shake.easeIn;
            parsedProps.shake.easeOut = props.shake.easeOut;    
        }
        
        return parsedProps;
    }
    
    static _calculateTweenProps (camera, sourceOrigin, sourcePosition, sourceRotation, sourceZoom) {
        var position = new Vector2(isFinite(sourcePosition.x) ? sourcePosition.x : camera.position.x, isFinite(sourcePosition.y) ? sourcePosition.y : camera.position.y);
        var origin = new Vector2(isFinite(sourceOrigin.x) ? sourceOrigin.x : camera.scene.origin.x, isFinite(sourceOrigin.y) ? sourceOrigin.y : camera.scene.origin.y);
        var rotation = isFinite(sourceRotation) ? sourceRotation : camera.rotation;
        var zoom = camera._clampZoom(isFinite(sourceZoom) ? sourceZoom : camera.zoom);
        var transformation = new Matrix2().scale(zoom, zoom).rotate(Oculo.Math.degToRad(-rotation));
        var originOffset = new Vector2();
        var cameraContextPosition = camera.viewportCenter;
        var offset = new Vector2();
        var data = {};
        var endProps = {};
        var tweenProps = {};

        data.isMoving = isFinite(sourcePosition.x) || isFinite(sourcePosition.y);
        data.isRotating = isFinite(sourceRotation) && sourceRotation !== camera.rotation;
        data.isZooming = isFinite(sourceZoom) && sourceZoom !== camera.zoom;

        if (!data.isMoving && !isFinite(sourceOrigin.x) && !isFinite(sourceOrigin.y)) {
            origin.copy(camera.position);
        }
        
        if (!data.isMoving) {
            position.copy(origin);
            cameraContextPosition = camera._calculateContextPosition(origin, camera.position, camera.viewportCenter, camera.sceneTransformation);
        }

        offset = camera._calculateOffset(position, cameraContextPosition, origin, transformation);

        endProps.endOrigin = origin;
        endProps.endPosition = position;
        endProps.endRotation = rotation;
        endProps.endZoom = zoom;

        if (data.isMoving) {
            tweenProps.offsetX = offset.x;
            tweenProps.offsetY = offset.y;
        }

        if (data.isRotating) {
            tweenProps.rotation = rotation;
        }

        if (data.isZooming) {
            tweenProps.zoom = zoom;
        }

        // TODO: For dev only
//                console.log('props: ', {
//                    isMoving: data.isMoving,
//                    isRotating: data.isRotating,
//                    isZooming: data.isZooming,
//                    sourcePosition: sourcePosition,
//                    sourceOrigin: sourceOrigin,
//                    sourceRotation: sourceRotation,
//                    sourceZoom: sourceZoom,
//                    startOrigin: tween.data.startOrigin,
//                    startPosition: tween.data.startPosition,
//                    startRotation: tween.data.startRotation,
//                    startZoom: tween.data.startZoom,
//                    endOrigin: endProps.endOrigin,
//                    endPosition: endProps.endPosition,
//                    endRotation: endProps.endRotation,
//                    endZoom: endProps.endZoom
//                });
                console.log('tween props: ', tweenProps);

        // Smooth origin change
        if (!origin.equals(camera.scene.origin)) {
            originOffset = origin.clone().transform(camera.sceneTransformation).subtract(camera.scene.origin.clone().transform(camera.sceneTransformation), origin.clone().subtract(camera.scene.origin));

            if (camera.isRotated || camera.isZoomed) {
                camera.offset.set(camera.offset.x - originOffset.x, camera.offset.y - originOffset.y);
            }

            camera.scene.origin.copy(origin);
            TweenMax.set(camera.scene.view, { 
                css: {
                    transitionDuration: '0s',
                    transformOrigin: origin.x + 'px ' + origin.y + 'px',
                    x: -camera.offset.x,
                    y: -camera.offset.y
                },
            });
        }

        return { 
            data: data,
            endProps: endProps,
            tweenProps: tweenProps
        };
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
        var parsedProps = Oculo.Animation._parseProps(props, this.camera);
        var position = parsedProps.position;
        var origin = parsedProps.origin;
        var rotation = parsedProps.rotation;
        var shake = parsedProps.shake;
        var zoom = parsedProps.zoom;
        
        // Tween core camera properties
        mainTimeline.add(TweenMax.to(this.camera, duration, Object.assign({}, options, {
            data: {
                sourcePosition: position,
                sourceOrigin: origin,
                sourceRotation: rotation,
                sourceZoom: zoom
            }, 
            callbackScope: this,
            immediateRender: false,
            onStart: function (tween) {
                var props = Animation._calculateTweenProps(this.camera, tween.data.sourceOrigin, tween.data.sourcePosition, tween.data.sourceRotation, tween.data.sourceZoom);
                
                tween.data.isMoving = props.data.isMoving;
                tween.data.isRotating = props.data.isRotating;
                tween.data.isZooming = props.data.isZooming;
                
                tween.data.endOrigin = props.endProps.endOrigin;
                tween.data.endPosition = props.endProps.endPosition;
                tween.data.endRotation = props.endProps.endRotation;
                tween.data.endZoom = props.endProps.endZoom;
                
                tween.updateTo(props.tweenProps);
            },
            onStartParams: ['{self}']
        })), 0);
        
        // Tween shake effect
        if (duration > 0 && shake.intensity > 0) {
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