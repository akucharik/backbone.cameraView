'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

// TODO:
// 1) Import Animation to avoid using Oculo namespace

import clamp            from 'lodash/clamp';
import isElement        from 'lodash/isElement';
import isFinite         from 'lodash/isFinite';
import isFunction       from 'lodash/isFunction';
import isNil            from 'lodash/isNil';
import isObject         from 'lodash/isObject';
import { EventEmitter } from 'fbemitter';
import AnimationManager from './animationManager';
import CSSRenderer      from './cssRenderer';
import _Math            from './math/math';
import Matrix2          from './math/matrix2';
import Scene            from './scene';
import SceneManager     from './sceneManager';
import TrackControl     from './trackControl';
import Utils            from './utils';
import Vector2          from './math/vector2';

const animationName = {
    ANONYMOUS: '_anonymous'
};

/**
* Description.
* 
* @class Oculo.Camera
* @constructor
* @param {Object} [options] - An object of options.
* @param {function|Object} [options.bounds] - The bounds.
* @param {boolean} [options.dragToMove] - Whether the camera's position is draggable or not.
* @param {number} [options.minZoom] - The {@link Camera.minZoom|minimum zoom}.
* @param {number} [options.maxZoom] - The {@link Camera.maxZoom|maximum zoom}.
* @param {string|Element|null} [options.view] - The camera's view.
* @param {boolean} [options.wheelToZoom] - Whether wheeling can be used to zoom or not.
* @param {number} [options.wheelToZoomIncrement] - The base {@link Camera.wheelToZoomIncrement|zoom increment}.
* @param {number|string} [options.width] - The camera's {@link Camera.width|width}.
* @param {number|string} [options.height] - The camera's {@link Camera.height|height}.
*
* @example
* var myCamera = new Oculo.Camera({ 
*   view: '#camera',
*   bounds: Oculo.Camera.bounds.WORLD_EDGE,
*   dragToMove: true,
*   minZoom: 0.5,
*   maxZoom: 3,
*   wheelToZoom: true,
*   wheelToZoomIncrement: 0.5,
*   width: 1000,
*   height: 500
* });
*/
class Camera {
    constructor ({ 
        bounds = null, 
        dragToMove = false, 
        height = 0, 
        maxZoom = 3, 
        minZoom = 0.5, 
        view = undefined, 
        wheelToZoom = false, 
        wheelToZoomIncrement = 0.01, 
        width = 0
    } = {}) {
        
        /**
        * @property {Oculo.AnimationManager} - An object for managing animations.
        * @readonly
        */
        this.animations = new AnimationManager(this);

        /**
        * @property {boolean} - Whether the camera's position is draggable or not.
        * @default false
        */
        this.dragToMove = (dragToMove === true) ? true : false;

        /**
        * @property {boolean} - Whether the camera has been rendered or not.
        * @readonly
        * @default
        */
        this.isRendered = false;

        /**
        * @property {boolean} - Whether the camera is shaking or not.
        * @readonly
        * @default
        */
        this.isShaking = false;
        
        /**
        * @property {null|number} - The minimum X position after bounds are applied.
        * @readonly
        */
        this.minPositionX = null;
        
        /**
        * @property {null|number} - The minimum Y position after bounds are applied.
        * @readonly
        */
        this.minPositionY = null;
        
        /**
        * @property {null|number} - The maximum X position after bounds are applied.
        * @readonly
        */
        this.maxPositionX = null;
        
        /**
        * @property {null|number} - The maximum Y position after bounds are applied.
        * @readonly
        */
        this.maxPositionY = null;
        
        /**
        * The minimum value the camera can be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 0.5
        */
        this.minZoom = minZoom;
        
        /**
        * The maximum value the camera can be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 3
        */
        this.maxZoom = maxZoom;
        
        /**
        * @property {number} - The offset of the camera's top left corner relative to the scene without any effects applied.
        * @readonly
        */
        this.rawOffset = new Vector2(0, 0);
        
        /**
        * @property {number} - The offset of the camera's top left corner relative to the scene.
        * @readonly
        */
        this.offset = new Vector2(0, 0);
        
        /**
        * @property {number} - The position of the camera on the scene.
        * @readonly
        */
        this.position = new Vector2(width * 0.5, height * 0.5);
        
        /**
        * @property {number} - The renderer.
        * @readonly
        */
        this.renderer = new CSSRenderer(this);
        
        /**
        * @property {number} - The amount of rotation in degrees.
        * @readonly
        * @default 0
        */
        this.rotation = 0;
        
        /**
        * @property {Oculo.SceneManager} - An object for managing scenes.
        * @readonly
        */
        this.scenes = new SceneManager(this);
        
        /**
        * @property {number} - The amount of shake offset.
        * @readonly
        * @default
        */
        this.shakeOffset = new Vector2(0, 0);
        
        /**
        * @property {boolean} - Whether the shake effect respects the bounds or not.
        * @readonly
        * @default
        */
        this.shakeRespectBounds = true;
        
        /**
        * @property {TrackControl} - The track control.
        * @readonly
        * @default
        */
        this.trackControl = null;

        /**
        * @property {Vector2} - The transformation origin.
        * @readonly
        */
        this.transformOrigin = new Vector2(0, 0);
        
        /**
        * @private
        * @property {Element} - The view.
        */
        this.view = (view === null) ? null : Utils.DOM.parseView(view) || document.createElement('div');
        
        /**
        * @property {boolean} - Whether wheeling can be used to zoom or not.
        * @default false
        */
        this.wheelToZoom = (wheelToZoom === true) ? true : false;
        
        /**
        * @property {number} - The base increment at which the camera will be zoomed. See {@link Camera.zoom|zoom}.
        * @default 0.01
        */
        this.wheelToZoomIncrement = wheelToZoomIncrement;
        
        /**
        * @property {number} - The width.
        * @readonly
        * @default 0
        */
        this.width = width;

        /**
        * @property {number} - The height.
        * @readonly
        * @default 0
        */
        this.height = height;
        
        /**
        * @property {Vector2} - The center of the camera's FOV.
        * @readonly
        */
        this.center = new Vector2(this.width, this.height).multiplyScalar(0.5);
        
        /**
        * @private
        * @property {number} - The internally managed zoom.
        */
        this._zoom = 1;
        
        /**
        * @private
        * @property {null|function|Object} - The internally managed bounds.
        */
        this._bounds = bounds;
        
        /**
        * @private
        * @property {EventEmitter} - The internal event emitter.
        */
        this._events = new EventEmitter();
        
        // Initialize custom events
        this.onResize = () => {
            // Maintain camera position and update the current animation
            new Oculo.Animation(this, { 
                destroyOnComplete: true, 
                paused: false, 
                onComplete: function (wasPaused) {
                    // 'this' is bound to the Animation via the Animation class
                    var animation = this.camera.animations.currentAnimation;
                    var time = animation.time();

                    animation.seek(0).invalidate();
                    this.camera.position = animation.coreTweens[0].props.start.position;
                    this.camera.rawOffset = this.camera._calculateOffsetFromPosition(this.camera.position, this.camera.center, this.camera.transformOrigin, this.camera.transformation);
                    animation.seek(time, false);

                    if (!wasPaused) {
                        this.camera.resume();
                    }
                },
                onCompleteParams: [this.animations.isPaused]
            }).moveTo(this.position, 0, { overwrite: false });
        }
        
        // Initialize event listeners
        this._events.addListener('change:size', this.onResize);
        
        // Initialize view
        if (this.view) {
            this.view.style.overflow = 'hidden';
            this.view.style.position = 'relative';
        }
        
        // Initialize scene manager view and track controls
        if (this.view && this.scenes.view) {
            this.view.appendChild(this.scenes.view);
            this.trackControl = new TrackControl(this, {
                draggable: this.dragToMove,
                onDrag: function (camera) {
                    var position = camera._calculatePositionFromOffset(new Vector2(-this.x, -this.y), camera.center, camera.transformOrigin, camera.transformation);
                    new Oculo.Animation(camera, { 
                        destroyOnComplete: true, 
                        paused: false,
                        onComplete: function (dragControl) {
                            dragControl.update();
                        },
                        onCompleteParams: [this]
                    }).moveTo(position, 0);
                },
                wheelable: this.wheelToZoom,
                onWheel: function (camera) {
                    const ZOOM_IN = 1;
                    const ZOOM_OUT = 0;
                    var velocity = Math.abs(this.wheelEvent.deltaY);
                    var direction = this.wheelEvent.deltaY > 0 ? ZOOM_OUT : ZOOM_IN;
                    var previousDirection = this.previousWheelEvent.deltaY > 0 ? ZOOM_OUT : ZOOM_IN;
                    var cameraRect;
                    var cameraFOVPosition = new Vector2();
                    var sceneContextPosition = new Vector2();
                    var origin = camera.transformOrigin;
                    var zoom = camera.zoom + camera.zoom * camera.wheelToZoomIncrement * (velocity > 1 ? velocity * 0.5 : 1) * (direction === ZOOM_IN ? 1 : -1);

                    // Performance Optimization: If zoom has not changed because it's at the min/max, don't zoom.
                    if (direction === previousDirection && camera._clampZoom(zoom) !== camera.zoom) { 
                        cameraRect = camera.view.getBoundingClientRect();
                        cameraFOVPosition.set(this.wheelEvent.clientX - cameraRect.left, this.wheelEvent.clientY - cameraRect.top);
                        sceneContextPosition = camera._calculatePositionFromOffset(camera.offset, cameraFOVPosition, camera.transformOrigin, camera.transformation);

                        if (Math.round(origin.x) !== Math.round(sceneContextPosition.x) || Math.round(origin.y) !== Math.round(sceneContextPosition.y)) {
                            origin = camera._calculatePositionFromOffset(camera.offset, cameraFOVPosition, camera.transformOrigin, camera.transformation);
                        }

                        new Oculo.Animation(camera, { 
                            destroyOnComplete: true, 
                            paused: false 
                        }).zoomAt(origin, zoom, 0);
                    }
                }
            });
        }
        
        this.initialize(arguments[0]);
    }
    
    /**
    * @name Camera#bounds
    * @property {null|function|Object} - The camera's bounds. The minimum and maximum position values for the camera. Set to null if no bounds are desired.
    *
    * @example <caption>As a stock bounds</caption>
    * Oculo.Camera.bounds.WORLD
    *
    * @example <caption>As a bounds object</caption>
    * { 
    *   minX: 0, 
    *   minY: 0, 
    *   maxX: this.scene.width, 
    *   maxY: this.scene.height
    * }
    *
    * @example <caption>As a function that returns a bounds object</caption>
    * function () { 
    *   var transformation = new Matrix2().scale(this.zoom, this.zoom).getInverse();
    *   var min = new Vector2().add(this.center).transform(transformation);
    *   var max = new Vector2(this.scene.scaledWidth, this.scene.scaledHeight).subtract(this.center).transform(transformation);
    * 
    *   return {
    *     minX: min.x,
    *     minY: min.y,
    *     maxX: max.x,
    *     maxY: max.y
    *   }
    * }
    */
    get bounds () {
        return this._bounds;
    }

    set bounds (value) {
        this._bounds = !value ? null : value;
        this._updateBounds();
    }
    
    /**
    * @name Camera#hasBounds
    * @property {boolean} - Whether the camera has bounds or not.
    * @readonly
    */
    get hasBounds () {
        return this._bounds !== null;
    }
    
    /**
    * @name Camera#isRotated
    * @property {boolean} - Whether the camera is rotated or not.
    * @readonly
    */
    get isRotated () {
        return (Math.abs(this.rotation / 360) % 1) > 0;
    }
    
    /**
    * @name Camera#isZoomed
    * @property {boolean} - Whether the camera is zoomed or not.
    * @readonly
    */
    get isZoomed () {
        return this.zoom !== 1;
    }
    
    /**
    * @name Camera#rawOffsetX
    * @property {Vector2} - The X offset of the camera's top left corner relative to the world without any effects applied.
    */
    get rawOffsetX () {
        return this.rawOffset.x;
    }
    
    set rawOffsetX (value) {
        this.rawOffset.x = value;
    }
    
    /**
    * @name Camera#rawOffsetY
    * @property {Vector2} - The Y offset of the camera's top left corner relative to the world without any effects applied.
    */
    get rawOffsetY () {
        return this.rawOffset.y;
    }
    
    set rawOffsetY (value) {
        this.rawOffset.y = value;
    }
    
    /**
    * @name Camera#scene
    * @property {Oculo.Scene} - The active scene.
    * @readonly
    */
    get scene () {
        return this.scenes.activeScene;
    }
    
    /**
    * @name Camera#transformation
    * @property {Matrix2} - The transformation of the scene.
    * @readonly
    */
    get transformation () {
        return new Matrix2().scale(this.zoom, this.zoom).rotate(_Math.degToRad(-this.rotation));
    }
    
    /**
    * @name Camera#zoom
    * @property {number} - The amount of zoom. A ratio where 1 = 100%.
    * @readonly
    * @default 1
    */
    get zoom () {
        return this._zoom;
    }
        
    set zoom (value) {
        this._zoom = this._clampZoom(value);
        this._updateBounds();
    };

    /**
    * Apply the shake effect to the camera.
    *
    * @private
    * @returns {this} self
    */
    _applyShake () {
        if (this.isShaking) {
            this.position.add(this.shakeOffset);
            
            if (this.shakeRespectBounds) {
                this._clampPosition(this.position);
            }
        }
        
        return this;
    }
    
    /**
    * Calculate the position of the camera on the scene given a scene position to be located a point in the camera's FOV.
    *
    * @private
    * @param {Vector2} scenePosition - The raw point on the scene.
    * @param {Vector2} cameraFOVPosition - The point in the camera's FOV.
    * @param {Vector2} cameraCenter - The center of the camera's FOV.
    * @param {Vector2} sceneOrigin - The scene's origin.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The camera's position.
    */
    _calculatePositionFromPosition (scenePosition, cameraFOVPosition, cameraCenter, sceneOrigin, sceneTransformation) {
        if (cameraFOVPosition.equals(cameraCenter)) {
            return scenePosition.clone();
        }
        else {
            let offset = this._calculateOffsetFromPosition(scenePosition, cameraFOVPosition, sceneOrigin, sceneTransformation);
            
            return this._calculatePositionFromOffset(offset, cameraCenter, sceneOrigin, sceneTransformation);
        }
    }
    
    /**
    * Calculate the position of the camera on the scene given the camera's offset.
    *
    * @private
    * @param {Vector2} cameraOffset - The camera's offset on the scene.
    * @param {Vector2} cameraCenter - The center of the camera's FOV.
    * @param {Vector2} sceneOrigin - The scene's origin.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The camera's position.
    */
    _calculatePositionFromOffset (cameraOffset, cameraCenter, sceneOrigin, sceneTransformation) {
        var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

        return cameraOffset.clone().add(sceneOriginOffset).add(cameraCenter).transform(sceneTransformation.getInverse());
    }

    /**
    * Calculate the position in the camera's FOV of the provided scene position.
    *
    * @private
    * @param {Vector2} scenePosition - The raw point on the scene.
    * @param {Vector2} cameraPosition - The camera's position.
    * @param {Vector2} cameraCenter - The center of the camera's FOV.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The position in the camera's FOV.
    */
    _calculateContextPosition (scenePosition, cameraPosition, cameraCenter, sceneTransformation) {
        var cameraOffset = this._calculateOffsetFromPosition(cameraPosition, cameraCenter, new Vector2(), sceneTransformation);

        return scenePosition.clone().transform(sceneTransformation).subtract(cameraOffset);
    }

    /**
    * Calculate the offset of the camera on the scene given a scene position to be located a point in the camera's FOV.
    *
    * @private
    * @param {Vector2} scenePosition - The raw point on the scene.
    * @param {Vector2} cameraFOVPosition - The point in the camera's FOV.
    * @param {Vector2} sceneOrigin - The scene's origin.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The camera's offset.
    */
    _calculateOffsetFromPosition (scenePosition, cameraFOVPosition, sceneOrigin, sceneTransformation) {
        var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

        return scenePosition.clone().transform(sceneTransformation).subtract(sceneOriginOffset).subtract(cameraFOVPosition);
    }
    
    /**
    * Clamp the position.
    *
    * @private
    * @param {Vector2} position - The position.
    * @returns {Vector2} The clamped position.
    */
    _clampPosition (position) {
        if (this._bounds !== null) {
            position.x = clamp(position.x, this.minPositionX, this.maxPositionX);
            position.y = clamp(position.y, this.minPositionY, this.maxPositionY);
        }
        
        // TODO: For dev only
        console.log('clamp position');
        
        return position;
    }
    
    /**
    * Clamp the zoom.
    *
    * @private
    * @param {number} zoom - The zoom.
    * @returns {number} The clamped zoom.
    */
    _clampZoom (zoom) {
        return clamp(zoom, this.minZoom, this.maxZoom);
    }
    
    /**
    * Resets the camera to the default state.
    *
    * @returns {this} self
    */
    _reset () {
        this.transformOrigin.set(0, 0);
        this.position.set(this.width * 0.5, this.height * 0.5);
        this.rotation = 0;
        this.zoom = 1;
        this.rawOffset = this._calculateOffsetFromPosition(this.position, this.center, this.transformOrigin, this.transformation);
        this.offset.copy(this.rawOffset);
        
        return this;
    }
    
    /**
    * Sets the transformOrigin.
    *
    * @private
    * @param {Vector2} origin - The origin.
    * @returns {this} self
    */
    _setTransformOrigin (origin) {
        if (origin && !origin.equals(this.transformOrigin)) {
            var transformation = this.transformation;
            var originOffset = origin.clone().transform(transformation).subtract(this.transformOrigin.clone().transform(transformation)).subtract(origin.clone().subtract(this.transformOrigin));

            if (this.isRotated || this.isZoomed) {
                this.rawOffset.x -= originOffset.x;
                this.rawOffset.y -= originOffset.y;
            }

            this.transformOrigin.copy(origin);
        }
        
        return this;
    }
    
    _updateBounds () { 
        var bounds;
        
        if (this.scene) {
            if (this._bounds === null) {
                bounds = {
                    minX: null,
                    minY: null,
                    maxX: null,
                    maxY: null
                };
            }
            else if (isFunction(this._bounds)) {
                bounds = this._bounds.call(this);
            }
            else {
                bounds = this._bounds;
            }
            
            this.minPositionX = bounds.minX;
            this.minPositionY = bounds.minY;
            this.maxPositionX = bounds.maxX;
            this.maxPositionY = bounds.maxY;

            // TODO: For dev only
            //console.log('update bounds');
        }
    }
    
    /**
    * Adds an animation to the camera.
    *
    * @see Oculo.AnimationManager.add
    * returns {this} self
    */
    addAnimation (name, animation) {
        this.animations.add(name, animation);
        
        return this;
    }
    
    /**
    * Gets an animation.
    *
    * @see Oculo.AnimationManager.get
    */
    getAnimation (name) {
        return this.animations.get(name);
    }
    
    /**
    * Adds a scene to the camera.
    *
    * @see Oculo.SceneManager.add
    * @returns {this} self
    */
    addScene (name, scene) {
        this.scenes.add(name, scene);
        
        return this;
    }
    
    /**
    * Gets a scene.
    *
    * @see Oculo.SceneManager.get
    */
    getScene (name) {
        return this.scenes.get(name);
    }
    
    /**
    * Sets the active scene.
    *
    * @param {string} name - The name of the scene.
    * @returns {this} self
    */
    setScene (name) {
        this.scenes.setActiveScene(name);
        this._reset();
        this._updateBounds();

        return this;
    }
    
    /**
    * Destroys the camera and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        if (this.view && this.view.parentNode) {
            this.view.parentNode.removeChild(this.view);
        }
        
        this.view = null;
        this.animations.destroy();
        this.renderer.destroy();
        this.scenes.destroy();
        this.trackControl.destroy();
        this._events.removeAllListeners();
        
        return this;
    }
    
    /**
    * Disables drag-to-move.
    *
    * @returns {this} self
    */
    disableDragToMove () {
        this.trackControl.disableDrag();
        
        return this;
    }

    /**
    * Enables drag-to-move.
    *
    * @returns {this} self
    */
    enableDragToMove () {
        this.trackControl.enableDrag();

        return this;
    }
    
    /**
    * Disables wheel-to-zoom.
    *
    * @returns {this} self
    */
    disableWheelToZoom () {
        this.trackControl.disableWheel();
        
        return this;
    }

    /**
    * Enables wheel-to-zoom.
    *
    * @returns {this} self
    */
    enableWheelToZoom () {
        this.trackControl.enableWheel();

        return this;
    }

    /**
    * Called when the camera has been created. The default implementation of initialize is a no-op. Override this function with your own code.
    *
    * @param {Object} [options] - The options passed to the constructor when the camera was created.
    */
    initialize (options) {
        
    }

    /**
    * Called before the camera has rendered. The default implementation of initialize is a no-op. Override this function with your own code.
    */
    onBeforeRender () {

    }

    /**
    * Called after the camera has rendered. The default implementation of initialize is a no-op. Override this function with your own code.
    */
    onRender () {

    }

    /**
    * Render the camera view. If you need to manipulate how the camera renders, use {@link Camera#onBeforeRender|onBeforeRender} and {@link Camera#onRender|onRender}.
    *
    * @returns {Camera} The view.
    */
    render () {
        this.onBeforeRender();

        if (!this.isRendered) {
            this.renderer.renderSize();
            this.isRendered = true;
        }
        
        // Clamping here ensures bounds have been updated (if zoom has changed) and bounds are enforced during rotateAt
        // Position is manually maintained so animations can smoothly continue when camera is resized
        this.position = this._clampPosition(this._calculatePositionFromOffset(this.rawOffset, this.center, this.transformOrigin, this.transformation));
        this._applyShake();
        this.offset = this._calculateOffsetFromPosition(this.position, this.center, this.transformOrigin, this.transformation);
        this.renderer.render();
        this.onRender();

        return this;
    }
    
    /**
    * Sets the size of the camera.
    *
    * @param {number|string} width - The width.
    * @param {number|string} height - The height.
    * @returns {this} self
    */
    setSize (width, height) {
        var hasChanged = false;
        
        if (!isNil(width) && (width !== this.width)) {
            this.width = width;
            this.center.x = width * 0.5;
            hasChanged = true;
        }
        
        if (!isNil(height) && (height !== this.height)) {
            this.height = height;
            this.center.y = height * 0.5;
            hasChanged = true;
        }
        
        if (hasChanged) {
            this.renderer.renderSize();
            this._events.emit('change:size');
        }
        
        return this;
    }
    
    /**
    * Pauses the camera animation.
    *
    * @see {@link external:TimelineMax|TimelineMax}
    * @returns {this} self
    */
    pause () {
        this.animations.pause();

        return this;
    }

    /**
    * Plays the camera animation forward from the current playhead position.
    *
    * @see {@link external:TimelineMax|TimelineMax}
    * @returns {this} self
    */
    play (animation) {
        this.animations.play(animation);

        return this;
    }
    
    /**
    * Resumes playing the camera animation from the current playhead position.
    *
    * @see {@link external:TimelineMax|TimelineMax}
    * @returns {this} self
    */
    resume () {
        this.animations.resume();

        return this;
    }
    
    /**
    * Reverses playback of an animation.
    *
    * @param {string} [name] - The name of the animation. If none is specified, the current animation will be reversed.
    * @returns {this} self
    */
    reverse (name) {
        this.animations.reverse(name);
        
        return this;
    }

    /**
    * Immediately animate the camera.
    *
    * @see {@link Camera.Animation#animate|Animation.animate}
    * @returns {this} self
    */
    animate (props, duration, options) {
        this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).animate(props, duration, options));
        this.animations.play(animationName.ANONYMOUS);
        
        return this;
    }

    /**
    * Immediately move to a specific position.
    *
    * @see {@link Camera.Animation#moveTo|Animation.moveTo}
    * @returns {this} self
    */
    moveTo (position, duration, options) {
        this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).moveTo(position, duration, options));
        this.animations.play(animationName.ANONYMOUS);
        
        return this;
    }

    /**
    * Immediately rotate at the specified location.
    *
    * @see {@link Camera.Animation#rotateAt|Animation.rotateAt}
    * @returns {this} self
    */
    rotateAt (origin, rotation, duration, options) {
        this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).rotateAt(origin, rotation, duration, options));
        this.animations.play(animationName.ANONYMOUS);
        
        return this;
    }

    /**
    * Immediately rotate at the current position.
    *
    * @see {@link Camera.Animation#rotateTo|Animation.rotateTo}
    * @returns {this} self
    */
    rotateTo (rotation, duration, options) {
        this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).rotateTo(rotation, duration, options));
        this.animations.play(animationName.ANONYMOUS);
        
        return this;
    }

    /**
    * Immediately shake the camera.
    *
    * @see {@link Camera.Animation#shake|Animation.shake}
    * @returns {this} self
    */
    shake (intensity, duration, direction, options) {
        this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).shake(intensity, duration, direction, options));
        this.animations.play(animationName.ANONYMOUS);
        
        return this;
    }

    /**
    * Immediately zoom in/out at a specific location.
    *
    * @see {@link Camera.Animation#zoomAt|Animation.zoomAt}
    * @returns {this} self
    */
    zoomAt (origin, zoom, duration, options) {
        this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).zoomAt(origin, zoom, duration, options));
        this.animations.play(animationName.ANONYMOUS);
        
        return this;
    }

    /**
    * Immediately zoom in/out at the current position.
    *
    * @see {@link Camera.Animation#zoomTo|Animation.zoomTo}
    * @returns {this} self
    */
    zoomTo (zoom, duration, options) {
        this.animations.add(animationName.ANONYMOUS, new Oculo.Animation(this).zoomTo(zoom, duration, options));
        this.animations.play(animationName.ANONYMOUS);

        return this;
    }
}

Camera.bounds = {
    NONE: null,
    WORLD: function () {
        var transformation = new Matrix2().scale(this.zoom, this.zoom).getInverse();
        var min = new Vector2().add(this.center).transform(transformation);
        var max = new Vector2(this.scene.scaledWidth, this.scene.scaledHeight).subtract(this.center).transform(transformation);

        return {
            minX: min.x,
            minY: min.y,
            maxX: max.x,
            maxY: max.y
        };
    },
    WORLD_EDGE: function () {
        return {
            minX: 0,
            minY: 0,
            maxX: this.scene.width,
            maxY: this.scene.height
        };
    },
};

export default Camera;