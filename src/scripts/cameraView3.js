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

// TODO: Remove from the window object

// Utilities (allows for easy swapping)
var clamp = _.clamp;
var isElement = _.isElement;
var isFinite = _.isFinite;
var isObject = _.isObject;
var isString = _.isString;
var pick = _.pick;
var uniqueId = _.uniqueId;

var Matrix2 = Oculo.Matrix2;
var Vector2 = Oculo.Vector2;

/**
* Factory: Creates a camera to view a scene.
* Requires {@link external:Lodash} and {@link external:Zepto}.
* 
* @constructs Camera
* @extends external:Backbone.View
* @mixes Focuser
* @mixes SizableView
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
* @param {number|string|Element} [options.width] - The camera's {@link Camera.width|width}.
* @param {number|string|Element} [options.height] - The camera's {@link Camera.height|height}.
* @param {Object|Element} [options.focus] - A {@link Camera.focus|focus} object.
* @param {number} [options.minZoom] - The {@link Camera.minZoom|minimum zoom}.
* @param {number} [options.maxZoom] - The {@link Camera.maxZoom|maximum zoom}.
* @param {number} [options.zoom] - A {@link Camera.zoom|zoom} ratio.
* @param {number} [options.zoomIncrement] - The base {@link Camera.zoomIncrement|zoom increment}.
*/
var Camera = function (options) {
    // Compose object
    Object.assign(this, Backbone.Events, new Focuser());
    
    /**
    * @property {Object} - An object containing of all current and future animations.
    */
    this.animations = {};

    /**
    * The scene's focusable bounds. If set, the camera will keep focus within the bounds.
    * @property {Object} - An object representing the scene's focusable bounds.
    * @default null
    */
    this.bounds = null;
    
    /**
    * The scene which the camera is viewing.
    * @property {Camera.Scene}
    * @default null
    */
    this.scene = null;

    /**
    * The debugging information view.
    * @property {Backbone.View} - The debugging information view.
    * @default null
    */
    this.debugView = null;
    
    /**
    * @property {Element} - TODO.
    */
    this.view = utils.DOM.parseView(options.view);
    
    /**
    * @property {Element} - TODO.
    */
    this.$view = $(this.view);
    
    /**
    * TODO
    *
    * @property {Object} - TODO
    * @default null
    */
    this.focusBounds = null;

    /**
    * @property {boolean} - Whether the scene is animating or not.
    * @default
    */
    this.isAnimating = false;

    /**
    * @property {boolean} - Whether the camera is paused or not.
    * @default
    */
    this.isPaused = false;

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
    * The minimum value the scene can be zoomed.
    * @property {number} - See {@link Camera.zoom|zoom}.
    * @default
    */
    this.minZoom = 0.5;

    /**
    * The maximum value the scene can be zoomed.
    * @property {number} - See {@link Camera.zoom|zoom}.
    * @default
    */
    this.maxZoom = 3;
    
    /**
    * @property {Vector2} - The position on the scene.
    * @default
    */
    this.position = new Vector2(0, 0);
    
    /**
    * @property {number} - The amount of rotation in degrees.
    * @default
    */
    this.rotation = 0;
    
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
            return this.scene.width * this.zoomX;
        }
    });
    
    /**
    * The scaled height of the scene.
    * @name Camera#sceneScaledHeight
    * @property {number} - Gets the scaled height of the scene.
    */
    Object.defineProperty(this, 'sceneScaledHeight', {
        get: function () {
            return this.scene.height * this.zoomY;
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
    
    this.timeline = null;
    
    /**
    * The base increment at which the scene will be zoomed.
    * @property {number} - See {@link Camera.zoom|zoom}.
    * @default
    */
    this.zoomIncrement = 0.01;
    
    /**
    * @property {number} - The amount of zoom on the X axis. A ratio where 1 = 100%.
    * @default
    */
    this.zoomX = 1;

    /**
    * @property {number} - The amount of zoom on the Y axis. A ratio where 1 = 100%.
    * @default
    */
    this.zoomY = 1;

    /**
    * The width.
    * @name Camera#width
    * @property {number} - Gets or sets the view's width. Includes border and padding. A "change:width" event is emitted if the value has changed.
    */
    Object.defineProperty(this, 'width', {
        get: function () {
            var computedStyle = window.getComputedStyle(this.view);

            return this.view.clientWidth + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));
        },

        set: function (value) {
            if (value != this.width) {
                this.$view.width(value);
                this.trigger('change:width', value);
            }
        }
    });

    /**
    * The height.
    * @name Camera#height
    * @property {number} - Gets or sets the view's height. Includes border and padding. A "change:height" event is emitted if the value has changed.
    */
    Object.defineProperty(this, 'height', {
        get: function () {
            var computedStyle = window.getComputedStyle(this.view);

            return this.view.clientHeight + parseFloat(computedStyle.getPropertyValue('border-top-width')) + parseFloat(computedStyle.getPropertyValue('border-bottom-width'));
        },

        set: function (value) {
            if (value != this.height) {
                this.$view.height(value);
                this.trigger('change:height', value);
            }
        }
    });
    
    /**
    * The default ease.
    * @name Camera#defaultEase
    * @property {Object} - Gets or sets the default ease.
    */
    Object.defineProperty(this, 'defaultEase', {
        get: function () {
            return TweenLite.defaultEase;
        },

        set: function (value) {
            TweenLite.defaultEase = value;
        }
    });
    
    Object.defineProperty(this, 'focus', {
        get: function () {
            var transformation = new Matrix2().scale(this.zoomX, this.zoomY).rotate(Oculo.Math.degToRad(-this.rotation));
            
            return this.calculateCameraFocus(new Vector2(this.x, this.y), this.viewportCenter, this.scene.origin, transformation);
        }
    });
    
    /**
    * The x position on which the camera is focused.
    * @name Camera#focusX
    * @property {number} - Gets the x position on which the camera is focused.
    */
    Object.defineProperty(this, 'focusX', {
        get: function () {
            return this.focus.x;
        }
    });
    
    /**
    * The y position on which the camera is focused.
    * @name Camera#focusY
    * @property {number} - Gets the y position on which the camera is focused.
    */
    Object.defineProperty(this, 'focusY', {
        get: function () {
            return this.focus.y;
        }
    });
    
    Object.defineProperty(this, 'isRotated', {
        get: function () {
            return this.rotation !== 0;
        }
    });
    
    /**
    * The center point.
    * @name Camera#center
    * @property {Vector2} - Gets the camera's center point.
    */
    Object.defineProperty(this, 'viewportCenter', {
        get: function () {
            return new Vector2(this.viewportWidth / 2, this.viewportHeight / 2);
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
            return this.view.clientWidth;
        }
    });

    /**
    * The height of the viewport.
    * @name Camera#viewportHeight
    * @property {number} - Gets the viewport's height. Excludes the element's border.
    */
    Object.defineProperty(this, 'viewportHeight', {
        get: function () {
            return this.view.clientHeight;
        }
    });
    
    /**
    * The camera's x position on the scene.
    * @name Camera#x
    * @property {number} - Gets or sets the camera's X position on the scene.
    */
    Object.defineProperty(this, 'x', {
        get: function () {
            return this.position.x;
        },

        set: function (value) {
            this.position.set(value, null);
        }
    });
    
    /**
    * The camera's y position on the scene.
    * @name Camera#y
    * @property {number} - Gets or sets the camera's Y position on the scene.
    */
    Object.defineProperty(this, 'y', {
        get: function () {
            return this.position.y;
        },

        set: function (value) {
            this.position.set(null, value);
        }
    });
    
    Object.defineProperty(this, 'isZoomed', {
        get: function () {
            return this.zoomX !== 1 && this.zoomY !== 1;
        }
    });
    
    this.initialize(options);
    
};

/**
* Shake directions.
* @enum {number}
*/
Camera.shakeDirection = {
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
};

/**
* @lends Camera.prototype
*/
var p = Camera.prototype;

p._markPoint = function (x, y) {
    var pointElement = document.getElementById('point');
    var point = new Vector2(x, y).transform(new Matrix2().scale(this.zoomX, this.zoomY).rotate(Oculo.Math.degToRad(-this.rotation)));
    
    pointElement.style.top = (point.y - 2) + 'px';
    pointElement.style.left = (point.x - 2) + 'px';
};

/**
* Add an animation to the animations object.
*
* @private
* @param {TimelineMax} animation - A TimelineMax object.
* @returns {TimelineMax} The animation.
*/
p._addAnimation = function (animation) {
    this.animations[animation.data.id] = animation;

    return animation;
};

/**
* Animates the camera's scene.
*
* @private
* @param {Object} properties - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {TimelineMax} The animation timeline.
*/
p._animate = function (properties, duration, options) {

    return this;
};

/**
* Removes an animation from the animations object.
*
* @private
* @param {TimelineMax} animation - A TimelineMax object.
* @returns {TimelineMax} The animation.
*/
p._removeAnimation = function (animation) {
    delete this.animations[animation.data.id];

    return animation;
};

/**
* Handle the mouseleave event.
*
* @private
* @param {MouseEvent} event - The mouse event.
*/
p._onMouseLeave = function (event) {
    document.querySelector('body').style.removeProperty('overflow');
};

/**
* Handle the end of a camera transition.
*
* @private
* @param {Event} event - The event object.
* @returns {Camera} The view.
*/
p._onTransitionEnd = function (event) {
    this.isTransitioning = false;

    return this;
};

/**
* Handle wheel input.
*
* @private
* @param {MouseEvent} event - A MouseEvent object.
* @returns {Camera} The view.
*/
p._onWheel = function (event) {
    event.preventDefault();
    this._wheelZoom(event);

    return this;
};

/**
* Render debug info.
*
* @private
*/
p._renderDebug = function () {
    if (this.debug) {
        this.debugView.update();
    }
};

/**
* Zooms in/out based on wheel input.
*
* @private
* @param {MouseEvent} event - A MouseEvent object.
* @returns {Camera} The view.
*/
p._wheelZoom = function (event) {
    document.querySelector('body').style.overflow = 'hidden';

    if (event.deltaY && !this.isAnimating) {

        var contentRect;
        var direction = event.deltaY > 0 ? constants.zoom.OUT : constants.zoom.IN;
        var originX = this.zoomOriginX;
        var originY = this.zoomOriginY;
        var zoom = clamp(this.zoom + this.zoomIncrement * Math.abs(event.deltaY) * this.zoom * (direction === constants.zoom.IN ? 1 : -1), this.minZoom, this.maxZoom);

        // Performance Optimization: If zoom has not changed, it is at the min or max.
        if (zoom !== this.zoom) {
            if (!this.isTransitioning) {
                contentRect = this.scene.view.getBoundingClientRect();
                originX = (event.clientX - contentRect.left) / this.zoom;
                originY = (event.clientY - contentRect.top) / this.zoom;
            }

            this.isTransitioning = true;
            return this._zoomAtXY(zoom, originX, originY, 0);
        }
    }
};

/**
* Ensure the camera keeps focus within the scene's focusable bounds.
*
* @returns {Object} The bounded position.
*/
p.checkBounds = function (position) {
    if (position.x <= this.bounds.left)
    {
        position.x = this.bounds.left;
    }

    if (position.x >= this.bounds.right)
    {
        position.x = this.bounds.right;
    }

    if (position.y <= this.bounds.top)
    {
        position.y = this.bounds.top;
    }

    if (position.y >= this.bounds.bottom)
    {
        position.y = this.bounds.bottom;
    }

    return position;
};

// TODO: Refactor to use use GSAP's Draggable.
/**
* Drag the scene.
*
* @param {DragEvent} event - The drag event.
*/
p.drag = function (event) {
    var dragDelta = {
        x: (this.dragStartX - event.clientX) / this.scale,
        y: (this.dragStartY - event.clientY) / this.scale
    };
    var newFocus = {
        x: this.focus.x + dragDelta.x,
        y: this.focus.y + dragDelta.y
    };

    var eventTimeDelta = event.timeStamp - this.previousEventTime;

    this.velocity = {
        x: dragDelta.x / (eventTimeDelta / 1000),
        y: dragDelta.y / (eventTimeDelta / 1000)
    };

    // Log timestamp
    this.previousEventTime = event.timeStamp;

    // Set x/y point for calculating next move distance
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this.focusOn(newFocus, { 
        duration: '0s'
    });

    return this;
};

// TODO: Refactor into a function that repeats on RAF similar to zoomAt so that decceleration and bounds can work together.
/**
* End dragging the scene.
*
* @param {MouseEvent} event - The mouse event.
*/
p.dragEnd = function (event) {
    var _this = this;
    var eventTimeDelta = event.timeStamp - this.previousEventTime;

    // Only apply momentum movement if dragging has not stopped
    if (eventTimeDelta < 66.6) {
        var previousTime = performance.now();
        window.requestAnimationFrame(function (timestamp) { 
            _this.dragDeccelerate(_this.velocity, timestamp - previousTime, timestamp);
        });
    }

    this.isDragging = false;

    return this;
};

// TODO: Messy animation/decceleration.
// Clean up to generic accelerate that takes args: acceleration, velocity, threshold
p.dragDeccelerate = function (velocity, timeDelta, timestamp) {
    velocity.x = velocity.x || 0;
    velocity.y = velocity.y || 0;

    var _this = this;
    var newFocus, newVelocity;
    var previousTime = timestamp;

    newFocus = {
        x: this.focus.x + velocity.x * (timeDelta / 1000),
        y: this.focus.y + velocity.y * (timeDelta / 1000)
    };

    this.focusOn(newFocus, { 
        duration: '100ms'
    });

    newVelocity = {
        x: velocity.x * (1 - 0.1),
        y: velocity.y * (1 - 0.1)
    };

    if (Math.abs(velocity.x - newVelocity.x) > 3 || Math.abs(velocity.x - newVelocity.y) > 3) {
        window.requestAnimationFrame(function (timestamp) { 
            _this.dragDeccelerate(newVelocity, timestamp - previousTime, timestamp);
        });    
    }
};

/**
* Called on the view this when the view has been created. This method is not meant to be overridden. If you need to access initialization, use {@link Camera#onInitialize|onInitialize}.
*
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
* @returns {Camera} The view.
*/
p.initialize = function (options) {
    options = options || {};

    this.scene = new Scene(options.scene);
    
    this.debugView = new DebugView({
        model: this,
        className: 'oculo-debug'
    });

    Object.assign(this, pick(options, [
        'debug',
        'defaultEase',
        'bounds',
        'focusBounds',
        'zoom',
        'minZoom',
        'maxZoom',
        'zoomIncrement',
        'width',
        'height',
        'x',
        'y',
    ]));

    var focus = new Vector2(options.focus.x, options.focus.y);
    var cameraContextPosition = this.viewportCenter;
    var transformation = new Matrix2().scale(this.zoomX, this.zoomY).rotate(Oculo.Math.degToRad(-this.rotation));
    var position = this.calculateCameraPosition(focus, cameraContextPosition, this.scene.origin, transformation);
    
    this.x = position.x;
    this.y = position.y;

    // Set up scene
    this.view.appendChild(this.scene.view);

    this.draggable = new Draggable(this.scene.view, {
        onDrag: function (camera) {
            // 'this' refers to the Draggable instance
            camera.focusX = (camera.viewportWidth / 2 - this.x) / camera.zoom;
            camera.focusY = (camera.viewportHeight / 2 - this.y) / camera.zoom;
            camera._renderDebug();
        },
        onDragParams: [this],
        onPress: function (camera) {
//                    var contentRect = camera.scene.view.getBoundingClientRect();
//                    
//                    this.applyBounds({
//                        top: camera.viewportHeight / 2 - contentRect.height,
//                        left: camera.viewportWidth / 2 - contentRect.width,
//                        width: contentRect.width * 2,
//                        height: contentRect.height * 2
//                    });
        },
        onPressParams: [this],
        zIndexBoost: false
    });

    // Initialize events
    this.$view.on('mouseleave', this._onMouseLeave.bind(this));
    this.$view.on('transitionend', this._onTransitionEnd.bind(this));
    this.$view.on('wheel', utils.throttleToFrame(this._onWheel.bind(this)));

    this.onInitialize(options);

    return this;
};

/**
* TODO
*
* @param {number} x - TODO.
* @param {number} y - TODO.
*/
p.checkFocusBounds = function (x, y) {
    if (x <= this.focusBounds.left)
    {
        x = this.focusBounds.left;
    }

    if (x >= this.focusBounds.right)
    {
        x = this.focusBounds.right;
    }

    if (y <= this.focusBounds.top)
    {
        y = this.focusBounds.top;
    }

    if (y >= this.focusBounds.bottom)
    {
        y = this.focusBounds.bottom;
    }

    return { 
        x: x, 
        y: y 
    };
};

/**
* TODO
*
* @param {number} value - TODO.
* @returns {number} The clamped zoom.
*/
p.clampZoom = function (value) {
    return clamp(value, this.minZoom, this.maxZoom);
};

/**
* Focus the camera on an element.
*
* @param {Element} focus - An element.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*//**
* Focus the camera on a point.
*
* @param {number} x - The 'x' position on the unzoomed scene.
* @param {number} y - The 'y' position on the unzoomed scene.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p.focusOn = function (x, y, duration, options) {

    return this;
};

/**
* Triggered before the camera has rendered.
*/
p.onBeforeRender = function () {

};

/**
* Triggered after the camera has intialized.
*
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
*/
p.onInitialize = function (options) {

};

/**
* Triggered after the camera has rendered.
*/
p.onRender = function () {

};

/**
* Render the camera view. This method is not meant to be overridden. If you need to manipulate how the camera renders, use {@link Camera#onBeforeRender|onBeforeRender} and {@link Camera#onRender|onRender}.
*
* @returns {Camera} The view.
*/
p.render = function () {
    this.onBeforeRender();
    
    this.debugView.render().attach(document.body);
    
    this.onRender();

    return this;
};

/**
* Pauses all animations.
*
* @returns {Camera} The view.
*/
p.pause = function () {
    Object.keys(this.animations).forEach(function (key) {
        this.animations[key].pause();
    }, this);

    this.isPaused = true;
    this.isAnimating = false;

    return this;
};

/**
* Plays all animations from the current playhead position.
*
* @returns {Camera} The view.
*/
p.play = function () {
    var animationsKeys = Object.keys(this.animations);

    animationsKeys.forEach(function (key) {
        this.animations[key].resume();
    }, this);

    this.isPaused = false;
    if (animationsKeys.length > 0) {
        this.isAnimating = true;    
    }

    return this;
};

/**
* Rotates at a specific element.
*
* @param {number|string} rotation - TODO.
* @param {Element} focus - The element.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*//**
* Rotates at a specific point.
*
* @param {number|string} rotation - TODO.
* @param {string|string} x - TODO.
* @param {string|string} y - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p.rotateAt = function (rotation, x, y, duration, options) {

    return this;
};

/**
* Rotates at the current focus.
*
* @param {number|string} rotation - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p.rotateTo = function (rotation, duration, options) {

    return this;
};

/**
* Zooms in/out at a specific element.
*
* @param {number} zoom - A {@link Camera.zoom|zoom} ratio.
* @param {Element} focus - The element.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*//**
* Zooms in/out at a specific point.
*
* @param {number} zoom - A {@link Camera.zoom|zoom} ratio.
* @param {number} x - TODO.
* @param {number} y - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p.zoomAt = function (zoom, x, y, duration, options) {

    return this;
};

/**
* Zooms in/out at the current focus.
*
* @param {number} zoom - A {@link Camera.zoom|zoom} ratio.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p.zoomTo = function (zoom, duration, options) {

    return this;
};