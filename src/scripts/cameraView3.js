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

/**
* Factory: Creates a camera to pan and zoom content.
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
    * The content's focusable bounds. If set, the camera will keep focus within the bounds.
    * @property {Object} - An object representing the content's focusable bounds.
    * @default null
    */
    this.bounds = null;
    
    /**
    * The content.
    * @property {Element} - The element to treat as the camera's content.
    * @default null
    */
    this.content = null;

    /**
    * The debugging information view.
    * @property {Backbone.View} - The debugging information view.
    * @default null
    */
    this.debugView = null;
    
    /**
    * @property {Element} - TODO.
    */
    this.el = options.el;
    
    /**
    * @property {Element} - TODO.
    */
    this.$el = $(this.el);
    
    /**
    * TODO
    *
    * @property {Object} - TODO
    * @default null
    */
    this.focusBounds = null;

    /**
    * @property {boolean} - Whether the content is animating or not.
    * @default
    */
    this.isAnimating = false;

    /**
    * @property {boolean} - Whether the camera is paused or not.
    * @default
    */
    this.isPaused = false;

    /**
    * @property {boolean} - Whether the content is shaking or not.
    * @default
    */
    this.isShaking = false;
    
    /**
    * @property {boolean} - Whether the content has an active CSS transition or not.
    * @default
    */
    this.isTransitioning = false;

    /**
    * The minimum value the content can be zoomed.
    * @property {number} - See {@link Camera.zoom|zoom}.
    * @default
    */
    this.minZoom = 0.5;

    /**
    * The maximum value the content can be zoomws.
    * @property {number} - See {@link Camera.zoom|zoom}.
    * @default
    */
    this.maxZoom = 3;

    /**
    * @property {number} - The 'x' value of the transformation origin.
    * @default
    */
    this.originX = 0;
    
    /**
    * @property {number} - The 'y' value of the transformation origin.
    * @default
    */
    this.originY = 0;

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
    * The base increment at which the content will be zoomed.
    * @property {number} - See {@link Camera.zoom|zoom}.
    * @default
    */
    this.zoomIncrement = 0.01;

    /**
    * @property {number} - The 'x' value of the zoom origin.
    * @default
    */
    this.zoomOriginX = 0;

    /**
    * @property {number} - The 'y' value of the zoom origin.
    * @default
    */
    this.zoomOriginY = 0;

    /**
    * The width.
    * @name Camera#width
    * @property {number} - Gets or sets the view's width. Includes border and padding. A "change:width" event is emitted if the value has changed.
    */
    Object.defineProperty(this, 'width', {
        get: function () {
            var computedStyle = window.getComputedStyle(this.el);

            return this.el.clientWidth + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));
        },

        set: function (value) {
            if (value != this.width) {
                this.$el.width(value);
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
            var computedStyle = window.getComputedStyle(this.el);

            return this.el.clientHeight + parseFloat(computedStyle.getPropertyValue('border-top-width')) + parseFloat(computedStyle.getPropertyValue('border-bottom-width'));
        },

        set: function (value) {
            if (value != this.height) {
                this.$el.height(value);
                this.trigger('change:height', value);
            }
        }
    });
    
    Object.defineProperty(this, 'halfViewportWidth', {
        get: function () {
            return this.viewportWidth / 2;
        }
    });
    
    Object.defineProperty(this, 'halfViewportHeight', {
        get: function () {
            return this.viewportHeight / 2;
        }
    });

    /**
    * The content's x position.
    * @name Camera#contentX
    * @property {number} - Gets or sets the content's x position.
    */
    Object.defineProperty(this, 'contentX', {
        get: function () {
            return this.content.x;
        },

        set: function (value) {
            this.content.x = value;
        }
    });
    
    /**
    * The content's y position.
    * @name Camera#contentY
    * @property {number} - Gets or sets the content's y position.
    */
    Object.defineProperty(this, 'contentY', {
        get: function () {
            return this.content.y;
        },

        set: function (value) {
            this.content.y = value;
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
            var transformationMatrix = new Matrix2(this.zoomX, 0, 0, this.zoomY).rotate(Oculo.Math.degToRad(-this.rotation));
            var origin = new Vector2(this.originX, this.originY);
            var originOffset = Vector2.clone(origin).transform(transformationMatrix).subtract(origin);

            return new Vector2((this.x + originOffset.x + this.halfViewportWidth), (this.y + originOffset.y + this.halfViewportHeight)).transform(transformationMatrix.getInverse());
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
    * The amount of rotation in degrees.
    * @name Camera#rotation
    * @property {number} - Gets or sets the rotation.
    */
    Object.defineProperty(this, 'rotation', {
        get: function () {
            return -this.content.rotation;
        },

        set: function (value) {
            this.content.rotation = -value;
        }
    });
    
    /**
    * The width of the viewport.
    * @name Camera#viewportWidth
    * @property {number} - Gets the viewport's width. Excludes the element's border.
    */
    Object.defineProperty(this, 'viewportWidth', {
        get: function () {
            return this.el.clientWidth;
        }
    });

    /**
    * The height of the viewport.
    * @name Camera#viewportHeight
    * @property {number} - Gets the viewport's height. Excludes the element's border.
    */
    Object.defineProperty(this, 'viewportHeight', {
        get: function () {
            return this.el.clientHeight;
        }
    });

    /**
    * The camera's x position on the content.
    * @name Camera#x
    * @property {number} - Gets or sets the camera's x position on the content.
    */
    Object.defineProperty(this, 'x', {
        get: function () {
            return -this.content.x;
        },

        set: function (value) {
            this.content.x = -value;
        }
    });
    
    /**
    * The camera's y position on the content.
    * @name Camera#y
    * @property {number} - Gets or sets the camera's y position on the content.
    */
    Object.defineProperty(this, 'y', {
        get: function () {
            return -this.content.y;
        },

        set: function (value) {
            this.content.y = -value;
        }
    });
    
    /**
    * The amount of zoom.
    * @name Camera#zoom
    * @property {number} - Gets or sets the zoom. A ratio where 1 = 100%.
    */
    Object.defineProperty(this, 'zoom', {
        get: function () {
            return this.content.scaleX;
        },

        set: function (value) {
            this.content.scaleX = value;
        }
    });
    
    Object.defineProperty(this, 'isZoomed', {
        get: function () {
            return this.zoomX !== 1 && this.zoomY !== 1;
        }
    });
    
    /**
    * The amount of zoom on the x-axis.
    * @name Camera#zoomX
    * @property {number} - Gets or sets the zoom on the x-axis. A ratio where 1 = 100%.
    */
    Object.defineProperty(this, 'zoomX', {
        get: function () {
            return this.content.scaleX;
        },

        set: function (value) {
            this.previousZoomX = this.zoomX;
            this.content.scaleX = value;
        }
    });

    /**
    * The amount of zoom on the y-axis.
    * @name Camera#zoomY
    * @property {number} - Gets or sets the zoom on the y-axis. A ratio where 1 = 100%.
    */
    Object.defineProperty(this, 'zoomY', {
        get: function () {
            return this.content.scaleY;
        },

        set: function (value) {
            this.previousZoomY = this.zoomY;
            this.content.scaleY = value;
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
    var point = new Vector2(x, y).transform(new Matrix2().rotate(Oculo.Math.degToRad(this.content.rotation)));
    
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
* Animates the camera's content.
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
                contentRect = this.content.transformEl.getBoundingClientRect();
                originX = (event.clientX - contentRect.left) / this.zoom;
                originY = (event.clientY - contentRect.top) / this.zoom;
            }

            this.isTransitioning = true;
            return this._zoomAtXY(zoom, originX, originY, 0);
        }
    }
};

/**
* Ensure the camera keeps focus within the content's focusable bounds.
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
* Drag the content.
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
* End dragging the content.
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

    this.content = new CameraContentView({
        className: 'bcv-content-root',
        content: options.content
    })
    
    this.debugView = new DebugView({
        model: this,
        className: 'oculo-debug'
    });
    
    this.zoom = 1;

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

    var focus = new Vector2(options.focusX, options.focusY);
    var cameraContextPosition = new Vector2(this.halfViewportWidth, this.halfViewportHeight);
    var origin = new Vector2(this.originX, this.originY);
    var transformation = new Matrix2(this.content.scaleX, 0, 0, this.content.scaleY).rotate(Oculo.Math.degToRad(this.content.rotation));
    var position = this.calculateCameraPosition(focus, cameraContextPosition, origin, transformation);
    
    this.x = position.x;
    this.y = position.y;

    // Set up content
    this.el.appendChild(this.content.el);

    this.draggable = new Draggable(this.content.transformEl, {
        onDrag: function (camera) {
            // 'this' refers to the Draggable instance
            camera.focusX = (camera.viewportWidth / 2 - this.x) / camera.zoom;
            camera.focusY = (camera.viewportHeight / 2 - this.y) / camera.zoom;
            camera._renderDebug();
        },
        onDragParams: [this],
        onPress: function (camera) {
//                    var contentRect = camera.content.transformEl.getBoundingClientRect();
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
    this.$el.on('mouseleave', this._onMouseLeave.bind(this));
    this.$el.on('transitionend', this._onTransitionEnd.bind(this));
    this.$el.on('wheel', utils.throttleToFrame(this._onWheel.bind(this)));

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
* @param {number} x - The 'x' position on the unzoomed content.
* @param {number} y - The 'y' position on the unzoomed content.
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