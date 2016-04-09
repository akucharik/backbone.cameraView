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
* @param {number} [options.maxScale] - The {@link CameraView.maxScale|maximum scale}.
* @param {number} [options.minScale] - The {@link CameraView.minScale|minimum scale}.
* @param {number} [options.scale] - A {@link CameraView.scale|scale} ratio.
* @param {number} [options.scaleIncrement] - The base {@link CameraView.scaleIncrement|scale increment}.
* @param {Object} [options.scaleOrigin] - A {@link CameraView.scaleOrigin|scale origin} ratio.
* @param {number|string|Element} [options.width] - The camera's {@link CameraView.width|width}.
*/
var CameraView = Backbone.View.extend(Object.assign({},
    new Focuser(),
    /**
    * @lends CameraView.prototype
    */                                                
    {
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
        * The focus.
        * @property {Object|Element} - An 'x' {number}, 'y' {number} pixel coordinate object or an Element.
        * @default
        */
        focus: {
            x: 0,
            y: 0
        },
    
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
        * @name isDragging
        * @property {boolean} - Whether the content is being dragged or not.
        * @default
        */
        isDragging: false,

        /**
        * @name isTransitioning
        * @property {boolean} - Whether the content is transitioning or not.
        * @default
        */
        isTransitioning: false,

        /**
        * The maximum value the content can be scaled.
        * @property {number} - See {@link CameraView.scale|scale}.
        * @default
        */
        maxScale: 6.0,

        /**
        * The minimum value the content can be scaled.
        * @property {number} - See {@link CameraView.scale|scale}.
        * @default
        */
        minScale: 0.25,

        /**
        * The scale.
        * @property {number} - A scale ratio where 1 = 100%.
        * @default
        */
        scale: 1,
    
        /**
        * The zoom.
        * @property {number} - A zoom ratio where 1 = 100%.
        * @default
        */
        gs_zoom: 1,
        gs_maxZoom: 3,
        gs_minZoom: 0.5,
        gs_zoomOriginX: 0,
        gs_zoomOriginY: 0,

        /**
        * The previous scale.
        * @property {number} - A scale ratio where 1 = 100%.
        * @default
        */
        previousScale: 1,

        /**
        * The base increment at which the content will be scaled.
        * @property {number} - See {@link CameraView.scale|scale}.
        * @default
        */
        scaleIncrement: 0.01,

        /**
        * The scale origin.
        * @property {Object} - An 'x' {number}, 'y' {number} pixel coordinate object.
        * @default null
        */
        scaleOrigin: null,
    
        // TODO: Refactor/clean up
        /**
        * Handle the click event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onClick: function (event) {
            console.log({ 
                x: event.clientX - this.content.el.getBoundingClientRect().left + window.scrollX,
                y: event.clientY - this.content.el.getBoundingClientRect().top + window.scrollX
            });
        },

        /**
        * Handle the dragstart event.
        *
        * @private
        * @param {DragEvent} event - The drag event.
        */
        _onDragStart: function (event) {
            // Prevent the "ghost image" when dragging.
            event.preventDefault();

            return false;
        },

        /**
        * Handle the mousedown event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onMouseDown: function (event) {
            this.isDragging = true;

            // Set time for calculating velocity.
            this.previousEventTime = event.timeStamp;

            // Set x/y point for calculating move distance.
            this.dragStartX = event.clientX;
            this.dragStartY = event.clientY;
        },

        /**
        * Handle the mouseleave event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onMouseLeave: function (event) {
            this.isDragging = false;
            document.querySelector('body').style.removeProperty('overflow');
        },

        /**
        * Handle the mousemove event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onMouseMove: function (event) {
            if (this.isDragging) {
                this.drag(event);
            }
        },

        /**
        * Handle the mouseup event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onMouseUp: function (event) {
            // TODO: Remove when development is complete
            console.log('mouse up');

            if (this.isDragging) {
                this.dragEnd(event);
            }
        },

        /**
        * Handle "state" change event.
        *
        * @private
        * @returns {CameraView} The view.
        */
        _onStateChange: function () {
            this.update();

            return this;
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
            this.gs_wheelZoom(event);

            return this;
        },

        /**
        * Zooms in/out based on wheel input.
        *
        * @private
        * @param {MouseEvent} event - A MouseEvent object.
        * @returns {CameraView} The view.
        */
        _wheelZoom: function (event) {
            document.querySelector('body').style.overflow = 'hidden';

            if (event.deltaY) {
                var direction = event.deltaY > 0 ? constants.zoom.OUT : constants.zoom.IN;
                var newScale = _.clamp(this.scale + this.scaleIncrement * Math.abs(event.deltaY) * this.scale * (direction === constants.zoom.IN ? 1 : -1), this.minScale, this.maxScale);
                var origin = null;

                // If scale has not changed, it is at the min or max.
                if (newScale !== this.scale) {
                    if (!this.isTransitioning) {
                        origin = {
                            x: (event.clientX - this.content.el.getBoundingClientRect().left) / this.scale,
                            y: (event.clientY - this.content.el.getBoundingClientRect().top) / this.scale
                        }
                    }
                    else {
                        origin = this.scaleOrigin;
                    }

                    // TODO: BUG: If deccelerating and origin has not been set, zoomAt will not respond.
                    // TODO: BUG: If deccelerating and origin has been previous set, it used previous/wrong origin.
                    if (origin) {
                        this.zoomAt(newScale, origin, {
                            duration: '100ms'
                        });
                    }
                }
            }

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

        // TODO: Messy! Refactor!
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

        // TODO: Refactor so it only handles an element.
        /**
        * Focus the camera on an element.
        *
        * @param {Object|Element} focus - A {@link CameraView.focus|focus} object.
        * @param {Object} [transition] - A {@link CameraView.transition|transition} object.
        * @returns {CameraView} The view.
        */
        focusOn: function (focus, transition) {
            transition = transition || {};

            this.setTransition(transition);
            this.setState({
                focus: focus
            });

            return this;
        },
    
        /**
        * Focus the camera on a point.
        *
        * @param {number} x - The 'x' position on the unscaled content.
        * @param {number} y - The 'y' position on the unscaled content.
        * @param {Object} [transition] - A {@link CameraView.transition|transition} object.
        * @returns {CameraView} The view.
        */
        focusOnXY: function (x, y, transition) {
            transition = transition || {};

            this.setTransition(transition);
            this.x = x - this.viewportWidth / 2;
            this.y = y - this.viewportHeight / 2;

            return this;
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
            this.scale = 1;
            this.gs_zoom = 1;
            
            Object.assign(this, _.pick(options, [
                'bounds',
                'focusBounds',
                'focus',
                'focusX',
                'focusY',
                'minScale',
                'maxScale',
                'scale',
                'scaleIncrement',
                'scaleOrigin',
                'width',
                'height',
                'x',
                'y',
            ]));
        
            // TODO: In development
            this.transitionDelay = '0s';
            this.transitionDuration = '500ms';
            this.transitionTimingFunciton = 'ease-out';
            
            // Set up content
            this.el.appendChild(this.content.el);
            this.content.el.setAttribute('draggable', false);
            
            // Initialize events
            this.$el.on('click', this._onClick.bind(this));
            //this.$el.on('dragstart', this._onDragStart.bind(this));
            //this.$el.on('mousedown', this._onMouseDown.bind(this));
            //this.$el.on('mouseleave', this._onMouseLeave.bind(this));
            //this.$el.on('mousemove', utils.throttleToFrame(this._onMouseMove.bind(this)));
            //this.$el.on('mouseup', this._onMouseUp.bind(this));
            this.$el.on('transitionend', this._onTransitionEnd.bind(this));
            this.$el.on('wheel', utils.throttleToFrame(this._onWheel.bind(this)));
            this.listenTo(this, 'change:size', this.update);
            this.listenTo(this, 'change:state', this._onStateChange);
            
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
            this.update();
            this.onRender();

            return this;
        },

        /**
        * Sets the camera's state.
        *
        * @param {Object} [state] - A state object.
        * @return {CameraView} The view.
        */
        setState: function (state) {
            state = state || {};

            if (state.focus) {
                this.focus = state.focus;
            }
            
            if (state.scale) {
                this.scale = state.scale;
            }
            
            if (state.scaleOrigin) {
                this.scaleOrigin = state.scaleOrigin;
            }
            
            this.trigger('change:state');
            
            return this;
        },
    
        /**
        * Sets the camera's transition.
        *
        * @param {Object} [transition] - A transition object.
        * @return {CameraView} The view.
        */
        setTransition: function (transition) {
            transition = transition || {};

            if (transition.delay) {
                this.transitionDelay = transition.delay;
            }
            
            if (transition.duration) {
                this.transitionDuration = transition.duration;
            }
            
            if (transition.timingFunction) {
                this.transitionTimingFunction = transition.timingFunction;
            }
            
            return this;
        },
    
        /**
        * Updates the camera to the current state.
        *
        * @returns {CameraView} The view.
        */
        update: function () {
            // TODO: Remove once development is complete
            console.log('update');
            
            var position = {};

            if (_.isElement(this.focus)) {
                position = this.getElementFocus(window, this.content.el.getBoundingClientRect(), this.focus.getBoundingClientRect(), this.previousScale);
            }
            else {
                position = this.focus;
            }

            if (!_.isFinite(this.scale)) {
                throw new Error('Cannot zoom using an invalid scale');
            }

            if (!_.isFinite(this.focus.x) && !_.isFinite(this.focus.y)) {
                throw new Error('Cannot focus using an invalid position');
            }
            
            if (this.bounds) {
                position = this.checkBounds(position);
                // TODO: Terrible! Refactor when all properties are flattened on the view.
                this.focus = position;
            }
            
            var focusOffset = this.getFocusOffset({ width: this.viewportWidth, height: this.viewportHeight}, position, this.scale);
            
//            utils.setCssTransition(this.content.el, {
//                delay: this.transitionDelay,
//                duration: this.transitionDuration,
//                timingFunction: this.transitionTimingFunction
//            });
            utils.setCssTransform(this.content.el, {
                scale: this.scale,
                translateX: focusOffset.x,
                translateY: focusOffset.y
            }, this);

            return this;
        },

        /**
        * Zooms in/out at the current focus.
        *
        * @param {number} scale - A {@link CameraView.scale|scale} ratio.
        * @param {Object} [transition] - A {@link CameraView.transition|transition} object.
        * @returns {CameraView} The view.
        */
        zoom: function (scale, transition) {
            transition = transition || {};

            this.setTransition(transition);
            this.setState({
                scale: scale
            });

            return this;
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
        
        gs_wheelZoom: function (event) {
            if (event.deltaY && !this.isAnimating) {
                document.querySelector('body').style.overflow = 'hidden';
                
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
    
        gs_focusOn: function (el, duration, options) {
            var position = this.getElementFocus(window, this.content.el.getBoundingClientRect(), el.getBoundingClientRect(), this.gs_zoom);
            
            return this.gs_focusOnXY(position.x, position.y, duration, options);
        },
    
        gs_focusOnXY: function (x, y, duration, options) {
            var focus = this.checkFocusBounds(x, y);
            var position = this.getContentPosition(focus.x, focus.y, this.viewportWidth, this.viewportHeight, this.gs_zoom);

            return this.gs_animate({
                contentX: position.x, 
                contentY: position.y }, duration, options);
        },
    
        gs_zoomTo: function (zoom, duration, options) {
            return this.gs_zoomAtXY(zoom, this.focusX, this.focusY, duration, options);
        },
        
        gs_zoomAt: function (zoom, el, duration, options) {
            // TODO: Refactor this.getElementFocus
            var position = this.getElementFocus(window, this.content.el.getBoundingClientRect(), el.getBoundingClientRect(), this.gs_zoom);
            
            return this.gs_zoomAtXY(zoom, position.x, position.y, duration, options);
        },
    
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
    
        gs_zoomOn: function (zoom, el, duration, options) {
            // TODO: Refactor this.getElementFocus
            var position = this.getElementFocus(window, this.content.el.getBoundingClientRect(), el.getBoundingClientRect(), this.gs_zoom);
            
            return this.gs_zoomOnXY(zoom, position.x, position.y, duration, options);
        },
        
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
    
        gs_animate: function (properties, duration, options) {
            var timeline = new TimelineMax({
                callbackScope: this,
                onStart: function () { this.isAnimating = true; },
                onComplete: function () { this.isAnimating = false; }
            });

            return timeline.to(this, duration, this.getTweenOptions({ 
                    focusX: properties.focusX,
                    focusY: properties.focusY,
                    gs_zoom: properties.zoom
                }, options))
                .to(this.content.el, duration, this.getTweenOptions({ css: {
                    scale: properties.zoom,
                    x: properties.contentX,
                    y: properties.contentY
                }}, options), 0);
        },

        /**
        * Zooms in/out at a specific point.
        *
        * @param {number} scale - A {@link Cameraview.scale|scale} ratio.
        * @param {Object|Element} focus - A {@link CameraView.focus|focus} object.
        * @param {Object} [transition] - A {@link CameraView.transition|transition} object.
        * @returns {CameraView} The view.
        */
        zoomAt: function (scale, focus, transition) {
            transition = transition || {};
            var currentFocus, scaleRatio, state;
            var delta = {};
            var newFocus = {};

            scaleRatio = this.scale / scale;
            currentFocus = this.focus;

            if (_.isElement(focus)) {
                focus = this._getElementFocus(focus, this.content.el, this.scale);
            }

            if (_.isElement(currentFocus)) {
                currentFocus = this._getElementFocus(currentFocus, this.content.el, this.scale);
            }

            delta.x = currentFocus.x - focus.x;
            delta.y = currentFocus.y - focus.y;

            newFocus.x = currentFocus.x - delta.x + (delta.x * scaleRatio);
            newFocus.y = currentFocus.y - delta.y + (delta.y * scaleRatio);

            this.setTransition(transition);
            this.setState({
                scale: scale,
                scaleOrigin: focus,
                focus: newFocus
            });

            return this;
        },

        /**
        * Zooms in/out and focus the camera on a specific point.
        *
        * @param {number} scale - A {@link CameraView.scale|scale} ratio.
        * @param {Object|Element} focus - A {@link CameraView.focus|focus} object.
        * @param {Object} [transition] - A {@link CameraView.transition|transition} object.
        * @returns {CameraView} The view.
        */
        zoomTo: function (scale, focus, transition) {
            transition = transition || {};

            this.setTransition(transition);
            this.setState({
                scale: scale,
                focus: focus
            });

            return this;
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