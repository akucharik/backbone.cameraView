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
var CameraView = function (options) {
    /**
    * @lends CameraView.prototype
    */
    let prototype = {
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
            instance.setHeight(value);
            model.setTransition({ duration: '0s' });
            instance.update(model);
            
            return instance;
        },
        
        /**
        * Handle the mousedown event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onMouseDown: function (event) {
            instance.isDragging = true;
            
            // Set time for calculating velocity.
            instance.previousEventTime = event.timeStamp;
            
            // Set x/y point for calculating move distance.
            instance.dragStartX = event.clientX;
            instance.dragStartY = event.clientY;
        },
        
        /**
        * Handle the mouseleave event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onMouseLeave: function (event) {
            instance.isDragging = false;
            document.querySelector('body').style.removeProperty('overflow');
        },
        
        /**
        * Handle the mousemove event.
        *
        * @private
        * @param {MouseEvent} event - The mouse event.
        */
        _onMouseMove: function (event) {
            if (instance.isDragging) {
                instance.drag(event);
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
            
            if (instance.isDragging) {
                instance.dragEnd(event);
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
            instance.update(model);

            return instance;
        },
        
        /**
        * Handle the end of a camera transition.
        *
        * @private
        * @param {Event} event - The event object.
        * @returns {CameraView} The view.
        */
        _onTransitionEnd: function (event) {
            instance.isTransitioning = false;
            
            return instance;
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
            instance._wheelZoom(event);
            
            return instance;
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
            instance.setWidth(value);
            instance.model.setTransition({ duration: '0s' });
            instance.update(model);
            
            return instance;
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
                var scale = instance.model.get('state').scale;
                var newScale = _.clamp(scale + instance.model.get('increment') * Math.abs(event.deltaY) * scale * (direction === constants.zoom.IN ? 1 : -1), instance.model.get('minScale'), instance.model.get('maxScale'));
                var origin = null;
                
                // If scale has not changed, it is at the min or max.
                if (newScale !== scale) {
                    if (!instance.isTransitioning) {
                        origin = {
                            x: (event.clientX - instance.content.getBoundingClientRect().left) / scale,
                            y: (event.clientY - instance.content.getBoundingClientRect().top) / scale
                        }
                    }
                    else {
                        origin = instance.model.get('state').scaleOrigin;
                    }

                    instance.zoomAt(newScale, origin, {
                        duration: '100ms'
                    });
                }
            }
            
            return instance;
        },
        
        // TODO: Messy! Refactor!
        /**
        * Drag the content.
        *
        * @param {DragEvent} event - The drag event.
        */
        drag: function (event) {
            var state = instance.model.get('state');
            var dragDelta = {
                x: (instance.dragStartX - event.clientX) / state.scale,
                y: (instance.dragStartY - event.clientY) / state.scale
            };
            var newFocus = {
                x: _.clamp(state.focus.x + dragDelta.x, 0, instance.content.getBoundingClientRect().width / state.scale),
                y: _.clamp(state.focus.y + dragDelta.y, 0, instance.content.getBoundingClientRect().height / state.scale)
            };
            
            var eventTimeDelta = event.timeStamp - instance.previousEventTime;
            
            instance.velocity = {
                x: dragDelta.x / (eventTimeDelta / 1000),
                y: dragDelta.y / (eventTimeDelta / 1000)
            };

            // Log timestamp
            instance.previousEventTime = event.timeStamp;
            
            // Set x/y point for calculating next move distance
            instance.dragStartX = event.clientX;
            instance.dragStartY = event.clientY;

            instance.focusOn(newFocus, { 
                duration: '0s'
            });

            return instance;
        },
        
        // TODO: Refactor into a function that repeats on RAF similar to zoomAt so that decceleration and bounds can work together.
        /**
        * End dragging the content.
        *
        * @param {MouseEvent} event - The mouse event.
        */
        dragEnd: function (event) {
            var eventTimeDelta = event.timeStamp - instance.previousEventTime;

            // Only apply momentum movement if dragging has not stopped
            if (eventTimeDelta < 66.6) {
                var state = instance.model.get('state');
//                var duration = 750;
//                var newFocus = {
//                    x: state.focus.x + (instance.velocity.x) * (duration / 1000),
//                    y: state.focus.y + (instance.velocity.y) * (duration / 1000)
//                };
                
                var previousTime = performance.now();
                window.requestAnimationFrame(function (timestamp) { 
                    instance.dragDeccelerate(instance.velocity, timestamp - previousTime, timestamp);
                });

//                instance.focusOn(newFocus, { 
//                    duration: duration + 'ms',
//                    timingFunction: 'ease-out'
//                });
            }
            
            instance.isDragging = false;
            
            return instance;
        },
        
        // TODO: Messy animation/decceleration.
        // Clean up to generic accelerate that takes args: acceleration, velocity, threshold
        dragDeccelerate: function (velocity, timeDelta, timestamp, elapsed) {
            var complete = false;
            elapsed = elapsed + timeDelta || timeDelta;
            if (elapsed > 750) {
                timeDelta = elapsed - 750;
                elapsed = 750;
                complete = true;
            }
            
            var previousTime = timestamp;
            var state = instance.model.get('state');
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
            
            instance.focusOn(newFocus, { 
                duration: '100ms'
            });
            
            if (Math.abs(velocity.x - newVelocity.x) > 3 || Math.abs(velocity.x - newVelocity.y) > 3) {
                window.requestAnimationFrame(function (timestamp) { 
                    instance.dragDeccelerate(newVelocity, timestamp - previousTime, timestamp, elapsed);
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

            instance.model.setTransition(transition);
            instance.model.setState({
                focus: focus
            });

            return instance;
        },

        /**
        * Called on the view instance when the view has been created. This method is not meant to be overridden. If you need to access initialization, use {@link CameraView#onInitialize|onInitialize}.
        *
        * @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link http://backbonejs.org/#View|Backbone.View}.
        * @returns {CameraView} The view.
        */
        initialize: function (options) {
            instance.isDragging = false;
            instance.isTransitioning = false;
            instance.$el.on('click', instance._onClick);
            instance.$el.on('dragstart', instance._onDragStart);
            instance.$el.on('mousedown', instance._onMouseDown);
            instance.$el.on('mouseleave', instance._onMouseLeave);
            instance.$el.on('mousemove', utils.throttleToFrame(instance._onMouseMove));
            instance.$el.on('mouseup', instance._onMouseUp);
            instance.$el.on('transitionend', instance._onTransitionEnd);
            instance.$el.on('wheel', utils.throttleToFrame(instance._onWheel));
            instance.listenTo(instance.model, 'change:height', instance._onHeightChange);
            instance.listenTo(instance.model, 'change:state', instance._onStateChange);
            instance.listenTo(instance.model, 'change:width', instance._onWidthChange);
            instance.onInitialize(options);

            return instance;
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
            instance.onBeforeRender();
            instance.content = instance.el.querySelector(':first-child');
            instance.content.setAttribute('draggable', false);
            instance.setHeight(instance.model.get('height'));
            instance.setWidth(instance.model.get('width'));
            instance.model.setTransition({ duration: '0s' });
            
            // If no focus, set default focus
            if (!instance.model.get('state').focus) { 
                var cameraRect = instance.el.getBoundingClientRect();
                
                instance.model.setState({ 
                    focus: {
                        x: cameraRect.width / 2,
                        y: cameraRect.height / 2
                    }
                });
            }
            else {
                instance.update(instance.model);
            }
            
            instance.onRender();

            return instance;
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
                position = instance.getElementFocus(window, instance.content.getBoundingClientRect(), state.focus, previousState.scale);
            }
            else {
                position = state.focus;
            }
            
            var focusOffset = instance.getFocusOffset(instance.el.getBoundingClientRect(), position, state.scale);

            utils.setCssTransition(instance.content, transition);
            utils.setCssTransform(instance.content, {
                scale: state.scale,
                translateX: focusOffset.x,
                translateY: focusOffset.y
            }, instance);

            return instance;
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

            instance.model.setTransition(transition);
            instance.model.setState({
                scale: scale
            });

            return instance;
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
            
            state = instance.model.get('state');
            scaleRatio = state.scale / scale;
            currentFocus = state.focus;
            
            if (_.isElement(focus)) {
                focus = instance._getElementFocus(focus, instance.content, state.scale);
            }
            
            if (_.isElement(currentFocus)) {
                currentFocus = instance._getElementFocus(currentFocus, instance.content, state.scale);
            }
            
            delta.x = currentFocus.x - focus.x;
            delta.y = currentFocus.y - focus.y;
            
            newFocus.x = currentFocus.x - delta.x + (delta.x * scaleRatio);
            newFocus.y = currentFocus.y - delta.y + (delta.y * scaleRatio);
            
            instance.model.setTransition(transition);
            instance.model.setState({
                scale: scale,
                scaleOrigin: focus,
                focus: newFocus
            });

            return instance;
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

            instance.model.setTransition(transition);
            instance.model.setState({
                scale: scale,
                focus: focus
            });

            return instance;
        }
    };
    
    // Compose the object.
    let instance = Object.create(Object.assign(
        {},
        Backbone.View.prototype, 
        Focuser.prototype,
        SizableView(), 
        prototype
    ));

    // TODO: don't merge all the options onto the view. Figure out something better.
    Object.assign(instance, options);
    
    // TODO: Refactor/clean up and move into prototype
    /**
    * Handle the click event.
    *
    * @private
    * @param {MouseEvent} event - The mouse event.
    */
    instance._onClick = function (event) {
        console.log({ 
            x: event.clientX - instance.content.getBoundingClientRect().left + window.scrollX,
            y: event.clientY - instance.content.getBoundingClientRect().top + window.scrollX
        });
    };

    Backbone.View.call(instance, options);

    return instance;
};