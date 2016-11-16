'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/
    
import clamp        from 'lodash/clamp';
import isElement    from 'lodash/isElement';
import isFinite     from 'lodash/isFinite';
import isFunction   from 'lodash/isFunction';
import isNil        from 'lodash/isNil';
import isObject     from 'lodash/isObject';
import isString     from 'lodash/isString';
import Backbone     from 'backbone';
import _Math        from './math/math';
import Matrix2      from './math/matrix2';
import Scene        from './scene';
import TrackControl from './trackControl';
import Utils        from './utils';
import Vector2      from './math/vector2';

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
        
        // Compose object
        Object.assign(this, Backbone.Events);
        
        /**
        * @property {object} - The initial configuration of the camera.
        */
        this.config = options || {};
        
//        /**
//        * The debugging information view.
//        * @property {Backbone.View} - The debugging information view.
//        */
//        this.debugView = new DebugView({
//            model: this,
//            className: 'oculo-debug'
//        });
        
        /**
        * @property {Oculo.Animation} - The active camera animation.
        */
        this.animation = null;

        /**
        * @property {Object} - An object for storing camera animations.
        */
        this.animations = {};
        
        /**
        * @private
        * @property {null|function|Object} - The internally managed bounds.
        */
        this._bounds;
        
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
        * @default
        */
        this.isRendered = false;

        /**
        * @property {boolean} - Whether the scene is shaking or not.
        * @default
        */
        this.isShaking = false;

        /**
        * @property {number} - The maximum offset after bounds are applied. 
        * @readonly
        */
        this.maxOffset = new Vector2(null, null);
        
        /**
        * The maximum value the scene can be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 3
        */
        this.maxZoom = options.maxZoom || 3;
        
        /**
        * @property {number} - The minimum offset after bounds are applied. 
        * @readonly
        */
        this.minOffset = new Vector2(null, null);

        /**
        * The minimum value the scene can be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 0.5
        */
        this.minZoom = options.minZoom || 0.5;

        /**
        * @property {Vector2} - The offset on the scene.
        * @default
        */
        this.offset = new Vector2();

        /**
        * @property {number} - The amount of rotation in degrees.
        * @default
        */
        this.rotation = options.rotation || 0;

        /**
        * The scene which the camera is viewing.
        * @property {Oculo.Scene}
        */
        this.scene = new Scene(options.scene);
        
        /**
        * @property {number} - The shake intensity. A value between 0 and 1.
        */
        this.shakeIntensity = 0;

        /**
        * @property {boolean} - Whether the camera should shake on the x axis.
        * @default
        */
        this.shakeHorizontal = true;

        /**
        * @property {boolean} - Whether the camera should shake on the y axis.
        * @default
        */
        this.shakeVertical = true;

        /**
        * @property {TrackControl} - The track control.
        * @default
        */
        this.trackControl = null;
        
        /**
        * @private
        * @property {Element} - The internally managed view.
        */
        this._view = null;

        /**
        * @property {boolean} - Whether wheeling can be used to zoom or not.
        * @default false
        */
        this.wheelToZoom = options.wheelToZoom ? true : false;
        
        /**
        * The base increment at which the scene will be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 0.01
        */
        this.wheelToZoomIncrement = options.wheelToZoomIncrement || 0.01;
        
        /**
        * The width.
        * @property {number} - The width.
        * @default 0
        */
        this.width = options.width || 0;

        /**
        * The height.
        * @property {number} - The height.
        * @default 0
        */
        this.height = options.height || 0;
        
        /**
        * @private
        * @property {number} - The internally managed zoom.
        */
        this._zoom;

        // Initialize custom events and behaviors
        this.onResize = () => {
            if (this.view) {
                var wasAnimating = this.isAnimating;
                var wasPaused = this.isPaused;

                // Maintain camera position and update any active animations
                if (this.isAnimating) {
                    this.pause();
                }

                new Oculo.Animation(this, { 
                    paused: false, 
                    onComplete: function (wasAnimating, wasPaused) {
                        // 'this' is bound to the Animation via the Animation class
                        if (this.camera.isAnimating) {
                            var inProgressTimeline, tween, endProps, endOffset;

                            inProgressTimeline = this.camera.animation.getChildren(false, false, true).filter((timeline) => {
                                var progress = timeline.progress();
                                return progress > 0 && progress < 1;
                            })[0];

                            tween = inProgressTimeline.getChildren(false, true, false)[0];

                            if (tween.data.isMoving) {
                                endProps = this._calculateEndProps(tween.data.parsedOrigin, tween.data.parsedPosition, tween.data.parsedRotation, tween.data.parsedZoom, this.camera);
                                endOffset = endProps.endOffset || {};
                                Object.assign(tween.data, endProps);
                                
                                // TODO: for dev only
                                console.log('tween data after resize: ', tween.data);
                                tween.updateTo({
                                    zoom: endProps.endZoom,
                                    rotation: endProps.endRotation,
                                    offsetX: endOffset.x,
                                    offsetY: endOffset.y
                                });
                            }
                        }

                        if (wasAnimating && !wasPaused) {
                            this.camera.resume();
                        }
                    },
                    onCompleteParams: [wasAnimating, wasPaused]
                }).moveTo(this.position, 0, { overwrite: false });
            }
        }
        
        // Initialize properties with setters (in the correct order)
        this.zoom = options.zoom || 1;
        this.bounds = options.bounds || Camera.bounds.NONE;
        this.view = options.view;
        options.position = Utils.parsePosition(options.position, this.scene.view) || {};
        var offset = this._calculateOffset(new Vector2(options.position.x || 0, options.position.y || 0), this.viewportCenter, this.scene.origin, this.sceneTransformation);
        this.offsetX = offset.x;
        this.offsetY = offset.y;
        
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
    *   maxX: this.sceneWidth, 
    *   maxY: this.sceneHeight
    * }
    *
    * @example <caption>As a function that returns a bounds object</caption>
    * function () { 
    *   var transformation = new Matrix2().scale(this.zoom, this.zoom).getInverse();
    *   var min = new Vector2().add(this.viewportCenter).transform(transformation);
    *   var max = new Vector2(this.sceneScaledWidth, this.sceneScaledHeight).subtract(this.viewportCenter).transform(transformation);
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
    * @name Camera#isAnimating
    * @property {boolean} - Whether the scene is animating or not.
    * @readonly
    */
    get isAnimating () {
        var progress = this.animation ? this.animation.progress() : 0;
        return progress > 0 && progress < 1;
    }
    
    /**
    * @name Camera#isPaused
    * @property {boolean} - Whether the camera is paused or not.
    * @readonly
    */
    get isPaused () {
        return this.animation ? this.animation.paused() : false;
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
    * @name Camera#offsetX
    * @property {number} - The camera's X offset on the scene.
    */
    get offsetX () {
        return this.offset.x;
    }

    set offsetX (value) {
        this.offset.x = clamp(value, this.minOffset.x, this.maxOffset.x);
    }

    /**
    * @name Camera#offsetY
    * @property {number} - The camera's Y offset on the scene.
    */
    get offsetY () {
        return this.offset.y;
    }

    set offsetY (value) {
        this.offset.y = clamp(value, this.minOffset.y, this.maxOffset.y);
    }
    
    /**
    * @name Camera#position
    * @property {Vector2} - The camera's position within the world.
    * @readonly
    */
    get position () {
        return this._calculatePosition(this.offset, this.viewportCenter, this.scene.origin, this.sceneTransformation);
    }
    
    /**
    * @name Camera#sceneOriginX
    * @property {number} - The X value of the transformation origin.
    * @readonly
    */
    get sceneOriginX () {
        return this.scene.origin.x;
    }
    
    /**
    * @name Camera#sceneOriginY
    * @property {number} - The Y value of the transformation origin.
    * @readonly
    */
    get sceneOriginY () {
        return this.scene.origin.y;
    }
    
    /**
    * @name Camera#sceneWidth
    * @property {number} - The width of the scene.
    * @readonly
    */
    get sceneWidth () {
        return this.scene.width;
    }

    /**
    * @name Camera#sceneHeight
    * @property {number} - The height of the scene.
    * @readonly
    */
    get sceneHeight () {
        return this.scene.height;
    }
    
    /**
    * @name Camera#sceneScaledHeight
    * @property {number} - The scaled width of the scene.
    * @readonly
    */
    get sceneScaledWidth () {
        return this.scene.width * this.zoom;
    }

    /**
    * @name Camera#sceneScaledHeight
    * @property {number} - The scaled height of the scene.
    * @readonly
    */
    get sceneScaledHeight () {
        return this.scene.height * this.zoom;
    }
    
    /**
    * @name Camera#sceneTransformation
    * @property {Matrix2} - The transformation of the scene.
    * @readonly
    */
    get sceneTransformation () {
        return new Matrix2().scale(this.zoom, this.zoom).rotate(_Math.degToRad(-this.rotation));
    }
    
    /**
    * @name Camera#view
    * @property {Element} - The view.
    */
    get view () {
        return this._view;
    }

    set view (value) {
        if (this.trackControl) {
            this.trackControl.destroy();
        }

        this._view = Utils.DOM.parseView(value);

        if (this._view) {
            this._view.appendChild(this.scene.view);

            if (this.dragToMove || this.wheelToZoom) {
                this.trackControl = new TrackControl(this, {
                    draggable: this.dragToMove,
                    onDrag: function (camera) {
                        camera.offsetX = -this.x;
                        camera.offsetY = -this.y;

                        if (camera.hasBounds) {
                            // Manually tween draggable to consistently enforce bounds based on camera position
                            TweenMax.set(this.target, { 
                                css: { 
                                    x: -camera.offset.x, 
                                    y: -camera.offset.y
                                }
                            });
                        }

                        camera._renderDebug();
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
                            sceneContextPosition = camera._calculatePosition(camera.offset, cameraContextPosition, camera.scene.origin, camera.sceneTransformation);

                            if (Math.round(origin.x) !== Math.round(sceneContextPosition.x) || Math.round(origin.y) !== Math.round(sceneContextPosition.y)) {
                                origin = camera._calculatePosition(camera.offset, cameraContextPosition, camera.scene.origin, camera.sceneTransformation);
                            }

                            camera.animation = new Oculo.Animation(camera, { paused: false }).zoomAt(origin, zoom, 0);
                        }
                    }
                });
            }
        }
    }
    
    /**
    * @name Camera#viewportCenter
    * @property {Vector2} - The camera's center point.
    * @readonly
    */
    get viewportCenter () {
        return new Vector2(this.viewportWidth, this.viewportHeight).multiplyScalar(0.5);
    }

    /**
    * @name Camera#viewportCenterX
    * @property {number} - The x coordinate of the camera's center point.
    * @readonly
    */
    get viewportCenterX () {
        return this.viewportCenter.x;
    }

    /**
    * @name Camera#viewportCenterY
    * @property {number} - The y coordinate of the camera's center point.
    * @readonly
    */
    get viewportCenterY () {
        return this.viewportCenter.y;
    }
    
    /**
    * @name Camera#viewportWidth
    * @property {number} - The width of the viewport.
    * @readonly
    */
    get viewportWidth () {
        return this.width;
    }

    /**
    * @name Camera#viewportHeight
    * @property {number} - The height of the viewport.
    * @readonly
    */
    get viewportHeight () {
        return this.height;
    }
    
    /**
    * @name Camera#x
    * @property {number} - The camera's X position within the world.
    */
    get x () {
        return this.position.x;
    }

    set x (value) {
        this.position.x = value;
    }

    /**
    * @name Camera#y
    * @property {number} - The camera's Y position within the world.
    */
    get y () {
        return this.position.y;
    }

    set y (value) {
        this.position.y = value;
    }
    
    /**
    * @name Camera#zoom
    * @property {number} - The amount of zoom. A ratio where 1 = 100%.
    * @default 1
    */
    get zoom () {
        return this._zoom;
    }
        
    set zoom (value) {
        this._zoom = this._clampZoom(value);
        this._updateBounds();
    };
    
    _markPoint (x, y) {
        var pointElement = document.getElementById('point');
        var point = new Vector2(x, y).transform(new Matrix2().scale(this.zoom, this.zoom).rotate(_Math.degToRad(-this.rotation)));

        pointElement.style.top = (point.y - 2) + 'px';
        pointElement.style.left = (point.x - 2) + 'px';
    }

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
    * Clamp the zoom.
    *
    * @private
    * @param {number} value - A zoom value.
    * @returns {number} The clamped zoom value.
    */
    _clampZoom (value) {
        return clamp(value, this.minZoom, this.maxZoom);
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
        if (this._view) {
            TweenMax.set(this._view, { 
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
        
        this.minOffset.copy(this._calculateOffset(new Vector2(bounds.minX, bounds.minY), this.viewportCenter, this.scene.origin, this.sceneTransformation));
        this.maxOffset.copy(this._calculateOffset(new Vector2(bounds.maxX, bounds.maxY), this.viewportCenter, this.scene.origin, this.sceneTransformation));
        
        // Set the offset to apply bounds
        this.offsetX = this.offset.x;
        this.offsetY = this.offset.y;
    }
    
    /**
    * Adds an animation to the camera.
    *
    * @param {Oculo.Animation} animation - The animation.
    * @param {string} name - The name.
    * @returns {this} self
    */
    addAnimation (name, animation) {
        animation.camera = this;
        this.animations[name] = animation;
        
        return this;
    }
    
    /**
    * Removes an animation from the camera.
    *
    * @param {string} name - The name.
    * @returns {this} self
    */
    removeAnimation (name) {
        this.animations[name].camera = null;
        delete this.animations[name];
        
        return this;
    }
    
//    /**
//    * Applies bounds to the camera.
//    *
//    * @param {Vector2} position - The postion of the camera.
//    * @param {null|function|Object} [newBounds] - The new bounds to be applied.
//    * @returns {this} self
//    */
//    applyBounds (position, newBounds) {
//        position = position || this.position;
//
//        if (newBounds !== undefined) {
//            this.bounds = newBounds;
//        }
//
//        if (this.hasBounds) {
//            this.position.set(clamp(position.x, this.minX, this.maxX), clamp(position.y, this.minY, this.maxY));
//            this.offset.copy(this._calculateOffset(this.position, this.viewportCenter, this.scene.origin, this.sceneTransformation));
//        }
//
//        return this;
//    }
    
    /**
    * Destroys the camera and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        this.stopListening();
        
        for (let key in this.animations) {
            this.animations[key].destroy();
        }
        
        // TODO: Remove event handlers attached by trackControls
        if (this.trackControl) {
            this.trackControl.destroy();
        }
        
        if (this.view) {
            this.view.parentNode.removeChild(this.view);
        }
        
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
    * Render the camera view. This method is not meant to be overridden. If you need to manipulate how the camera renders, use {@link Camera#onBeforeRender|onBeforeRender} and {@link Camera#onRender|onRender}.
    *
    * @returns {Camera} The view.
    */
    render (animation) {
        this.onBeforeRender();

        if (!this.isRendered) {
            if (this.debug && this.debugView) {
                this.debugView.render().attach(document.body);
            }

            this.isRendered = true;
        }

        if (isString(animation)) {
            this.animation = this.animations[animation];
            this.animation.invalidate().restart(false, false);
        }
        else if (animation) {
            this.animation = animation;
            animation.invalidate().restart(false, false);
        }
        else {
            this._renderSize();
            this.animation = new Oculo.Animation(this, { paused: false }).animate({
                position: this.position,
                origin: this.scene.origin,
                rotation: this.rotation,
                zoom: this.zoom
            }, 0);
        }

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
        this.animation.pause();
        this._renderDebug();

        return this;
    }

    /**
    * Plays the camera animation forward from the current playhead position.
    *
    * @see {@link external:TimelineMax|TimelineMax}
    * @returns {this} self
    */
    play () {
        this.animation.play();

        return this;
    }
    
    /**
    * Resumes playing the camera animation from the current playhead position.
    *
    * @see {@link external:TimelineMax|TimelineMax}
    * @returns {this} self
    */
    resume () {
        this.animation.resume();

        return this;
    }

    /**
    * 
    *
    * @see {@link Camera.Animation#animate|Animation.animate}
    * @returns {this} self
    */
    animate (props, duration, options) {
        this.animation = new Oculo.Animation(this, { paused: false }).animate(props, duration, options);

        return this;
    }

    /**
    * 
    *
    * @see {@link Camera.Animation#moveTo|Animation.moveTo}
    * @returns {this} self
    */
    moveTo (position, duration, options) {
        this.animation = new Oculo.Animation(this, { paused: false }).moveTo(position, duration, options);

        return this;
    }

    /**
    * 
    *
    * @see {@link Camera.Animation#rotateAt|Animation.rotateAt}
    * @returns {this} self
    */
    rotateAt (origin, rotation, duration, options) {
        this.animation = new Oculo.Animation(this, { paused: false }).rotateAt(origin, rotation, duration, options);

        return this;
    }

    /**
    * 
    *
    * @see {@link Camera.Animation#rotateTo|Animation.rotateTo}
    * @returns {this} self
    */
    rotateTo (rotation, duration, options) {
        this.animation = new Oculo.Animation(this, { paused: false }).rotateTo(rotation, duration, options);

        return this;
    }

    /**
    * 
    *
    * @see {@link Camera.Animation#shake|Animation.shake}
    * @returns {this} self
    */
    shake (intensity, duration, direction, options) {
        this.animation = new Oculo.Animation(this, { paused: false }).shake(intensity, duration, direction, options);

        return this;
    }

    /**
    * 
    *
    * @see {@link Camera.Animation#zoomAt|Animation.zoomAt}
    * @returns {this} self
    */
    zoomAt (origin, zoom, duration, options) {
        this.animation = new Oculo.Animation(this, { paused: false }).zoomAt(origin, zoom, duration, options);

        return this;
    }

    /**
    * Zooms in/out at the current position.
    *
    * @see {@link Camera.Animation#zoomTo|Animation.zoomTo}
    * @returns {this} self
    */
    zoomTo (zoom, duration, options) {
        this.animation = new Oculo.Animation(this, { paused: false }).zoomTo(zoom, duration, options);

        return this;
    }
}

Camera.bounds = {
    NONE: null,
    WORLD: function () {
        var transformation = new Matrix2().scale(this.zoom, this.zoom).getInverse();
        var min = new Vector2().add(this.viewportCenter).transform(transformation);
        var max = new Vector2(this.sceneScaledWidth, this.sceneScaledHeight).subtract(this.viewportCenter).transform(transformation);

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
            maxX: this.sceneWidth,
            maxY: this.sceneHeight
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