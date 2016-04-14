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
* The Backbone library's view class.
* @name View
* @memberof external:Backbone
* @see http://backbonejs.org/#View
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

/**
* Factory: Creates a camera to pan and zoom content.
* Requires {@link external:lodash} and {@link external:zepto}.
* 
* @constructs CameraView
* @extends external:Backbone.View
* @mixes Focuser
* @mixes SizableView
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
* @param {Object|Element} [options.focus] - A {@link CameraView.focus|focus} object.
* @param {number|string|Element} [options.height] - The camera's {@link CameraView.height|height}.
* @param {number} [options.maxZoom] - The {@link CameraView.maxZoom|maximum zoom}.
* @param {number} [options.minZoom] - The {@link CameraView.minZoom|minimum zoom}.
* @param {number} [options.scale] - A {@link CameraView.zoom|zoom} ratio.
* @param {number} [options.scaleIncrement] - The base {@link CameraView.scaleIncrement|scale increment}.
* @param {number|string|Element} [options.width] - The camera's {@link CameraView.width|width}.
*/
var CameraView = Backbone.View.extend(Object.assign({},
    new Focuser(),
    /**
    * @lends CameraView.prototype
    */                                                
    {
        /**
        * @property {Object} - An object containing of all current and future animations.
        */
        animations: {},
    
        /**
        * The content.
        * @property {Element} - The element to treat as the camera's content.
        * @default null
        */
        content: null,

        /**
        * The default tween options. Used when values are being tweened and options are not provided.
        * @property {Object} - An object representing the default tween options.
        * @default
        */
        defaultTweenOptions: {
            ease: Power2.easeOut
        },
    
        /**
        * The content's focusable bounds. If set, the camera will keep focus within the bounds.
        * @property {Object} - An object representing the content's focusable bounds.
        * @default null
        */
        bounds: null,
        focusBounds: null,
    
        /**
        * The camera's 'x' focus position on the content.
        * @property {number} - A pixel value.
        * @default
        */
        focusX: 0,
    
        /**
        * The camera's 'y' focus position on the content.
        * @property {number} - A pixel value.
        * @default
        */
        focusY: 0,

        /**
        * @property {boolean} - Whether the content is transitioning or not.
        * @default
        */
        isAnimating: false,
    
        /**
        * @property {boolean} - Whether the camera is paused or not.
        * @default
        */
        isPaused: false,
    
        /**
        * @property {boolean} - Whether the content is transitioning or not.
        * @default
        */
        isTransitioning: false,
    
        /**
        * The zoom.
        * @property {number} - A zoom ratio where 1 = 100%.
        * @default
        */
        gs_zoom: 1,
    
        /**
        * The maximum value the content can be zoomws.
        * @property {number} - See {@link CameraView.zoom|zoom}.
        * @default
        */
        gs_maxZoom: 3,
    
        /**
        * The minimum value the content can be zoomed.
        * @property {number} - See {@link CameraView.zoom|zoom}.
        * @default
        */
        gs_minZoom: 0.5,
    
        /**
        * @property {number} - The 'x' value of the zoom origin.
        * @default
        */
        gs_zoomOriginX: 0,
    
        /**
        * @property {number} - The 'y' value of the zoom origin.
        * @default
        */
        gs_zoomOriginY: 0,

        /**
        * The base increment at which the content will be scaled.
        * @property {number} - See {@link CameraView.scale|scale}.
        * @default
        */
        scaleIncrement: 0.01,

        /**
        * Handle the mouseleave event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onMouseLeave: function (event) {
            document.querySelector('body').style.removeProperty('overflow');
        },

        /**
        * Handle the end of a camera transition.
        *
        * @private
        * @param {Event} event - The event object.
        * @returns {CameraView} The view.
        */
        _onTransitionEnd: function (event) {
            this.isTransitioning = false;

            return this;
        },

        /**
        * Handle wheel input.
        *
        * @private
        * @param {MouseEvent} event - A MouseEvent object.
        * @returns {CameraView} The view.
        */
        _onWheel: function (event) {
            event.preventDefault();
            this._gs_wheelZoom(event);

            return this;
        },
    
        /**
        * Ensure the camera keeps focus within the content's focusable bounds.
        *
        * @returns {Object} The bounded position.
        */
        checkBounds: function (position) {
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
        },

        // TODO: Refactor to use use GSAP's Draggable.
        /**
        * Drag the content.
        *
        * @param {DragEvent} event - The drag event.
        */
        drag: function (event) {
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
        },

        // TODO: Refactor into a function that repeats on RAF similar to zoomAt so that decceleration and bounds can work together.
        /**
        * End dragging the content.
        *
        * @param {MouseEvent} event - The mouse event.
        */
        dragEnd: function (event) {
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
        },

        // TODO: Messy animation/decceleration.
        // Clean up to generic accelerate that takes args: acceleration, velocity, threshold
        dragDeccelerate: function (velocity, timeDelta, timestamp) {
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
        },

        /**
        * Called on the view this when the view has been created. This method is not meant to be overridden. If you need to access initialization, use {@link CameraView#onInitialize|onInitialize}.
        *
        * @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
        * @returns {CameraView} The view.
        */
        initialize: function (options) {
            options = options || {};
            
            this.content = new CameraContentView({
                el: options.content
            })
            this.gs_zoom = 1;
            
            Object.assign(this, _.pick(options, [
                'debug',
                'bounds',
                'focusBounds',
                'focusX',
                'focusY',
                'zoom',
                'minZoom',
                'maxZoom',
                'scaleIncrement',
                'width',
                'height',
                'x',
                'y',
            ]));
            
            // Set up content
            this.el.appendChild(this.content.el);
            this.content.el.setAttribute('draggable', false);
            
            this.draggable = new Draggable(this.content.el, {
                onDrag: function (camera) {
                    camera.focusX = (camera.viewportWidth / 2 - this.x) / camera.gs_zoom;
                    camera.focusY = (camera.viewportHeight / 2 - this.y) / camera.gs_zoom;
                },
                onDragParams: [this],
                onPress: function (camera) {
//                    var contentRect = camera.content.el.getBoundingClientRect();
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
            
            if (this.debug) {
                this.debugFocusXEl = document.getElementById('debugFocusX');
                this.debugFocusYEl = document.getElementById('debugFocusY');
                this.debugIsAnimatingEl = document.getElementById('debugIsAnimating');
                this.debugIsTransitioningEl = document.getElementById('debugIsTransitioning');
                this.debugZoomEl = document.getElementById('debugZoom');
                this.debugMinZoomEl = document.getElementById('debugMinZoom');
                this.debugMaxZoomEl = document.getElementById('debugMaxZoom');
                this.debugZoomOriginXEl = document.getElementById('debugZoomOriginX');
                this.debugZoomOriginYEl = document.getElementById('debugZoomOriginY');
                window.requestAnimationFrame(this.renderDebug.bind(this));
            }
                
            this.onInitialize(options);

            return this;
        },
        
        /**
        * Triggered before the camera has rendered.
        */
        onBeforeRender: function () {
            
        },

        /**
        * Triggered after the camera has intialized.
        *
        * @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
        */
        onInitialize: function (options) {

        },

        /**
        * Triggered after the camera has rendered.
        */
        onRender: function () {

        },

        /**
        * Render the camera view. This method is not meant to be overridden. If you need to manipulate how the camera renders, use {@link CameraView#onBeforeRender|onBeforeRender} and {@link CameraView#onRender|onRender}.
        *
        * @returns {CameraView} The view.
        */
        render: function () {
            this.onBeforeRender();
            this.onRender();
            
            return this;
        },
    
        renderDebug: function () {
            this.debugFocusXEl.innerHTML = this.focusX;
            this.debugFocusYEl.innerHTML = this.focusY;
            this.debugIsAnimatingEl.innerHTML = this.isAnimating;
            this.debugIsTransitioningEl.innerHTML = this.isTransitioning;
            this.debugZoomEl.innerHTML = this.gs_zoom;
            this.debugMinZoomEl.innerHTML = this.gs_minZoom;
            this.debugMaxZoomEl.innerHTML = this.gs_maxZoom;
            this.debugZoomOriginXEl.innerHTML = this.gs_zoomOriginX;
            this.debugZoomOriginYEl.innerHTML = this.gs_zoomOriginY;
            
            window.requestAnimationFrame(this.renderDebug.bind(this));
        },
        
        checkFocusBounds: function (x, y) {
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
        },
    
        checkZoom: function (value) {
            if (value === 'min') {
                value = this.gs_minZoom;
            }
            
            if (value === 'max') {
                value = this.gs_maxZoom;
            }
            
            return _.clamp(value, this.gs_minZoom, this.gs_maxZoom);;
        },
    
        getTweenOptions: function (properties, options) {
            return Object.assign({}, this.defaultTweenOptions, properties, options);
        },
        
        /**
        * Pauses all animations.
        *
        * @returns {CameraView} The view.
        */
        pause: function () {
            Object.keys(this.animations).forEach(function (key) {
                this.animations[key].pause();
            }, this);
            
            this.isPaused = true;
            
            return this;
        },
    
        /**
        * Plays all animations from the current playhead position.
        *
        * @returns {CameraView} The view.
        */
        play: function () {
            Object.keys(this.animations).forEach(function (key) {
                this.animations[key].play();
            }, this);
            
            this.isPaused = false;
            
            return this;
        },
    
        /**
        * Zooms in/out based on wheel input.
        *
        * @private
        * @param {MouseEvent} event - A MouseEvent object.
        * @returns {CameraView} The view.
        */
        _gs_wheelZoom: function (event) {
            document.querySelector('body').style.overflow = 'hidden';
            
            if (event.deltaY && !this.isAnimating) {
                
                var contentRect;
                var direction = event.deltaY > 0 ? constants.zoom.OUT : constants.zoom.IN;
                var originX = this.gs_zoomOriginX;
                var originY = this.gs_zoomOriginY;
                var zoom = _.clamp(this.gs_zoom + this.scaleIncrement * Math.abs(event.deltaY) * this.gs_zoom * (direction === constants.zoom.IN ? 1 : -1), this.gs_minZoom, this.gs_maxZoom);

                // Performance Optimization: If zoom has not changed, it is at the min or max.
                if (zoom !== this.gs_zoom) {
                    if (!this.isTransitioning) {
                        contentRect = this.content.el.getBoundingClientRect();
                        originX = (event.clientX - contentRect.left) / this.gs_zoom;
                        originY = (event.clientY - contentRect.top) / this.gs_zoom;
                    }

                    this.isTransitioning = true;
                    return this.gs_zoomAtXY(zoom, originX, originY, 0);
                }
            }
        },
    
        /**
        * Focus the camera on an element.
        *
        * @param {Element} focus - An element.
        * @param {number} duration - TODO.
        * @param {Object} [options] - TODO.
        * @returns {CameraView} The view.
        */
        gs_focusOn: function (el, duration, options) {
            var position = this.getElementFocus(window, this.content.el.getBoundingClientRect(), el.getBoundingClientRect(), this.gs_zoom);
            
            return this.gs_focusOnXY(position.x, position.y, duration, options);
        },
    
        /**
        * Focus the camera on a point.
        *
        * @param {number} x - The 'x' position on the unzoomed content.
        * @param {number} y - The 'y' position on the unzoomed content.
        * @param {number} duration - TODO.
        * @param {Object} [options] - TODO.
        * @returns {CameraView} The view.
        */
        gs_focusOnXY: function (x, y, duration, options) {
            var focus = this.checkFocusBounds(x, y);
            var position = this.getContentPosition(focus.x, focus.y, this.viewportWidth, this.viewportHeight, this.gs_zoom);

            return this.gs_animate({
                focusX: focus.x,
                focusY: focus.y,
                contentX: position.x, 
                contentY: position.y }, duration, options);
        },
    
        /**
        * Zooms in/out at the current focus.
        *
        * @param {number} zoom - A {@link CameraView.zoom|zoom} ratio.
        * @param {number} duration - TODO.
        * @param {Object} [options] - TODO.
        * @returns {CameraView} The view.
        */
        gs_zoomTo: function (zoom, duration, options) {
            return this.gs_zoomAtXY(zoom, this.focusX, this.focusY, duration, options);
        },
        
        /**
        * Zooms in/out at a specific element.
        *
        * @param {number} zoom - A {@link Cameraview.zoom|zoom} ratio.
        * @param {Element} focus - The element.
        * @param {number} duration - TODO.
        * @param {Object} [options] - TODO.
        * @returns {CameraView} The view.
        */
        gs_zoomAt: function (zoom, el, duration, options) {
            // TODO: Refactor this.getElementFocus
            var position = this.getElementFocus(window, this.content.el.getBoundingClientRect(), el.getBoundingClientRect(), this.gs_zoom);
            
            return this.gs_zoomAtXY(zoom, position.x, position.y, duration, options);
        },
    
        /**
        * Zooms in/out at a specific point.
        *
        * @param {number} zoom - A {@link Cameraview.zoom|zoom} ratio.
        * @param {number} x - TODO.
        * @param {number} y - TODO.
        * @param {number} duration - TODO.
        * @param {Object} [options] - TODO.
        * @returns {CameraView} The view.
        */
        gs_zoomAtXY: function (zoom, x, y, duration, options) {
            zoom = this.checkZoom(zoom);
            
            var focus, position;
            var anchor = this.checkFocusBounds(x, y);
            var deltaX = this.focusX - anchor.x;
            var deltaY = this.focusY - anchor.y;
            var zoomRatio = this.gs_zoom / zoom;
            
            this.gs_zoomOriginX = x;
            this.gs_zoomOriginY = y;
            
            focus = this.getContentFocus(this.focusX, this.focusY, deltaX, deltaY, zoomRatio);
            
            position = this.getContentPosition(focus.x, focus.y, this.viewportWidth, this.viewportHeight, zoom);
            
            return this.gs_animate({
                zoom: zoom, 
                focusX: focus.x, 
                focusY: focus.y, 
                contentX: position.x, 
                contentY: position.y }, duration, options);
        },
    
        /**
        * Zooms in/out and focus the camera on a specific element.
        *
        * @param {number} zoom - A {@link CameraView.zoom|zoom} ratio.
        * @param {Element} focus - The element.
        * @param {number} duration - TODO.
        * @param {Object} [options] - TODO.
        * @returns {CameraView} The view.
        */
        gs_zoomOn: function (zoom, el, duration, options) {
            // TODO: Refactor this.getElementFocus
            var position = this.getElementFocus(window, this.content.el.getBoundingClientRect(), el.getBoundingClientRect(), this.gs_zoom);
            
            return this.gs_zoomOnXY(zoom, position.x, position.y, duration, options);
        },
        
        /**
        * Zooms in/out and focus the camera on a specific point.
        *
        * @param {number} zoom - A {@link CameraView.zoom|zoom} ratio.
        * @param {number} x - TODO.
        * @param {number} y - TODO.
        * @param {number} duration - TODO.
        * @param {Object} [options] - TODO.
        * @returns {CameraView} The view.
        */
        gs_zoomOnXY: function (zoom, x, y, duration, options) {
            zoom = this.checkZoom(zoom);
            
            var focus = this.checkFocusBounds(x, y);
            var position = this.getContentPosition(focus.x, focus.y, this.viewportWidth, this.viewportHeight, zoom);

            return this.gs_animate({ 
                zoom: zoom, 
                focusX: focus.x, 
                focusY: focus.y, 
                contentX: position.x, 
                contentY: position.y }, duration, options);
        },
        
        /**
        * Animates the camera's content.
        *
        * @param {Object} properties - TODO.
        * @param {number} duration - TODO.
        * @param {Object} [options] - TODO.
        * @returns {TimelineMax} The animation timeline.
        */
        gs_animate: function (properties, duration, options) {
            var timeline = new TimelineMax({
                data: {
                    id: _.uniqueId()
                },
                paused: this.isPaused,
                callbackScope: this,
                onStart: function (timeline) { 
                    this.isAnimating = true;
                    this.draggable.disable();
                },
                onStartParams: ["{self}"],
                onComplete: function (timeline) { 
                    this.isAnimating = false;
                    this.draggable.enable();
                    delete this.animations[timeline.data.id];
                },
                onCompleteParams: ["{self}"]
            });
            
            timeline.to(this, duration, this.getTweenOptions({ 
                    focusX: properties.focusX,
                    focusY: properties.focusY,
                    gs_zoom: properties.zoom
                }, options))
                .to(this.content.el, duration, this.getTweenOptions({ css: {
                    scale: properties.zoom,
                    x: properties.contentX,
                    y: properties.contentY
                }}, options), 0);
            
            this.animations[timeline.data.id] = timeline;
            
            return timeline;
        }
    })
);

/**
* The width.
* @name CameraView#width
* @property {number} - Gets or sets the view's width. Includes border and padding. A "change:width" event is emitted if the value has changed.
*/
Object.defineProperty(CameraView.prototype, 'width', {
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
* @name CameraView#height
* @property {number} - Gets or sets the view's height. Includes border and padding. A "change:height" event is emitted if the value has changed.
*/
Object.defineProperty(CameraView.prototype, 'height', {
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
* @name CameraView#viewportWidth
* @property {number} - Gets the viewport's width. Excludes the element's border.
*/
Object.defineProperty(CameraView.prototype, 'viewportWidth', {
    get: function () {
        return this.el.clientWidth;
    }
});

/**
* The height of the viewport.
* @name CameraView#viewportHeight
* @property {number} - Gets the viewport's height. Excludes the element's border.
*/
Object.defineProperty(CameraView.prototype, 'viewportHeight', {
    get: function () {
        return this.el.clientHeight;
    }
});