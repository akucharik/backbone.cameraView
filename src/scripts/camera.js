'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* The Backbone library.
* @external Backbone
* @see http://backbonejs.org
*/

/**
* Backbone.Events
* @name Events
* @memberof external:Backbone
* @see http://backbonejs.org/#Events
*/

/**
* The Lodash library.
* @external Lodash
* @see http://lodash.com
*/

/**
* The Zepto library.
* @external Zepto
* @see http://zeptojs.com
*/

/**
* GSAP's TweenMax.
* @external TweenMax
* @see http://greensock.com/docs/#/HTML5/GSAP/TweenMax/
*/

/**
* GSAP's TimelineMax.
* @external TimelineMax
* @see http://greensock.com/docs/#/HTML5/GSAP/TimelineMax/
*/

/**
* GSAP's Easing.
* @external Easing
* @see http://greensock.com/docs/#/HTML5/GSAP/Easing/
*/
    
import clamp      from 'lodash/clamp';
import isElement  from 'lodash/isElement';
import isFinite   from 'lodash/isFinite';
import isFunction from 'lodash/isFunction';
import isNil      from 'lodash/isNil';
import isObject   from 'lodash/isObject';
import isString   from 'lodash/isString';
import Backbone   from 'backbone';
import _Math      from './math/math';
import Matrix2    from './math/matrix2';
import Scene      from './scene';
import Utils      from './utils';
import Vector2    from './math/vector2';

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
* @param {number} [options.zoomIncrement] - The base {@link Camera.zoomIncrement|zoom increment}.
*/
class Camera {
    constructor (options) {
        options = options || {};
        
        // Compose object
        Object.assign(this, Backbone.Events);
        
        /**
        * The initial configuration of the camera.
        * @property {Oculo.Scene}
        */
        this.config = options || {};

        /**
        * The scene which the camera is viewing.
        * @property {Oculo.Scene}
        */
        this.scene = new Scene(options.scene);

        options.position = Utils.parsePosition(options.position, this.scene.view);
        
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
        * @property {Object} - An object containing of all current and future animations.
        */
        this.animations = {};

        /**
        * @property {Object} - Whether the camera is in debug mode or not.
        * @default false
        */
        this.debug = options.debug ? true : false;

//        /**
//        * The default ease.
//        * @name Camera#defaultEase
//        * @property {Object} - Gets or sets the default ease.
//        */
//        Object.defineProperty(this, 'defaultEase', {
//            get: function () {
//                return TweenLite.defaultEase;
//            },
//
//            set: function (value) {
//                TweenLite.defaultEase = value;
//            }
//        });
//
//        this.defaultEase = options.defaultEase || Power2.easeOut;

        /**
        * Whether the scene is animating or not.
        * @name Camera#isAnimating
        * @property {boolean} - Gets whether the scene is animating or not.
        */
        Object.defineProperty(this, 'isAnimating', {
            get: function () {
                var progress = this.animation ? this.animation.progress() : 0;
                return progress > 0 && progress < 1;
            }
        });

        /**
        * @property {boolean} - Whether the camera's position is draggable or not.
        * @default false
        */
        this.isDraggable = options.draggable ? true : false;

        /**
        * @property {boolean} - Whether the camera's drag capability is enabled or not.
        * @default false
        */
        Object.defineProperty(this, 'isDragEnabled', {
            get: function () {
                return this.draggable ? this.draggable.enabled() : false;
            }
        });

        /**
        * @property {boolean} - Whether the camera is being dragged or not.
        * @default false
        */
        this.isDragging = false;

        /**
        * Whether the camera is paused or not.
        * @name Camera#isPaused
        * @property {boolean} - Gets whether the camera is paused or not.
        */
        Object.defineProperty(this, 'isPaused', {
            get: function () {
                return this.animation ? this.animation.paused() : false;
            }
        });

        /**
        * @property {boolean} - Whether the camera is pressed or not.
        * @default
        */
        this.isPressed = false;

        /**
        * @property {boolean} - Whether the camera has been rendered or not.
        * @default
        */
        this.isRendered = false;

        /**
        * Whether the camera is rotated or not.
        * @name Camera#isRotated
        * @property {number} - Gets whether the camera is rotated or not.
        */
        Object.defineProperty(this, 'isRotated', {
            get: function () {
                return this.rotation !== 0;
            }
        });

        /**
        * @property {boolean} - Whether the scene is shaking or not.
        * @default
        */
        this.isShaking = false;

        /**
        * @property {boolean} - Whether the scene has an active CSS transition or not.
        * @default
        */
        this.isTransitioning = false;

        /**
        * @property {boolean} - Whether the camera is manually zoomable or not.
        * @default false
        */
        this.isManualZoomable = options.manualZoomable ? true : false;    

        /**
        * @property {boolean} - Whether the manual zoom is enabled or not.
        * @default false
        */
        this.isManualZoomEnabled = options.manualZoomable ? true : false; 

        /**
        * Whether the camera is zoomed or not.
        * @name Camera#isZoomed
        * @property {number} - Gets whether the camera is zoomed or not.
        */
        Object.defineProperty(this, 'isZoomed', {
            get: function () {
                return this.zoom !== 1;
            }
        });

        /**
        * The maximum value the scene can be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 3
        */
        this.maxZoom = isFinite(options.maxZoom) ? options.maxZoom : 3;

        /**
        * The minimum value the scene can be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 0.5
        */
        this.minZoom = isFinite(options.minZoom) ? options.minZoom : 0.5;

        /**
        * @property {Vector2} - The offset on the scene.
        * @default
        */
        this.offset = new Vector2();

        /**
        * The camera's X offset on the scene.
        * @name Camera#x
        * @property {number} - Gets or sets the camera's X offset on the scene.
        */
        Object.defineProperty(this, 'offsetX', {
            get: function () {
                return this.offset.x;
            },

            set: function (value) {
                this.offset.x = value;
            }
        });

        /**
        * The camera's Y offset on the scene.
        * @name Camera#y
        * @property {number} - Gets or sets the camera's Y offset on the scene.
        */
        Object.defineProperty(this, 'offsetY', {
            get: function () {
                return this.offset.y;
            },

            set: function (value) {
                this.offset.y = value;
            }
        });

        /**
        * @property {Vector2} - The position within the world.
        * @default
        */
        this.position = new Vector2(options.position.x, options.position.y);

        /**
        * The camera's X position within the world.
        * @name Camera#x
        * @property {number} - Gets or sets the camera's X position within the world.
        */
        Object.defineProperty(this, 'x', {
            get: function () {
                return this.position.x;
            },

            set: function (value) {
                this.position.x = value;
            }
        });

        /**
        * The camera's Y position within the world.
        * @name Camera#y
        * @property {number} - Gets or sets the camera's Y position within the world.
        */
        Object.defineProperty(this, 'y', {
            get: function () {
                return this.position.y;
            },

            set: function (value) {
                this.position.y = value;
            }
        });

        /**
        * @property {number} - The amount of rotation in degrees.
        * @default
        */
        this.rotation = options.rotation || 0;

        /**
        * The X value of the transformation origin.
        * @name Camera#sceneOriginX
        * @property {number} - Gets the X value of the transformation origin.
        */
        Object.defineProperty(this, 'sceneOriginX', {
            get: function () {
                return this.scene.origin.x;
            }
        });

        /**
        * The Y value of the transformation origin.
        * @name Camera#sceneOriginY
        * @property {number} - Gets the Y value of the transformation origin.
        */
        Object.defineProperty(this, 'sceneOriginY', {
            get: function () {
                return this.scene.origin.y;
            }
        });

        /**
        * The width of the scene.
        * @name Camera#sceneWidth
        * @property {number} - Gets the width of the scene.
        */
        Object.defineProperty(this, 'sceneWidth', {
            get: function () {
                return this.scene.width;
            }
        });

        /**
        * The height of the scene.
        * @name Camera#sceneHeight
        * @property {number} - Gets the height of the scene.
        */
        Object.defineProperty(this, 'sceneHeight', {
            get: function () {
                return this.scene.height;
            }
        });

        /**
        * The scaled width of the scene.
        * @name Camera#sceneScaledHeight
        * @property {number} - Gets the scaled width of the scene.
        */
        Object.defineProperty(this, 'sceneScaledWidth', {
            get: function () {
                return this.scene.width * this.zoom;
            }
        });

        /**
        * The scaled height of the scene.
        * @name Camera#sceneScaledHeight
        * @property {number} - Gets the scaled height of the scene.
        */
        Object.defineProperty(this, 'sceneScaledHeight', {
            get: function () {
                return this.scene.height * this.zoom;
            }
        });

        /**
        * The transformation of the scene.
        * @name Camera#sceneTransformation
        * @property {Matrix2} - Gets the transformation of the scene.
        */
        Object.defineProperty(this, 'sceneTransformation', {
            get: function () {
                return new Matrix2().scale(this.zoom, this.zoom).rotate(_Math.degToRad(-this.rotation));
            }
        });

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

        this._view = null;
        
        /**
        * @property {Element} - The view.
        */
        Object.defineProperty(this, 'view', {
            get: function () {
                return this._view;
            },

            set: function (value) {
                this._view = Utils.DOM.parseView(value);
                
                if (this._view) {
                    this._view.appendChild(this.scene.view);
                    
                    this._view.addEventListener('dragstart', this.onDragstart);
                    this._view.addEventListener('mousedown', this.onPress);
                    this._view.addEventListener('mouseup', this.onRelease);
                    this._view.addEventListener('mouseleave', this.onLeave);
                    this._view.addEventListener('touchstart', this.onPress);
                    this._view.addEventListener('touchend', this.onRelease);
                    this._view.addEventListener('touchcancel', this.onRelease);
                    this._view.addEventListener('transitionend', this.onTransitionEnd);

                    // TODO: Add enableDrag/disableDrag to camera and toggle style
                    if (this.isDraggable && this.isDragEnabled) {
                        this._view.style.cursor = 'move';
                    }

                    if (this.isManualZoomable) {
                        this._view.addEventListener('wheel', this.onZoomWheel);
                    }
                }
            }
        });
        
        this.view = options.view;
        
        /**
        * The center point.
        * @name Camera#center
        * @property {Vector2} - Gets the camera's center point.
        */
        Object.defineProperty(this, 'viewportCenter', {
            get: function () {
                return new Vector2(this.viewportWidth, this.viewportHeight).multiplyScalar(0.5);
            }
        });

        /**
        * The x coordinate of the center point.
        * @name Camera#centerX
        * @property {number} - Gets the x coordinate of the camera's center point.
        */
        Object.defineProperty(this, 'viewportCenterX', {
            get: function () {
                return this.viewportCenter.x;
            }
        });

        /**
        * The y coordinate of the center point.
        * @name Camera#centerY
        * @property {number} - Gets the y coordinate of the camera's center point.
        */
        Object.defineProperty(this, 'viewportCenterY', {
            get: function () {
                return this.viewportCenter.y;
            }
        });

        /**
        * The width of the viewport.
        * @name Camera#viewportWidth
        * @property {number} - Gets the viewport's width. Excludes the element's border.
        */
        Object.defineProperty(this, 'viewportWidth', {
            get: function () {
                return this.width;
            }
        });

        /**
        * The height of the viewport.
        * @name Camera#viewportHeight
        * @property {number} - Gets the viewport's height. Excludes the element's border.
        */
        Object.defineProperty(this, 'viewportHeight', {
            get: function () {
                return this.height;
            }
        });

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
        * The base increment at which the scene will be zoomed.
        * @property {number} - See {@link Camera.zoom|zoom}.
        * @default 0.01
        */
        this.zoomIncrement = isFinite(options.zoomIncrement) ? options.zoomIncrement : 0.01;

        /**
        * @property {number} - The amount of zoom. A ratio where 1 = 100%.
        * @default
        */
        this.zoom = options.zoom || 1;

        /**
        * The internally managed bounds.
        *
        * @private
        * @property {null|function|Object} - The camera's bounds.
        */
        this._bounds = null;

        /**
        * The camera's bounds. The minimum and maximum position values for the camera. Set to null if no bounds are desired.
        *
        * @name Camera#bounds
        * @property {null|function|Object} - Gets or sets the bounds.
        * @default The size of the scene/world.
        *
        * @example <caption>As a bounds object</caption>
        * { 
        *   minX: 0, 
        *   minY: 0, 
        *   maxX: this.sceneWidth, 
        *   maxY: this.sceneHeight
        * }
        * @example <caption>As a function that returns a bounds object</caption>
        * function () { 
        *   return { 
        *     minX: this.viewportCenter.x, 
        *     minY: this.viewportCenter.y, 
        *     maxX: this.sceneWidth - this.viewportCenter.x, 
        *     maxY: this.sceneHeight - this.viewportCenter.y 
        *   } 
        * }
        */
        Object.defineProperty(this, 'bounds', {
            get: function () {
                return this._bounds;
            },

            set: function (value) {
                var bounds;

                this._bounds = value;

                if (value === null) {
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

                this.minX = bounds.minX;
                this.minY = bounds.minY;
                this.maxX = bounds.maxX;
                this.maxY = bounds.maxY;
            }
        });

        Object.defineProperty(this, 'hasBounds', {
            get: function () {
                return this._bounds !== null;
            }
        });

        this.minX = null;
        this.minY = null;
        this.maxX = null;
        this.maxY = null;

        this.applyBounds = function (position, newBounds) {
            position = position || this.position;
            
            if (newBounds !== undefined) {
                this.bounds = newBounds;
            }

            if (this.hasBounds) {
                this.position.set(clamp(position.x, this.minX, this.maxX), clamp(position.y, this.minY, this.maxY));
                this.offset.copy(this._calculateOffset(this.position, this.viewportCenter, this.scene.origin, this.sceneTransformation));
            }

            return this;
        };

        this.bounds = options.bounds !== undefined ? options.bounds : function () {
            return {
                minX: this.viewportCenter.x,
                minY: this.viewportCenter.y,
                maxX: this.sceneWidth - this.viewportCenter.x,
                maxY: this.sceneHeight - this.viewportCenter.y
            }
        };

        /**
        * @property {external:Draggable} - The drag control.
        * @default null
        */
        this.draggable = !this.isDraggable ? null : new Draggable(this.scene.view, {
            onDrag: function (camera) {
                var position = camera._calculatePosition(new Vector2(-this.x, -this.y), camera.viewportCenter, camera.scene.origin, camera.sceneTransformation);

                if (camera.hasBounds) {
                    // Manually tween draggable to consistently enforce bounds based on camera position
                    camera.applyBounds(position);
                    TweenMax.set(this.target, { 
                        css: { 
                            x: -camera.offset.x, 
                            y: -camera.offset.y
                        }
                    });
                }
                else {
                    camera.position.copy(position);
                    camera.offset.set(-this.x, -this.y);
                }
                
                camera._renderDebug();
            },
            onDragParams: [this],
            zIndexBoost: false
        });

        // Initialize standard events and behaviors
        this.onDragstart = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            return false;
        };

        this.onPress = (event) => {
            if (this.view && this.isDraggable) {
                this.view.addEventListener('mouseup', this.onDragRelease);
                this.view.addEventListener('mouseleave', this.onDragLeave);
                this.view.addEventListener('mousemove', this.onDragMove);
                this.view.addEventListener('touchend', this.onDragRelease);
                this.view.addEventListener('touchcancel', this.onDragRelease);
                this.view.addEventListener('touchmove', this.onDragMove);
            }

            this.isPressed = true;
            this._renderDebug();
        };

        this.onRelease = (event) => {
            this.release();
        };

        this.onLeave = (event) => {
            this.release();
        };

        this.onTransitionEnd = (event) => {
            this.isTransitioning = false;
        };

        this.release = () => {
            this.isPressed = false;
            this._renderDebug();
        };

        // Initialize drag events and behaviors
        this.onDragRelease = (event) => {
            this.endDrag(event);
        };

        this.onDragLeave = (event) => {
            this.endDrag(event);
        };

        this.onDragMove = (event) => {
            if (this.isPressed && !this.isDragging) {
                this.draggable.startDrag(event);
                this.isDragging = true;
            }
        };

        this.endDrag = (event) => {
            if (this.isDragging) {
                this.draggable.endDrag(event);
                this.view.removeEventListener('mouseup', this.onDragRelease);
                this.view.removeEventListener('mouseleave', this.onDragLeave);
                this.view.removeEventListener('mousemove', this.onDragMove);
                this.view.removeEventListener('touchend', this.onDragRelease);
                this.view.removeEventListener('touchcancel', this.onDragRelease);
                this.view.removeEventListener('touchmove', this.onDragMove);
                this.isDragging = false;
                this._renderDebug();
            }
        };

        // Initialize zoom events and behaviors
        this.onZoomWheel = (event) => {
            if (this.isManualZoomEnabled === false) {
                return;
            }
            
            event.preventDefault();
            event.stopPropagation();

            if (event.deltaY) {
                var direction = event.deltaY > 0 ? Camera.zoomDirection.OUT : Camera.zoomDirection.IN;
                var cameraRect;
                var cameraContextPosition = new Vector2();
                var sceneContextPosition = new Vector2();
                var origin = this.scene.origin;
                var zoom = this._clampZoom(this.zoom + this.zoomIncrement * Math.abs(event.deltaY) * this.zoom * (direction === Camera.zoomDirection.IN ? 1 : -1));

                // Performance Optimization: If zoom has not changed because it's at the min/max, don't zoom.
                if (zoom !== this.zoom) {
                    cameraRect = this.view.getBoundingClientRect();
                    cameraContextPosition.set(event.clientX - cameraRect.left, event.clientY - cameraRect.top);
                    sceneContextPosition = this._calculatePosition(this.offset, cameraContextPosition, this.scene.origin, this.sceneTransformation);

                    if (Math.round(origin.x) !== Math.round(sceneContextPosition.x) || Math.round(origin.y) !== Math.round(sceneContextPosition.y)) {
                        origin = this._calculatePosition(this.offset, cameraContextPosition, this.scene.origin, this.sceneTransformation);
                    }

                    this.animation = new Oculo.Animation(this, { paused: false }).zoomAt(origin, zoom, 0);
                }
            }
        };

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
                            var inProgressTimeline, tween, props;

                            inProgressTimeline = this.camera.animation.getChildren(false, false, true).filter((timeline) => {
                                var progress = timeline.progress();
                                return progress > 0 && progress < 1;
                            })[0];

                            tween = inProgressTimeline.getChildren(false, true, false)[0];

                            if (tween.data.isMoving) {
                                props = this._calculateEndProps(tween.data.sourceOrigin, tween.data.sourcePosition, tween.data.sourceRotation, tween.data.sourceZoom, this.camera);
                                Object.assign(tween.data, props);
                                console.log('tween data after resize: ', tween.data);
                                tween.updateTo({
                                    offsetX: props.endOffset.x,
                                    offsetY: props.endOffset.y,
                                    rotation: props.endRotation,
                                    zoom: props.endZoom
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
        
        this.listenTo(this, 'change:size', this.onResize);
        
        this.initialize(options);
    }
    
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
    
    /**
    * Destroys the camera and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        this.stopListening();
        
        // TODO: Remove event handlers attached by trackControls
        if (this.isDraggable) {
            this.draggable.kill();
        }
        
        if (this.view) {
            this.view.parentNode.removeChild(this.view);
        }
        
        return this;
    }
    
    /**
    * Disables manual zoom.
    *
    * @returns {this} self
    */
    disableManualZoom () {
        this.isManualZoomEnabled = false;

        return this;
    }

    /**
    * Enables manual zoom.
    *
    * @returns {this} self
    */
    enableManualZoom () {
        this.isManualZoomEnabled = true;

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

        if (animation) {
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