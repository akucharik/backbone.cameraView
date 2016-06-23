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
* The lodash library.
* @external lodash
* @see http://lodash.com
*/

/**
* The zepto library.
* @external zepto
* @see http://zeptojs.com
*/

// TODO: Remove from the window object

// Utilities (allows for easy swapping)
var clamp = _.clamp;
var isElement = _.isElement;
var isFinite = _.isFinite;
var isString = _.isString;
var pick = _.pick;
var uniqueId = _.uniqueId;

/**
* Factory: Creates a camera to pan and zoom content.
* Requires {@link external:lodash} and {@link external:zepto}.
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
    * The default tween options. Used when values are being tweened and options are not provided.
    * @property {Object} - An object representing the default tween options.
    * @default
    */
    this.defaultTweenOptions = {
        ease: Power2.easeOut
    };

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
    * The camera's 'x' focus position on the content.
    * @property {number} - A pixel value.
    * @default
    */
    this.focusX = 0;

    /**
    * The camera's 'y' focus position on the content.
    * @property {number} - A pixel value.
    * @default
    */
    this.focusY = 0;

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
    * The rotation.
    * @property {number} - A rotation value in degrees.
    * @default
    */
    this.rotation = 0;

    /**
    * @property {number} - The 'x' value of the rotation origin.
    * @default
    */
    this.rotationOriginX = 0;

    /**
    * @property {number} - The 'y' value of the rotation origin.
    * @default
    */
    this.rotationOriginY = 0;

    this.shakeIntensity = 0;
    this.shakeHorizontal = true;
    this.shakeVertical = true;
    this.shakeDirection = {
        BOTH: 0,
        HORIZONTAL: 1,
        VERTICAL: 2
    };
    
    /**
    * The camera's transformed 'x' focus position on the content.
    * @property {number} - A pixel value.
    * @default
    */
    this.transformedFocusX = 0;

    /**
    * The camera's transformed 'y' focus position on the content.
    * @property {number} - A pixel value.
    * @default
    */
    this.transformedFocusY = 0;

    /**
    * @property {number} - The 'x' value of the transform origin.
    * @default
    */
    this.transformOriginX = 0;

    /**
    * @property {number} - The 'y' value of the transform origin.
    * @default
    */
    this.transformOriginY = 0;

    /**
    * The zoom.
    * @property {number} - A zoom ratio where 1 = 100%.
    * @default
    */
    this.zoom = 1;
    
    /**
    * The amount of zoom on the x-axis.
    * @property {number} - A zoom ratio where 1 = 100%.
    * @default
    */
    this.zoomX = 1;
    
    /**
    * The amount of zoom on the y-axis.
    * @property {number} - A zoom ratio where 1 = 100%.
    * @default
    */
    this.zoomY = 1;

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
    
    this.initialize(options);
    
};

/**
* @lends Camera.prototype
*/
var p = Camera.prototype;

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
    if (properties.rotation) {
        var rOffsetX, rOffsetY, timeline, tOriginDeltaX, tOriginDeltaY;
        var rElTransform = this.content.rotateEl._gsTransform || {};
        // TODO: This must be a 2D matrix. Ensure a 2D matrix is returned.
        var tMatrix = utils.getTransformMatrix(this.content.rotateEl);

        rOffsetX = rElTransform.x || 0;
        rOffsetY = rElTransform.y || 0;

        tOriginDeltaX = properties.rotationOriginX - this.rotationOriginX;
        tOriginDeltaY = properties.rotationOriginY - this.rotationOriginY;

        // Handle 2D smooth origin changed when rotating
        rOffsetX += (tOriginDeltaX * tMatrix[0] + tOriginDeltaY * tMatrix[2]) - tOriginDeltaX;
        rOffsetY += (tOriginDeltaX * tMatrix[1] + tOriginDeltaY * tMatrix[3]) - tOriginDeltaY;

//                console.log('rOffset', rOffsetX, rOffsetY);
//                console.log('tOriginDelta', tOriginDeltaX, tOriginDeltaY);
    }

    timeline = new TimelineMax({
        data: {
            id: uniqueId()
        },
        paused: this.isPaused,
        callbackScope: this,
        onStart: function (timeline) { 
            this.isAnimating = true;
            this.draggable.disable();
            this._addAnimation(timeline);
        },
        onStartParams: ["{self}"],
        onUpdate: function (timeline) { 
            this._updateProps();
            this._updateTransformedFocus();
            
            this._renderDebug();
        },
        onUpdateParams: ["{self}"],
        onComplete: function (timeline) { 
            this.isAnimating = false;
            this.draggable.enable();
            this._removeAnimation(timeline);
            this._renderDebug();
        },
        onCompleteParams: ["{self}"]
    });

    timeline.to(this, duration, this.getTweenOptions({ 
            focusX: properties.focusX,
            focusY: properties.focusY
        }, options), 0)
        .to(this, 0, this.getTweenOptions({ 
            rotationOriginX: properties.rotationOriginX,
            rotationOriginY: properties.rotationOriginY
        }, options), 0)
        .to(this.content.transformEl, duration, this.getTweenOptions({ css: {
            scaleX: properties.zoom,
            scaleY: properties.zoom,
            x: properties.contentX,
            y: properties.contentY
        }}, options), 0)
        .to(this.content.rotateEl, duration, this.getTweenOptions({ css: {
            rotation: properties.rotation,
            transformOrigin: properties.rotationOrigin
        }}, options), 0)
        .to(this.content.rotateEl, 0, this.getTweenOptions({ css: {
            x: rOffsetX,
            y: rOffsetY
        }}, options), 0);

    return timeline;
};

/**
* Focus the camera on a point.
*
* @private
* @param {number} x - The 'x' position on the unzoomed content.
* @param {number} y - The 'y' position on the unzoomed content.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p._focusOnXY = function (x, y, duration, options) {
    var focus = this.checkFocusBounds(x, y);
    var position = this.getContentPosition(focus.x, focus.y, this.viewportWidth, this.viewportHeight, this.zoom);
    // TODO: This must be a 2D matrix. Ensure a 2D matrix is returned.
    var tMatrix = utils.getTransformMatrix(this.content.rotateEl);
    var tPositionX = position.x * tMatrix[0] + position.y * tMatrix[2];
    var tPositionY = position.x * tMatrix[1] + position.y * tMatrix[3];

    this._animate({
        focusX: focus.x,
        focusY: focus.y,
        contentX: tPositionX, 
        contentY: tPositionY }, duration, options);

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
        this.debugAnimationsEl.innerHTML = Object.keys(this.animations).length;
        this.debugFocusXEl.innerHTML = this.focusX;
        this.debugFocusYEl.innerHTML = this.focusY;
        this.debugTransformedFocusXEl.innerHTML = this.transformedFocusX;
        this.debugTransformedFocusYEl.innerHTML = this.transformedFocusY;
        this.debugIsAnimatingEl.innerHTML = this.isAnimating;
        this.debugIsPausedEl.innerHTML = this.isPaused;
        this.debugIsTransitioningEl.innerHTML = this.isTransitioning;
        this.debugRotationEl.innerHTML = this.rotation;
        this.debugRotationOriginXEl.innerHTML = this.rotationOriginX;
        this.debugRotationOriginYEl.innerHTML = this.rotationOriginY;
        this.debugTransformOriginXEl.innerHTML = this.transformOriginX;
        this.debugTransformOriginYEl.innerHTML = this.transformOriginY;
        this.debugZoomEl.innerHTML = this.zoom;
        this.debugZoomXEl.innerHTML = this.zoomX;
        this.debugZoomYEl.innerHTML = this.zoomY;
        this.debugMinZoomEl.innerHTML = this.minZoom;
        this.debugMaxZoomEl.innerHTML = this.maxZoom;
        this.debugZoomOriginXEl.innerHTML = this.zoomOriginX;
        this.debugZoomOriginYEl.innerHTML = this.zoomOriginY;
    }
};

/**
* Rotates at a specific point.
*
* @param {number|string} rotation - TODO.
* @param {number|string} x - TODO.
* @param {number|string} y - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p._rotateAtXY = function (rotation, x, y, duration, options) {
    var rotationOriginCSS = x + ' ' + y;

    if (isFinite(x) && isFinite(y)) {
        rotationOriginCSS = x + 'px ' + y + 'px';
    }

    // TODO: Consider determining focus "onUpdate" of tween (this.focusX * current tMatrix * current rMatrix + tMatrixTranslate, then take out scale)
    // Determine focus point
//            var relativeFocusX = this.focusX - x;
//            var relativeFocusY = y - this.focusY;
//            console.log(relativeFocusX, relativeFocusY);
//            var tMatrix = utils.getTransformMatrix(this.content.rotateEl);
//            var tPositionX = (relativeFocusX * tMatrix[0] + relativeFocusY * tMatrix[2]);
//            var tPositionY = (relativeFocusX * tMatrix[1] + relativeFocusY * tMatrix[3]);

    this._animate({
        rotation: rotation,
        rotationOrigin: rotationOriginCSS,
        rotationOriginX: x,
        rotationOriginY: y
    }, duration, options);

    return this;
};

/**
* Calculates the transformed focus coordinates.
*
* @private
* @param {number} x - TODO.
* @param {number} y - TODO.
* @param {number} originX - TODO.
* @param {number} originY - TODO.
* @param {Array} matrix - TODO.
* @return TODO.
*/
p._transformFocus = function (x, y, originX, originY, matrix) {
    // TODO: Needs to take into account rotationOrigin changes!!!
    // rotateAt(30, 300, 300)
    // rotateAt(5, 200, 200)
    // 442, 264
    var relativeFocusX = x - originX;
    var relativeFocusY = originY - y;

    return {
        x: originX + (relativeFocusX * matrix[0] + relativeFocusY * matrix[2]) - matrix[4],
        y: originY - (relativeFocusX * matrix[1] + relativeFocusY * matrix[3]) - matrix[5]
    };
};

/**
* Updates the camera's properties after a transform.
*
* @private
* @return {Camera} - The view.
*/
p._updateProps = function () {
    var props = this.content.transformEl._gsTransform;
    var rotateProps = this.content.rotateEl._gsTransform;

    this.rotation = rotateProps.rotation;
    this.zoom = props.scaleX;
    this.zoomX = props.scaleX;
    this.zoomY = props.scaleY;
    
    return this;
};

/**
* Updates the transformed focus properties.
*
* @private
* @return {Camera} - The view.
*/
p._updateTransformedFocus = function () {
    var transformedFocus = this._transformFocus(this.focusX, this.focusY, this.rotationOriginX, this.rotationOriginY, utils.getTransformMatrix(this.content.rotateEl));

    this.transformedFocusX = transformedFocus.x;
    this.transformedFocusY = transformedFocus.y;

    return this;
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
* Zooms in/out at a specific point.
*
* @param {number} zoom - A {@link Camera.zoom|zoom} ratio.
* @param {number} x - TODO.
* @param {number} y - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p._zoomAtXY = function (zoom, x, y, duration, options) {
    zoom = this.checkZoom(zoom);

    var focus, position;
    var anchor = this.checkFocusBounds(x, y);
    var deltaX = this.focusX - anchor.x;
    var deltaY = this.focusY - anchor.y;
    var zoomRatio = this.zoom / zoom;

    this.zoomOriginX = x;
    this.zoomOriginY = y;

    focus = this.getContentFocus(this.focusX, this.focusY, deltaX, deltaY, zoomRatio);

    position = this.getContentPosition(focus.x, focus.y, this.viewportWidth, this.viewportHeight, zoom);

    this._animate({
        zoom: zoom, 
        focusX: focus.x, 
        focusY: focus.y, 
        contentX: position.x, 
        contentY: position.y }, duration, options);

    return this;
};

/**
* Zooms in/out and focus the camera on a specific point.
*
* @param {number} zoom - A {@link Camera.zoom|zoom} ratio.
* @param {number} x - TODO.
* @param {number} y - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p._zoomOnXY = function (zoom, x, y, duration, options) {
    zoom = this.checkZoom(zoom);

    var focus = this.checkFocusBounds(x, y);
    var position = this.getContentPosition(focus.x, focus.y, this.viewportWidth, this.viewportHeight, zoom);

    this._animate({ 
        zoom: zoom, 
        focusX: focus.x, 
        focusY: focus.y, 
        contentX: position.x, 
        contentY: position.y }, duration, options);

    return this;
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
    this.zoom = 1;

    Object.assign(this, pick(options, [
        'debug',
        'bounds',
        'focusBounds',
        'focusX',
        'focusY',
        'zoom',
        'minZoom',
        'maxZoom',
        'zoomIncrement',
        'width',
        'height',
        'x',
        'y',
    ]));

    this.rotationOriginX = this.focusX;
    this.rotationOriginY = this.focusY;
    this.transformedFocusX = this.focusX;
    this.transformedFocusY = this.focusY;

    //TODO: Create a utility function to build CSS transform-origin value
    TweenMax.set(this.content.rotateEl, { transformOrigin: this.rotationOriginX + 'px ' + this.rotationOriginY + 'px' });

    // Set up content
    this.el.appendChild(this.content.el);

    this.draggable = new Draggable(this.content.transformEl, {
        onDrag: function (camera) {
            // 'this' refers to the Draggable instance
            camera._updateProps();
            camera.focusX = (camera.viewportWidth / 2 - this.x) / camera.zoom;
            camera.focusY = (camera.viewportHeight / 2 - this.y) / camera.zoom;
            camera._updateTransformedFocus();
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

    this.debugAnimationsEl = document.getElementById('debugAnimations');
    this.debugFocusXEl = document.getElementById('debugFocusX');
    this.debugFocusYEl = document.getElementById('debugFocusY');
    this.debugTransformedFocusXEl = document.getElementById('debugTransformedFocusX');
    this.debugTransformedFocusYEl = document.getElementById('debugTransformedFocusY');
    this.debugIsAnimatingEl = document.getElementById('debugIsAnimating');
    this.debugIsPausedEl = document.getElementById('debugIsPaused');
    this.debugIsTransitioningEl = document.getElementById('debugIsTransitioning');
    this.debugRotationEl = document.getElementById('debugRotation');
    this.debugRotationOriginXEl = document.getElementById('debugRotationOriginX');
    this.debugRotationOriginYEl = document.getElementById('debugRotationOriginY');
    this.debugTransformOriginXEl = document.getElementById('debugTransformOriginX');
    this.debugTransformOriginYEl = document.getElementById('debugTransformOriginY');
    this.debugZoomEl = document.getElementById('debugZoom');
    this.debugZoomXEl = document.getElementById('debugZoomX');
    this.debugZoomYEl = document.getElementById('debugZoomY');
    this.debugMinZoomEl = document.getElementById('debugMinZoom');
    this.debugMaxZoomEl = document.getElementById('debugMaxZoom');
    this.debugZoomOriginXEl = document.getElementById('debugZoomOriginX');
    this.debugZoomOriginYEl = document.getElementById('debugZoomOriginY');
    this._renderDebug();

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
p.checkZoom = function (value) {
    if (value === 'min') {
        value = this.minZoom;
    }

    if (value === 'max') {
        value = this.maxZoom;
    }

    return clamp(value, this.minZoom, this.maxZoom);;
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
    // Focus on an element
    if (arguments.length >= 2 && _.isElement(arguments[0])) {
        var el = x;
        var duration = y;
        var options = duration;
        var position = this.getElementFocus(window, this.content.transformEl.getBoundingClientRect(), el.getBoundingClientRect(), this.zoom);

        this._focusOnXY(position.x, position.y, duration, options);
    }

    // Focus on an x/y position
    else if (arguments.length >= 3 && isFinite(arguments[0]) && isFinite(arguments[1])) {
        this._focusOnXY(x, y, duration, options);
    }

    else {
        throw new Error(constants.errorMessage.METHOD_SIGNATURE);
    }

    return this;
};

p.getTweenOptions = function (properties, options) {
    return Object.assign({}, this.defaultTweenOptions, properties, options);
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
    // Rotate at an element
    if (arguments.length >= 3 && _.isElement(arguments[1])) {
        var el = x;
        var duration = y;
        var options = duration;
        var position = this.getElementFocus(window, this.content.transformEl.getBoundingClientRect(), el.getBoundingClientRect(), this.zoom);

        this._rotateAtXY(rotation, position.x, position.y, duration, options);
    }

    // Rotate at an x/y position
    else if (arguments.length >= 4 && (isFinite(arguments[1]) || isString(arguments[1])) && (isFinite(arguments[2])) || isString(arguments[2])) {
        this._rotateAtXY(rotation, x, y, duration, options);
    }

    else {
        throw new Error(constants.errorMessage.METHOD_SIGNATURE);
    }

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
    this._rotateAtXY(rotation, this.transformedFocusX, this.transformedFocusY, duration, options);

    return this;
};

p._shake = function (tween) {
    var x = 0;
    var y = 0;
    var startX = this.content.transformEl._gsTransform.x || 0;
    var startY = this.content.transformEl._gsTransform.y || 0;
    
    if (this.shakeHorizontal) {
        x = startX + Math.random() * this.shakeIntensity * this.width * 2 - this.shakeIntensity * this.width;
    }

    if (this.shakeVertical) {
        y = startY + Math.random() * this.shakeIntensity * this.height * 2 - this.shakeIntensity * this.height;
    }
    //console.log('x: ', x, ' y: ', y);
    TweenMax.set(this.content.transformEl, { 
        css: {
            x: x,
            y: y
        }
    });
};

p.shake = function (intensity, duration, direction, options) {
	options = options || {};
    var startX = this.content.transformEl._gsTransform.x || 0;
    var startY = this.content.transformEl._gsTransform.y || 0;
    
    this.shakeIntensity = intensity;
    this.shakeHorizontal = direction === this.shakeDirection.VERTICAL ? false : true;
    this.shakeVertical = direction === this.shakeDirection.HORIZONTAL ? false : true;
    
    
    
    Object.assign(options, {
        onComplete: function () {
            TweenMax.set(this.content.transformEl, { 
                css: {
                    x: startX,
                    y: startY
                }
            });
        },
        onCompleteScope: this
    });
    
    TweenMax.to(this.content.transformEl, duration, Object.assign({ 
        scale: 1,
        onUpdate: this._shake,
        onUpdateParams: ['{self}'],
        onUpdateScope: this,
    }, options));
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
    // Zoom at an element
    if (arguments.length >= 3 && _.isElement(arguments[1])) {
        var el = x;
        var duration = y;
        var options = duration;
        var position = this.getElementFocus(window, this.content.transformEl.getBoundingClientRect(), el.getBoundingClientRect(), this.zoom);

        this._zoomAtXY(zoom, position.x, position.y, duration, options);
    }

    // Zoom at an x/y position
    else if (arguments.length >= 4 && isFinite(arguments[1]) && isFinite(arguments[2])) {
        this._zoomAtXY(zoom, x, y, duration, options);
    }

    else {
        throw new Error(constants.errorMessage.METHOD_SIGNATURE);
    }

    return this;
};

/**
* Zooms in/out and focus the camera on a specific element.
*
* @param {number} zoom - A {@link Camera.zoom|zoom} ratio.
* @param {Element} focus - The element.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*//**
* Zooms in/out and focus the camera on a specific point.
*
* @param {number} zoom - A {@link Camera.zoom|zoom} ratio.
* @param {number} x - TODO.
* @param {number} y - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p.zoomOn = function (zoom, x, y, duration, options) {
    // Zoom on an element
    if (arguments.length >= 3 && _.isElement(arguments[1])) {
        var el = x;
        var duration = y;
        var options = duration;
        var position = this.getElementFocus(window, this.content.transformEl.getBoundingClientRect(), el.getBoundingClientRect(), this.zoom);

        this._zoomOnXY(zoom, position.x, position.y, duration, options);
    }

    // Zoom on an x/y position
    else if (arguments.length >= 4 && isFinite(arguments[1]) && isFinite(arguments[2])) {
        this._zoomOnXY(zoom, x, y, duration, options);
    }

    else {
        throw new Error(constants.errorMessage.METHOD_SIGNATURE);
    }

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
    this._zoomAtXY(zoom, this.focusX, this.focusY, duration, options);

    return this;
};