'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/
    
import clamp            from 'lodash/clamp';
import isElement        from 'lodash/isElement';
import isFinite         from 'lodash/isFinite';
import isFunction       from 'lodash/isFunction';
import isNil            from 'lodash/isNil';
import isObject         from 'lodash/isObject';
import isString         from 'lodash/isString';
import Backbone         from 'backbone';
import AnimationManager from './animationManager';
import _Math            from './math/math';
import Matrix2          from './math/matrix2';
import Scene            from './scene';
import SceneManager     from './sceneManager';
import TrackControl     from './trackControl';
import Utils            from './utils';
import Vector2          from './math/vector2';

/**
* Factory: Creates a camera to view a scene.
* Requires {@link external:Lodash} and {@link external:Zepto}.
* 
* @constructs Camera
* @extends external:Backbone.View
* @mixes SizableView
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
* @param {number|string|Element} [options.width] - The camera's {@link Camera.width|width}.
* @param {number|string|Element} [options.height] - The camera's {@link Camera.height|height}.
* @param {Object|Element} [options.position] - A {@link Camera.position|position} object.
* @param {number} [options.minZoom] - The {@link Camera.minZoom|minimum zoom}.
* @param {number} [options.maxZoom] - The {@link Camera.maxZoom|maximum zoom}.
* @param {number} [options.zoom] - A {@link Camera.zoom|zoom} ratio.
* @param {number} [options.wheelToZoomIncrement] - The base {@link Camera.wheelToZoomIncrement|zoom increment}.
*/
class Camera {
    constructor (options) {
        options = options || {};
        
        var position;
        
        // Compose object
        Object.assign(this, Backbone.Events);
        
//        /**
//        * The debugging information view.
//        * @property {Backbone.View} - The debugging information view.
//        */
//        this.debugView = new DebugView({
//            model: this,
//            className: 'oculo-debug'
//        });
        
        /**
        * @property {Oculo.AnimationManager} - An object for managing animations.
        * @readonly
        */
        this.animations = new AnimationManager(this);
        
        /**
        * @property {Object} - Whether the camera is in debug mode or not.
        * @default false
        */
        this.debug = options.debug ? true : false;

        /**
        * @property {boolean} - Whether the camera's position is draggable or not.
        * @default false
        */
        this.dragToMove = options.dragToMove ? true : false;

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
        this.minZoom = options.minZoom || 0.5;
        
        /**
        * The maximum value the camera can be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 3
        */
        this.maxZoom = options.maxZoom || 3;
        
        /**
        * @property {number} - The X offset of the camera's top left corner relative to the world.
        * @readonly
        */
        this.offsetX = 0;
        
        /**
        * @property {number} - The Y offset of the camera's top left corner relative to the world.
        * @readonly
        */
        this.offsetY = 0;
        
        /**
        * @property {number} - The X position of the camera's center point within the world.
        * @readonly
        */
        this.positionX = options.width * 0.5 || 0;
        
        /**
        * @property {number} - The Y position of the camera's center point within the world.
        * @readonly
        */
        this.positionY = options.height * 0.5 || 0;

        /**
        * @property {number} - The amount of rotation in degrees.
        * @readonly
        * @default 0
        */
        this.rotation = options.rotation || 0;
        
        /**
        * @property {Oculo.SceneManager} - An object for managing scenes.
        * @readonly
        */
        this.scenes = new SceneManager(this);
        
        /**
        * @property {number} - The shake intensity. A value between 0 and 1.
        * @readonly
        */
        this.shakeIntensity = 0;

        /**
        * @property {boolean} - Whether the camera should shake on the x axis.
        * @readonly
        * @default
        */
        this.shakeHorizontal = true;

        /**
        * @property {boolean} - Whether the camera should shake on the y axis.
        * @readonly
        * @default
        */
        this.shakeVertical = true;
        
        /**
        * @property {TrackControl} - The track control.
        * @readonly
        * @default
        */
        this.trackControl = null;

        /**
        * @private
        * @property {Element} - The internally managed view.
        */
        this.view = (options.view === null) ? null : Utils.DOM.parseView(options.view) || document.createElement('div');
        
        /**
        * @property {boolean} - Whether wheeling can be used to zoom or not.
        * @default false
        */
        this.wheelToZoom = options.wheelToZoom ? true : false;
        
        /**
        * @property {number} - The base increment at which the camera will be zoomed. See {@link Camera.zoom|zoom}.
        * @default 0.01
        */
        this.wheelToZoomIncrement = options.wheelToZoomIncrement || 0.01;
        
        /**
        * @property {number} - The width.
        * @readonly
        * @default 0
        */
        this.width = options.width || 0;

        /**
        * @property {number} - The height.
        * @readonly
        * @default 0
        */
        this.height = options.height || 0;
        
        /**
        * @private
        * @property {null|function|Object} - The internally managed bounds.
        */
        this._bounds = options.bounds || Camera.bounds.NONE;;
        
        /**
        * @private
        * @property {number} - The internally managed zoom.
        */
        this._zoom = this._clampZoom(options.zoom || 1);
        
        // Initialize custom events
        this.onResize = () => {
            var wasAnimating = this.animations.isAnimating;
            var wasPaused = this.animations.isPaused;

            // Maintain camera position and update the current animation
            if (wsAnimating) {
                this.pause();
            }

            new Oculo.Animation(this, { 
                paused: false, 
                onComplete: function (wasAnimating, wasPaused) {
                    // 'this' is bound to the Animation via the Animation class
                    if (wasAnimating) {
                        var inProgressTimeline, tween, endProps;

                        inProgressTimeline = this.camera.animations.currentAnimation.getChildren(false, false, true).filter((timeline) => {
                            var progress = timeline.progress();
                            return progress > 0 && progress < 1;
                        })[0];

                        tween = inProgressTimeline.getChildren(false, true, false)[0];

                        if (tween.data.isMoving) {
                            endProps = this._calculateEndProps(tween.data.parsedOrigin, tween.data.parsedPosition, tween.data.parsedRotation, tween.data.parsedZoom, this.camera);
                            Object.assign(tween.data, endProps);

                            // TODO: for dev only
                            console.log('tween data after resize: ', tween.data);
                            tween.updateTo({
                                zoom: endProps.endZoom,
                                rotation: endProps.endRotation,
                                offsetX: endProps.endOffsetX,
                                offsetY: endProps.endOffsetY
                            });
                        }
                    }

                    if (wasAnimating && !wasPaused) {
                        this.camera.animations.currentAnimation.resume();
                    }

                    this.destroy();
                },
                onCompleteParams: [wasAnimating, wasPaused]
            }).moveTo(this.position, 0, { overwrite: false });
        }
        
        // Initialize event listeners
        this.listenTo(this, 'change:size', this.onResize);
        
        this.initialize(options);
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
    * @name Camera#center
    * @property {Vector2} - The camera's center point.
    * @readonly
    */
    get center () {
        return new Vector2(this.width, this.height).multiplyScalar(0.5);
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
    * @name Camera#offset
    * @property {Vector2} - The offset of the camera's top left corner relative to the world.
    * @readonly
    */
    get offset () {
        return new Vector2(this.offsetX, this.offsetY);
    }
    
    /**
    * @name Camera#position
    * @property {Vector2} - The position of the camera's center point within the world.
    * @readonly
    */
    get position () {
        return new Vector2(this.positionX, this.positionY);
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
    * Calculate the position of the camera in the scene given the state of the camera and the scene.
    *
    * @private
    * @param {Vector2} cameraOffset - The camera's offset on the scene.
    * @param {Vector2} cameraCenter - The center of the camera.
    * @param {Vector2} sceneOrigin - The scene's origin.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The camera's position.
    */
    _calculatePosition (cameraOffset, cameraCenter, sceneOrigin, sceneTransformation) {
        var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

        return cameraOffset.clone().add(sceneOriginOffset, cameraCenter).transform(sceneTransformation.getInverse());
    }

    /**
    * Calculate the position within the camera of the provided raw point on the scene.
    *
    * @private
    * @param {Vector2} scenePosition - The raw point on the scene.
    * @param {Vector2} cameraPosition - The raw point on the scene on which the camera is positioned.
    * @param {Vector2} cameraCenter - The camera's center point.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The position within the camera.
    */
    _calculateContextPosition (scenePosition, cameraPosition, cameraCenter, sceneTransformation) {
        var cameraOffset = this._calculateOffset(cameraPosition, cameraCenter, new Vector2(), sceneTransformation);

        return scenePosition.clone().transform(sceneTransformation).subtract(cameraOffset);
    }

    /**
    * Calculate the camera's offset on the scene given a raw point on the scene to be placed at a point on the camera.
    *
    * @private
    * @param {Vector2} scenePosition - The raw point on the scene.
    * @param {Vector2} cameraContext - The point on the camera.
    * @param {Vector2} sceneOrigin - The scene's origin.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The camera's offset.
    */
    _calculateOffset (scenePosition, cameraContextPosition, sceneOrigin, sceneTransformation) {
        var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

        return scenePosition.clone().transform(sceneTransformation).subtract(sceneOriginOffset, cameraContextPosition);
    }

    /**
    * Clamp the offset.
    *
    * @private
    * @param {Vector2} offset - The offset.
    * @returns {Vector2} The clamped offset.
    */
    _clampOffset (offset) {
        if (this._bounds === null) {
            return offset;
        }
        
        var position = this._calculatePosition(this.offset, this.center, this.scene.origin, this.transformation);
        var clampedPosition = new Vector2(clamp(position.x, this.minPositionX, this.maxPositionX), clamp(position.y, this.minPositionY, this.maxPositionY));
        
        return this._calculateOffset(clampedPosition, this.center, this.scene.origin, this.transformation);
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
    * Render debug info.
    *
    * @private
    */
    _renderDebug () {
        if (this.debug && this.debugView) {
            this.debugView.update();
        }
    }

    /**
    * Render the dimensions/size.
    *
    * @private
    */
    _renderSize () {
        if (this.view) {
            TweenMax.set(this.view, { 
                css: { 
                    height: this.height,
                    width: this.width 
                }
            });
        }
    }
    
    _updateBounds (value) { 
        value = (value === undefined) ? this._bounds : value;
        
        var bounds;
        var offsetBounds;
        
        if (this.scene) {
            if (!value) {
                bounds = {
                    minX: null,
                    minY: null,
                    maxX: null,
                    maxY: null
                };
            }
            else if (isFunction(value)) {
                bounds = value.call(this);
            }
            else {
                bounds = value;
            }

            this.minPositionX = bounds.minX;
            this.minPositionY = bounds.minY;
            this.maxPositionX = bounds.maxX;
            this.maxPositionY = bounds.maxY;

            // TODO: For dev only
            console.log('update bounds');
        }
    }
    
    /**
    * Adds an animation to the camera.
    *
    * @param {string} name - The name.
    * @param {Oculo.Animation} animation - The animation.
    * @returns {this} self
    */
    addAnimation (name, animation) {
        this.animations.add(name, animation);
        
        return this;
    }
    
    /**
    * Adds a scene to the camera.
    *
    * @param {string} name - The name.
    * @param {string|Oculo.Scene} scene - The scene.
    * @returns {this} self
    */
    addScene (name, scene) {
        this.scenes.add(name, scene);
        
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
        this.scenes.destroy();
        
        if (this.trackControl) {
            this.trackControl.destroy();
        }
        
        this.stopListening();
        
        return this;
    }
    
    /**
    * Disables drag-to-move.
    *
    * @returns {this} self
    */
    disableDragToMove () {
        if (this.trackControl) {
            this.trackControl.disableDrag();
        }
        
        return this;
    }

    /**
    * Enables drag-to-move.
    *
    * @returns {this} self
    */
    enableDragToMove () {
        if (this.trackControl) {
            this.trackControl.enableDrag();
        }

        return this;
    }
    
    /**
    * Disables wheel-to-zoom.
    *
    * @returns {this} self
    */
    disableWheelToZoom () {
        if (this.trackControl) {
            this.trackControl.disableWheel();
        }
        
        return this;
    }

    /**
    * Enables wheel-to-zoom.
    *
    * @returns {this} self
    */
    enableWheelToZoom () {
        if (this.trackControl) {
            this.trackControl.enableWheel();
        }

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
            if (this.debug && this.debugView) {
                this.debugView.render().attach(document.body);
            }
            
            this.isRendered = true;
        }

        this._renderSize();
        
        if (this.scene) {
            if (this.scene.view) {
                this.scene.view.style.display = 'block';
            }
            
            this._updateBounds();
            this.animations.play(new Oculo.Animation(this, { paused: false }).animate({
                position: this.position,
                origin: this.scene.origin,
                rotation: this.rotation,
                zoom: this.zoom
            }, 0));
        }

        this.onRender();

        return this;
    }

    /**
    * Sets the active scene.
    *
    * @returns {this} self
    */
    setScene (name) {
        if (this.scene && this.scene.view && this.scene.view.parentNode) {
            this.scene.view.parentNode.removeChild(this.scene.view);
            this.scene.view.style.display = 'none';
        }
        
        if (this.trackControl) {
            this.trackControl.destroy();
        }
        
        this.scenes.setActiveScene(name);
        this._updateBounds();
        
        if (this.scene.view) {
            this.view.appendChild(this.scene.view);
            
            if (this.dragToMove || this.wheelToZoom) {
                this.trackControl = new TrackControl(this, {
                    draggable: this.dragToMove,
                    onDrag: function (camera) {
                        var position = camera._calculatePosition(new Vector2(-this.x, -this.y), camera.center, camera.scene.origin, camera.transformation);
                        camera.animations.play(new Oculo.Animation(camera, { paused: false }).moveTo(position, 0));
                    },
                    wheelable: this.wheelToZoom,
                    onWheel: function (camera) {
                        var velocity = Math.abs(this.wheelEvent.deltaY);
                        var direction = this.wheelEvent.deltaY > 0 ? Camera.zoomDirection.OUT : Camera.zoomDirection.IN;
                        var previousDirection = this.previousWheelEvent.deltaY > 0 ? Camera.zoomDirection.OUT : Camera.zoomDirection.IN;
                        var cameraRect;
                        var cameraContextPosition = new Vector2();
                        var sceneContextPosition = new Vector2();
                        var origin = camera.scene.origin;
                        var zoom = camera.zoom + camera.zoom * camera.wheelToZoomIncrement * (velocity > 1 ? velocity * 0.5 : 1) * (direction === Camera.zoomDirection.IN ? 1 : -1);

                        // Performance Optimization: If zoom has not changed because it's at the min/max, don't zoom.
                        if (direction === previousDirection && camera._clampZoom(zoom) !== camera.zoom) { 
                            cameraRect = camera.view.getBoundingClientRect();
                            cameraContextPosition.set(this.wheelEvent.clientX - cameraRect.left, this.wheelEvent.clientY - cameraRect.top);
                            sceneContextPosition = camera._calculatePosition(camera.offset, cameraContextPosition, camera.scene.origin, camera.transformation);

                            if (Math.round(origin.x) !== Math.round(sceneContextPosition.x) || Math.round(origin.y) !== Math.round(sceneContextPosition.y)) {
                                origin = camera._calculatePosition(camera.offset, cameraContextPosition, camera.scene.origin, camera.transformation);
                            }

                            camera.animations.play(new Oculo.Animation(camera, { paused: false }).zoomAt(origin, zoom, 0));
                        }
                    }
                });
            }
        }

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
            hasChanged = true;
        }
        
        if (!isNil(height) && (height !== this.height)) {
            this.height = height;
            hasChanged = true;
        }

        if (hasChanged) {
            this._renderSize();
            this.trigger('change:size');
            this._renderDebug();
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
        this._renderDebug();

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
    * Immediately animate the camera.
    *
    * @see {@link Camera.Animation#animate|Animation.animate}
    * @returns {this} self
    */
    animate (props, duration, options) {
        this.animations.play(new Oculo.Animation(this, { paused: false }).animate(props, duration, options));

        return this;
    }

    /**
    * Immediately move to a specific position.
    *
    * @see {@link Camera.Animation#moveTo|Animation.moveTo}
    * @returns {this} self
    */
    moveTo (position, duration, options) {
        this.animations.play(new Oculo.Animation(this, { paused: false }).moveTo(position, duration, options));

        return this;
    }

    /**
    * Immediately rotate at the specified location.
    *
    * @see {@link Camera.Animation#rotateAt|Animation.rotateAt}
    * @returns {this} self
    */
    rotateAt (origin, rotation, duration, options) {
        this.animations.play(new Oculo.Animation(this, { paused: false }).rotateAt(origin, rotation, duration, options));

        return this;
    }

    /**
    * Immediately rotate at the current position.
    *
    * @see {@link Camera.Animation#rotateTo|Animation.rotateTo}
    * @returns {this} self
    */
    rotateTo (rotation, duration, options) {
        this.animations.play(new Oculo.Animation(this, { paused: false }).rotateTo(rotation, duration, options));

        return this;
    }

    /**
    * Immediately shake the camera.
    *
    * @see {@link Camera.Animation#shake|Animation.shake}
    * @returns {this} self
    */
    shake (intensity, duration, direction, options) {
        this.animations.play(new Oculo.Animation(this, { paused: false }).shake(intensity, duration, direction, options));

        return this;
    }

    /**
    * Immediately zoom in/out at a specific location.
    *
    * @see {@link Camera.Animation#zoomAt|Animation.zoomAt}
    * @returns {this} self
    */
    zoomAt (origin, zoom, duration, options) {
        this.animations.play(new Oculo.Animation(this, { paused: false }).zoomAt(origin, zoom, duration, options));

        return this;
    }

    /**
    * Immediately zoom in/out at the current position.
    *
    * @see {@link Camera.Animation#zoomTo|Animation.zoomTo}
    * @returns {this} self
    */
    zoomTo (zoom, duration, options) {
        this.animations.play(new Oculo.Animation(this, { paused: false }).zoomTo(zoom, duration, options));

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

/**
* Enum for zoom direction.
* @enum {number}
* @memberof constants
*/
Camera.zoomDirection = {
    /**
    * Zoom in.
    * @readonly
    */
    IN: 1,
    /**
    * Zoom out.
    * @readonly
    */
    OUT: 0
};

export default Camera;