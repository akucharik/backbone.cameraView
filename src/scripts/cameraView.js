'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Factory: Creates a camera to pan and zoom content.
* Requires {@link http://lodash.com|lodash} or {@link http://underscorejs.org|underscore} and {@link http://jquery.com|jQuery} or {@link http://zeptojs.com|Zepto}.
* 
* @constructs CameraView
* @extends Backbone.View
* @extends SizableView
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link http://backbonejs.org/#View|Backbone.View}.
* @param {CameraModel} [options.model] - The view's model.
* @param {number|string|Element} [options.width] - The view's width. See {@link SizableView#setWidth|SizableView.setWidth}.
* @param {number|string|Element} [options.height] - The view's height. See {@link SizableView#setHeight|SizableView.setHeight}.
* @returns {CameraView} The newly created CameraView object.
*/
var CameraView = function (options) {
    /**
    * @lends CameraView.prototype
    */
    let prototype = {
        /**
        * Get the x/y focus for an Element.
        *
        * @private
        * @param {Element} el - The Element.
        * @param {Element} content - The camera's main content Element.
        * @param {number} scale - The current {@link CameraModel.defaults.state.scale|scale} ratio.
        * @returns {Object} A camera {@link CameraModel.defaults.state.focus|focus} object representing the center point of the Element in relation to the camera's content.
        */
        _getElementFocus: function (el, content, scale) {
            var focus = {};
            var elRect = el.getBoundingClientRect();
            var contentRect = content.getBoundingClientRect();
            
            focus.x = (elRect.width / scale / 2) + (elRect.left / scale + window.scrollX) - (contentRect.left / scale + window.scrollX);
            focus.y = (elRect.height / scale / 2) + (elRect.top / scale + window.scrollY) - (contentRect.top / scale + window.scrollY);
            
            return focus;
        },
        
        /**
        * Get the x/y offset in order to focus on a specific point.
        *
        * @private
        * @param {Object|Element} focus - A camera {@link CameraModel.defaults.state.focus|focus} object.
        * @param {number} scale - A {@link CameraModel.defaults.state.scale|scale} ratio.
        * @returns {Object} The focus offset: an 'x' {number}, 'y' {number} pixel coordinate object.
        */
        _getFocusOffset: function (focus, scale) {
            var offset = {};
            var frameWidth = instance.el.getBoundingClientRect().width;
            var frameHeight = instance.el.getBoundingClientRect().height;

            if (_.isElement(focus)) {
                focus = instance._getElementFocus(focus, instance.content, scale);
            }

            if (_.isFinite(focus.x) && _.isFinite(focus.y)) {
                offset.x = _.round((frameWidth / 2) - (focus.x * scale), 2);
                offset.y = _.round((frameHeight / 2) - (focus.y * scale), 2);
            }
            else {
                throw new Error('Cannot determine focus offset from invalid focus coordinates');
            }

            return offset;
        },
        
        /**
        * Track when a camera transition is over.
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
        * Respond wheel input.
        *
        * @private
        * @param {MouseEvent} event - A MouseEvent object.
        * @returns {CameraView} The view.
        */
        _onWheel: function (event) { console.log('wheel');
            event.preventDefault();
            instance._wheelZoom(event);
            
            return instance;
        },
        
        /**
        * Set the camera's height.
        *
        * @private
        * @param {CameraModel} model - The camera's model.
        * @param {Objecty} value - The updated value.
        * @param {Object} options - An object of options.
        * @returns {CameraView} The view.
        */
        _setHeight: function (model, value, options) {
            instance.setHeight(value);
            // TODO: Ideally the camera will keep the current focus in the center after the height change.
            
            return instance;
        },
        
        /**
        * Set the camera's width.
        *
        * @private
        * @param {CameraModel} model - The camera's model.
        * @param {Objecty} value - The updated value.
        * @param {Object} options - An object of options.
        * @returns {CameraView} The view.
        */
        _setWidth: function (model, value, options) {
            instance.setWidth(value);
            // TODO: Ideally the camera will keep the current focus in the center after the width change.
            
            return instance;
        },

        /**
        * Update camera to the current state.
        *
        * @private
        * @param {CameraModel} model - The camera's model.
        * @param {Objecty} value - The updated value.
        * @param {Object} options - An object of options.
        * @returns {CameraView} The view.
        */
        _update: function (model, value, options) {
            var focusOffset = instance._getFocusOffset(value.focus, value.scale);

            utils.setCssTransition(instance.content, value.transition);
            utils.setCssTransform(instance.content, {
                scale: value.scale,
                translateX: focusOffset.x,
                translateY: focusOffset.y
            }, instance);

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
                var newScale = scale;
                var min = instance.model.get('minScale');
                var max = instance.model.get('maxScale');
                var origin = null;

                newScale = scale + instance.model.get('increment') * Math.abs(event.deltaY) * scale * (direction === constants.zoom.IN ? 1 : -1);

                if (newScale < min) {
                    newScale = min;
                }
                else if (newScale > max) {
                    newScale = max;
                }

                // If scale has changed, it is within the min/max.
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
        
        /**
        * Focus the camera on a specific point.
        *
        * @param {Object|Element} focus - A camera {@link CameraModel.defaults.state.focus|focus} object.
        * @param {Object} [transition] - A camera {@link CameraModel.defaults.transition|transition} object.
        * @returns {CameraView} The view.
        */
        focusOn: function (focus, transition) {
            transition = transition || {};

            instance.model.setState({
                focus: focus
            }, transition);

            return instance;
        },

        /**
        * Called on the view instance when the view has been created. This method is not meant to be overridden. If you need to access initialization, use {@link CameraView#onInitialize|onInitialize}.
        *
        * @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link http://backbonejs.org/#View|Backbone.View}.
        * @returns {CameraView} The view.
        */
        initialize: function (options) {
            instance.isTransitioning = false;
            instance.$el.on('click', instance._onClick);
            instance.$el.on('mousedown', instance._onMouseDown);
            instance.$el.on('mouseleave', instance._onMouseLeave);
            instance.$el.on('mousemove', instance._onMouseMove);
            instance.$el.on('mouseup', instance._onMouseUp);
            instance.$el.on('transitionend', instance._onTransitionEnd);
            instance.$el.on('wheel', utils.throttleToFrame(instance._onWheel));
            instance.listenTo(instance.model, 'change:height', instance._setHeight);
            instance.listenTo(instance.model, 'change:width', instance._setWidth);
            instance.listenTo(instance.model, 'change:state', instance._update);
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
            // TODO: Ideally the camera's focus will default to the center of the content
            instance.onRender();
            instance._update(instance.model, instance.model.get('state'), {});

            return instance;
        },
        
        /**
        * Zoom in/out at the current focus.
        *
        * @param {number} scale - A {@link CameraModel.defaults.state.scale|scale} ratio.
        * @param {Object} [transition] - A camera {@link CameraModel.defaults.transition|transition} object.
        * @returns {CameraView} The view.
        */
        zoom: function (scale, transition) {
            transition = transition || {};

            instance.model.setState({
                scale: scale
            }, transition);

            return instance;
        },
        
        /**
        * Zoom in/out at a specific point.
        *
        * @param {number} scale - A {@link CameraModel.defaults.state.scale|scale} ratio.
        * @param {Object|Element} focus - A camera {@link CameraModel.defaults.state.focus|focus} object.
        * @param {Object} [transition] - A camera {@link CameraModel.defaults.transition|transition} object.
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
            
            instance.model.setState({
                scale: scale,
                scaleOrigin: focus,
                focus: newFocus
            }, transition);

            return instance;
        },

        /**
        * Zoom in/out and focus the camera on a specific point.
        *
        * @param {number} scale - A {@link CameraModel.defaults.state.scale|scale} ratio.
        * @param {Object|Element} focus - A camera {@link CameraModel.defaults.state.focus|focus} object.
        * @param {Object} [transition] - A camera {@link CameraModel.defaults.transition|transition} object.
        * @returns {CameraView} The view.
        */
        zoomTo: function (scale, focus, transition) {
            transition = transition || {};

            instance.model.setState({
                scale: scale,
                focus: focus
            }, transition);

            return instance;
        }
    };
    
    // Compose the object.
    let instance = Object.create(Object.assign(
        {},
        Backbone.View.prototype, 
        SizableView(), 
        prototype
    ));

    // TODO: don't merge all the options onto the view. Figure out something better.
    Object.assign(instance, options);
    
    // TODO: Refactor/clean up and move into prototype
    /**
    * Handle click event.
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

    // TODO: Refactor/clean up and move into prototype
    /**
    * Prevent mousemove event from doing anything.
    *
    * @private
    */
    instance._stop = function () {
        instance.isActive = false;
    };

    // TODO: Refactor/clean up and move into prototype
    /**
    * Handle mousedown event.
    *
    * @private
    * @param {MouseEvent} event - The mouse event.
    */
    instance._onMouseDown = function (event) {
        //console.log(instance.el.getBoundingClientRect());
        //console.log('top: ', instance.el.getBoundingClientRect().top + window.scrollY);
        instance.moveStartX = event.clientX;
        instance.moveStartY = event.clientY;
        instance.contentStartX = instance.content.getBoundingClientRect().left + window.scrollX - instance.el.getBoundingClientRect().left + window.scrollX;
        instance.contentStartY = instance.content.getBoundingClientRect().top + window.scrollY - instance.el.getBoundingClientRect().top + window.scrollY;

        instance.isActive = true;

        //console.log('scrollTop: ', instance.el.scrollTop);
        //console.log('scrollLeft: ', instance.el.scrollLeft);
        //console.log('scrollWidth: ', instance.el.scrollWidth);
        //console.log('scrollHeight: ', instance.el.scrollHeight);
        //console.log('eventX: ', event.clientX);
        //console.log('eventY: ', event.clientY);
        //console.log('elX: ', instance.el.getBoundingClientRect());
        //console.log('elY: ', instance.el.getBoundingClientRect());
        //console.log('mouse startX: ', instance.startX);
        //console.log('mouse startY: ', instance.startY);
        //console.log('content startX: ', instance.content.getBoundingClientRect().left - instance.el.getBoundingClientRect().left);
        //console.log('content startY: ', instance.content.getBoundingClientRect().top - instance.el.getBoundingClientRect().top);
    };

    // TODO: Refactor/clean up and move into prototype
    /**
    * Handle mouseleave event.
    *
    * @private
    * @param {MouseEvent} event - The mouse event.
    */
    instance._onMouseLeave = function (event) {
        instance._stop();
        // TODO: Instead of reverting to 'auto' remove the inline style rule to let any applied stylesheet rule kick in. 
        document.querySelector('body').style.removeProperty('overflow');
    };

    // TODO: Refactor/clean up and move into prototype
    /**
    * Handle mousemove event.
    *
    * @private
    * @param {MouseEvent} event - The mouse event.
    */
    instance._onMouseMove = function (event) {
        // TODO: Refactor. Add drag-ability of content when zoomed in/out.
        if (instance.isActive) {
            console.log('move');
            // Handle vertical bounds
            if (instance.contentStartX + event.clientX - instance.moveStartX < 0) {
                instance.content.style.left = (instance.contentStartX + event.clientX - instance.moveStartX) + 'px';
            }
            if (instance.contentStartX + event.clientX - instance.moveStartX >= 0) {
                instance.moveStartX = event.clientX;
                instance.contentStartX = 0;
                instance.content.style.left = 0 + 'px';
            }
            if (instance.contentStartX + event.clientX - instance.moveStartX <= instance.el.clientWidth - instance.content.getBoundingClientRect().width) {
                instance.moveStartX = event.clientX;
                instance.contentStartX = instance.el.clientWidth - instance.content.getBoundingClientRect().width;
                instance.content.style.left = instance.el.clientWidth - instance.content.getBoundingClientRect().width + 'px';
            }

            // Handle horizontal bounds
            if (instance.contentStartY + event.clientY - instance.moveStartY < 0) {
                instance.content.style.top = (instance.contentStartY + event.clientY - instance.moveStartY) + 'px';
            }
            if (instance.contentStartY + event.clientY - instance.moveStartY >= 0) {
                instance.moveStartY = event.clientY;
                instance.contentStartY = 0;
                instance.content.style.top = 0 + 'px';
            }
            if (instance.contentStartY + event.clientY - instance.moveStartY <= instance.el.clientHeight - instance.content.getBoundingClientRect().height) {
                instance.moveStartY = event.clientY;
                instance.contentStartY = instance.el.clientHeight - instance.content.getBoundingClientRect().height;
                instance.content.style.top = instance.el.clientHeight - instance.content.getBoundingClientRect().height + 'px';
            }
        }
    };

    // TODO: Refactor/clean up and move into prototype
    /**
    * Handle mouseup event.
    *
    * @private
    * @param {MouseEvent} event - The mouse event.
    */
    instance._onMouseUp = function (event) {
        instance._stop();
    };

    Backbone.View.call(instance, options);

    return instance;
};