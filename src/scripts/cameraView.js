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
* @returns {CameraView} The newly created CameraView object.
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
                var newScale = _.clamp(scale + this.model.get('increment') * Math.abs(event.deltaY) * scale * (direction === constants.zoom.IN ? 1 : -1), this.model.get('minScale'), this.model.get('maxScale'));
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

                    this.zoomAt(newScale, origin, {
                        duration: '100ms'
                    });
                }
            }

            return this;
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
                x: _.clamp(state.focus.x + dragDelta.x, 0, this.content.getBoundingClientRect().width / state.scale),
                y: _.clamp(state.focus.y + dragDelta.y, 0, this.content.getBoundingClientRect().height / state.scale)
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
                var state = this.model.get('state');
    //                var duration = 750;
    //                var newFocus = {
    //                    x: state.focus.x + (this.velocity.x) * (duration / 1000),
    //                    y: state.focus.y + (this.velocity.y) * (duration / 1000)
    //                };

                var previousTime = performance.now();
                window.requestAnimationFrame(function (timestamp) { 
                    _this.dragDeccelerate(_this.velocity, timestamp - previousTime, timestamp);
                });

    //                this.focusOn(newFocus, { 
    //                    duration: duration + 'ms',
    //                    timingFunction: 'ease-out'
    //                });
            }

            this.isDragging = false;

            return this;
        },

        // TODO: Messy animation/decceleration.
        // Clean up to generic accelerate that takes args: acceleration, velocity, threshold
        dragDeccelerate: function (velocity, timeDelta, timestamp, elapsed) {
            var _this = this;
            var complete = false;
            elapsed = elapsed + timeDelta || timeDelta;
            if (elapsed > 750) {
                timeDelta = elapsed - 750;
                elapsed = 750;
                complete = true;
            }

            velocity.x = velocity.x || 0;
            velocity.y = velocity.y || 0;

            var previousTime = timestamp;
            var state = this.model.get('state');
            var duration = 750 / 1000;
    //            var incrementX = velocity.x * duration;
    //            var incrementY = velocity.y * duration;
            var incrementX = velocity.x;
            var incrementY = velocity.y;

            var newVelocity = {
                x: velocity.x * (1 - 0.1),
                y: velocity.y * (1 - 0.1)
            };

            var newFocus = {
                x: state.focus.x + incrementX * (timeDelta / 1000),
                y: state.focus.y + incrementY * (timeDelta / 1000)
            };

            console.log('deccelerate');
            console.log('velocity: ', velocity);
            console.log('timeDelta: ', timeDelta);
            console.log('elapsed: ', elapsed);
            console.log('incrementX: ', incrementX);

            this.focusOn(newFocus, { 
                duration: '100ms'
            });

            if (Math.abs(velocity.x - newVelocity.x) > 3 || Math.abs(velocity.x - newVelocity.y) > 3) {
                window.requestAnimationFrame(function (timestamp) { 
                    _this.dragDeccelerate(newVelocity, timestamp - previousTime, timestamp, elapsed);
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
            this.isDragging = false;
            this.isTransitioning = false;
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
            this.content = this.el.querySelector(':first-child');
            this.content.setAttribute('draggable', false);
            this.setHeight(this.model.get('height'));
            this.setWidth(this.model.get('width'));
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