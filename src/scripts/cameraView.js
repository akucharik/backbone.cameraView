'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Factory: Creates a camera to pan and zoom content.
* Requires {@link http://backbonejs.org|Backbone}, {@link http://lodash.com|lodash}, and {@link http://jquery.com|jQuery} or {@link http://zeptojs.com|Zepto}.
* 
* @constructs CameraView
* @extends Backbone.View
* @extends Focuser
* @extends SizableView
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link http://backbonejs.org/#View|Backbone.View}.
* @param {CameraModel} [options.model] - The view's model.
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
    new SizableView(),
    /**
    * @lends CameraView.prototype
    */                                                
    {
        // TODO: Refactor/clean up
        /**
        * Handle the click event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onClick: function (event) {
            console.log({ 
                x: event.clientX - this.content.getBoundingClientRect().left + window.scrollX,
                y: event.clientY - this.content.getBoundingClientRect().top + window.scrollX
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
        * Handle "height" change event.
        *
        * @private
        * @param {CameraModel} model - The camera's model.
        * @param {Objecty} value - The updated value.
        * @param {Object} options - An object of options.
        * @returns {CameraView} The view.
        */
        _onHeightChange: function (model, value, options) {
            this.setHeight(value);
            model.setTransition({ duration: '0s' });
            this.update(model);

            return this;
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
        * @param {CameraModel} model - The camera's model.
        * @param {Object} value - The updated value.
        * @param {Object} options - An object of options.
        * @returns {CameraView} The view.
        */
        _onStateChange: function (model, value, options) {
            this.update(model);

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
            this._wheelZoom(event);

            return this;
        },

        /**
        * Handle "width" change event.
        *
        * @private
        * @param {CameraModel} model - The camera's model.
        * @param {Objecty} value - The updated value.
        * @param {Object} options - An object of options.
        * @returns {CameraView} The view.
        */
        _onWidthChange: function (model, value, options) {
            this.setWidth(value);
            this.model.setTransition({ duration: '0s' });
            this.update(model);

            return this;
        },

        /**
        * Zoom in/out based on wheel input.
        *
        * @private
        * @param {MouseEvent} event - A MouseEvent object.
        * @returns {CameraView} The view.
        */
        _wheelZoom: function (event) {
            document.querySelector('body').style.overflow = 'hidden';

            if (event.deltaY) {
                var direction = event.deltaY > 0 ? constants.zoom.OUT : constants.zoom.IN;
                var scale = this.model.get('state').scale;
                var newScale = _.clamp(scale + this.scaleIncrement * Math.abs(event.deltaY) * scale * (direction === constants.zoom.IN ? 1 : -1), this.minScale, this.maxScale);
                var origin = null;

                // If scale has not changed, it is at the min or max.
                if (newScale !== scale) {
                    if (!this.isTransitioning) {
                        origin = {
                            x: (event.clientX - this.content.getBoundingClientRect().left) / scale,
                            y: (event.clientY - this.content.getBoundingClientRect().top) / scale
                        }
                    }
                    else {
                        origin = this.model.get('state').scaleOrigin;
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
            var state = this.model.get('state');
            var dragDelta = {
                x: (this.dragStartX - event.clientX) / state.scale,
                y: (this.dragStartY - event.clientY) / state.scale
            };
            var newFocus = {
                x: state.focus.x + dragDelta.x,
                y: state.focus.y + dragDelta.y
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
            var state = this.model.get('state');
            
            newFocus = {
                x: state.focus.x + velocity.x * (timeDelta / 1000),
                y: state.focus.y + velocity.y * (timeDelta / 1000)
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
        * Focus the camera on a specific point.
        *
        * @param {Object|Element} focus - A {@link CameraModel.defaultState.focus|focus} object.
        * @param {Object} [transition] - A {@link CameraModel.defaultTransition|transition} object.
        * @returns {CameraView} The view.
        */
        focusOn: function (focus, transition) {
            transition = transition || {};

            this.model.setTransition(transition);
            this.model.setState({
                focus: focus
            });

            return this;
        },

        /**
        * Called on the view this when the view has been created. This method is not meant to be overridden. If you need to access initialization, use {@link CameraView#onInitialize|onInitialize}.
        *
        * @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link http://backbonejs.org/#View|Backbone.View}.
        * @returns {CameraView} The view.
        */
        initialize: function (options) {
            var contentRect = options.content.getBoundingClientRect();
            
            /**
            * The content.
            * @name content
            * @property {Element} - The element to treat as the camera's content.
            * @memberOf CameraView
            */
            this.content = options.content || null;
            
            /**
            * The content's height.
            * @name contentHeight
            * @property {number} - The content's height.
            * @memberOf CameraView
            */
            this.contentHeight = contentRect.height;
            
            /**
            * The content's width.
            * @name contentWidth
            * @property {number} - The content's width.
            * @memberOf CameraView
            */
            this.contentWidth = contentRect.width;
            
            /**
            * The content's focusable bounds. If set, the camera will keep focus within the bounds.
            * @name bounds
            * @property {Object} - An object representing the content's focusable bounds.
            * @memberOf CameraView
            */
            this.bounds = options.bounds || {
                left: 0,
                right: this.contentWidth,
                top: 0,
                bottom: this.contentHeight
            };
            
            /**
            * The focus.
            * @name focus
            * @property {Object|Element} - An 'x' {number}, 'y' {number} pixel coordinate object or an Element.
            * @memberOf CameraView
            * @default null
            */
            this.focus = options.focus || null;
            
            /**
            * The camera's height.
            * @name height
            * @property {number|string|Element} - A number, a valid CSS height value, or an element. If an element is set, the camera's height will be sized to match the element.
            * @memberOf CameraView
            * @default null
            */
            this.height = options.height || null;
            
            /**
            * @name isDragging
            * @property {boolean} - Whether the content is being dragged or not.
            * @memberOf CameraView
            * @default false
            */
            this.isDragging = false;
            
            /**
            * @name isTransitioning
            * @property {boolean} - Whether the content is transitioning or not.
            * @memberOf CameraView
            * @default false
            */
            this.isTransitioning = false;
            
            /**
            * The maximum value the content can be scaled.
            * @name maxScale
            * @property {number} - See {@link CameraView.scale|scale}.
            * @memberOf CameraView
            * @default
            */
            this.maxScale = options.maxScale || 6.0;
            
            /**
            * The minimum value the content can be scaled.
            * @name minScale
            * @property {number} - See {@link CameraView.scale|scale}.
            * @memberOf CameraView
            * @default
            */
            this.minScale = options.minScale || 0.25;
            
            /**
            * The scale.
            * @name scale
            * @property {number} - A scale ratio where 1 = 100%.
            * @memberOf CameraView
            * @default
            */
            this.scale = options.scale || 1;
            
            /**
            * The base increment at which the content will be scaled.
            * @name scaleIncrement
            * @property {number} - See {@link CameraView.scale|scale}.
            * @memberOf CameraView
            * @default
            */
            this.scaleIncrement = options.scaleIncrement || 0.01;
            
            /**
            * The scale origin.
            * @name scaleOrigin
            * @property {Object} - An 'x' {number}, 'y' {number} pixel coordinate object.
            * @memberOf CameraView
            * @default null
            */
            this.scaleOrigin = options.scaleOrigin || null;
            
            /**
            * The camera's width.
            * @name width
            * @property {number|string|Element} - A number, a valid CSS width value, or an element. If an element is set, the camera's width will be sized to match the element.
            * @memberOf CameraView
            * @default null
            */
            this.width = options.width || null;
            
            // Set up content
            this.el.appendChild(this.content);
            this.content.setAttribute('draggable', false);
            
            // Initialize events
            this.$el.on('click', this._onClick.bind(this));
            this.$el.on('dragstart', this._onDragStart.bind(this));
            this.$el.on('mousedown', this._onMouseDown.bind(this));
            this.$el.on('mouseleave', this._onMouseLeave.bind(this));
            this.$el.on('mousemove', utils.throttleToFrame(this._onMouseMove.bind(this)));
            this.$el.on('mouseup', this._onMouseUp.bind(this));
            this.$el.on('transitionend', this._onTransitionEnd.bind(this));
            this.$el.on('wheel', utils.throttleToFrame(this._onWheel.bind(this)));
            this.listenTo(this.model, 'change:height', this._onHeightChange);
            this.listenTo(this.model, 'change:state', this._onStateChange);
            this.listenTo(this.model, 'change:width', this._onWidthChange);
            
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
        * @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link http://backbonejs.org/#View|Backbone.View}.
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
            
            this.setHeight(this.height);
            this.setWidth(this.width);
            this.model.setTransition({ duration: '0s' });
            
            // If no focus, set default focus
            if (!this.model.get('state').focus) { 
                var cameraRect = this.el.getBoundingClientRect();

                this.model.setState({ 
                    focus: {
                        x: cameraRect.width / 2,
                        y: cameraRect.height / 2
                    }
                });
            }
            else {
                this.update(this.model);
            }

            this.onRender();

            return this;
        },

        /**
        * Update camera to a state.
        *
        * @private
        * @param {Object} state - The {@link CameraModel.state|state}.
        * @param {Object} transition - The {@link CameraModel.transition|transition}.
        * @param {Object} [previousState] - The previous {@link CameraModel.state|state}. Only necessary when called from a "change:state" event.
        * @returns {CameraView} The view.
        */
        update: function (model) {
            // TODO: Remove once development is complete
            console.log('update');

            var state = model.get('state');
            var transition = model.get('transition');
            var previousState = model.previousAttributes().state;
            var position = {};

            if (_.isElement(state.focus)) {
                position = this.getElementFocus(window, this.content.getBoundingClientRect(), state.focus, previousState.scale);
            }
            else {
                position = state.focus;
            }

            if (!_.isFinite(state.scale)) {
                throw new Error('Cannot zoom using an invalid scale');
            }

            if (!_.isFinite(state.focus.x) && !_.isFinite(state.focus.y)) {
                throw new Error('Cannot focus using an invalid position');
            }
            
            if (this.bounds) {
                position = this.checkBounds(position);
                // TODO: Terrible! Refactor when model is removed and all properties are flattened on the view.
                this.model.get('state').focus = position;
            }
            
            var focusOffset = this.getFocusOffset(this.el.getBoundingClientRect(), position, state.scale);
            
            utils.setCssTransition(this.content, transition);
            utils.setCssTransform(this.content, {
                scale: state.scale,
                translateX: focusOffset.x,
                translateY: focusOffset.y
            }, this);

            return this;
        },

        /**
        * Zoom in/out at the current focus.
        *
        * @param {number} scale - A {@link CameraModel.defaultState.scale|scale} ratio.
        * @param {Object} [transition] - A {@link CameraModel.defaultTransition|transition} object.
        * @returns {CameraView} The view.
        */
        zoom: function (scale, transition) {
            transition = transition || {};

            this.model.setTransition(transition);
            this.model.setState({
                scale: scale
            });

            return this;
        },

        /**
        * Zoom in/out at a specific point.
        *
        * @param {number} scale - A {@link CameraModel.defaultState.scale|scale} ratio.
        * @param {Object|Element} focus - A {@link CameraModel.defaultState.focus|focus} object.
        * @param {Object} [transition] - A {@link CameraModel.defaultTransition|transition} object.
        * @returns {CameraView} The view.
        */
        zoomAt: function (scale, focus, transition) {
            transition = transition || {};
            var currentFocus, scaleRatio, state;
            var delta = {};
            var newFocus = {};

            state = this.model.get('state');
            scaleRatio = state.scale / scale;
            currentFocus = state.focus;

            if (_.isElement(focus)) {
                focus = this._getElementFocus(focus, this.content, state.scale);
            }

            if (_.isElement(currentFocus)) {
                currentFocus = this._getElementFocus(currentFocus, this.content, state.scale);
            }

            delta.x = currentFocus.x - focus.x;
            delta.y = currentFocus.y - focus.y;

            newFocus.x = currentFocus.x - delta.x + (delta.x * scaleRatio);
            newFocus.y = currentFocus.y - delta.y + (delta.y * scaleRatio);

            this.model.setTransition(transition);
            this.model.setState({
                scale: scale,
                scaleOrigin: focus,
                focus: newFocus
            });

            return this;
        },

        /**
        * Zoom in/out and focus the camera on a specific point.
        *
        * @param {number} scale - A {@link CameraModel.defaultState.scale|scale} ratio.
        * @param {Object|Element} focus - A {@link CameraModel.defaultState.focus|focus} object.
        * @param {Object} [transition] - A {@link CameraModel.defaultTransition|transition} object.
        * @returns {CameraView} The view.
        */
        zoomTo: function (scale, focus, transition) {
            transition = transition || {};

            this.model.setTransition(transition);
            this.model.setState({
                scale: scale,
                focus: focus
            });

            return this;
        }
    })
);