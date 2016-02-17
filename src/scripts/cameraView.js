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
        * Get the x/y offset in order to focus on a specific point.
        *
        * @private
        * @param {Object|Element} focus - A camera {@link CameraModel.defaults.state.focus|focus} object.
        * @param {number} scale - A {@link CameraModel.defaults.state.scale|scale} ratio.
        * @returns {Object} The focal offset: an 'x' {number}, 'y' {number} pixel coordinate object.
        */
        _getFocalOffset: function (focus, scale) {
            let offset = {};
            let position = {};
            let frameWidth = instance.el.getBoundingClientRect().width;
            let frameHeight = instance.el.getBoundingClientRect().height;

            if (_.isElement(focus)) {
                // TODO: Handle Element
                position = {
                    x: 0, // TODO: logic to get centerX of element
                    y: 0  // TODO: logic to get centerY of element
                };
            }
            else {
                position = focus;
            }

            // TODO: handle setup of 'position' better so _.isFinite check isn't necessary here.
            if (_.isFinite(position.x) && _.isFinite(position.y)) {
                offset.x = (frameWidth / 2) - (position.x * scale);
                offset.y = (frameHeight / 2) - (position.y * scale);
            }

            return offset;
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
            // TODO: Remove when development is complete
            console.log('_update');

            let focalOffset = instance._getFocalOffset(value.focus, value.scale);

            utils.setCssTransition(instance.content, value.transition);
            utils.setCssTransform(instance.content, {
                scale: value.scale,
                translateX: focalOffset.x,
                translateY: focalOffset.y
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
            event.preventDefault();
            document.querySelector('body').style.overflow = 'hidden';

            if (event.deltaY) {
                let direction = event.deltaY > 0 ? constants.zoom.OUT : constants.zoom.IN;
                let scale = instance.model.get('state').scale;
                let newScale = scale;
                let min = instance.model.get('minScale');
                let max = instance.model.get('maxScale');
                let origin = null;

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
        focus: function (focus, transition) {
            transition = transition || {};

            instance.model.setState({
                focus: focus
            }, transition);

            return instance;
        },

        /**
        * Called on the view instance when the view has been initialized.
        *
        * @returns {CameraView} The view.
        */
        onInitialize: function () {

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

            let state = instance.model.get('state');
            // TODO: Decide whether to use separate x/y variables or objects that have x/y properties.
            let deltaX = state.focus.x - focus.x;
            let deltaY = state.focus.y - focus.y;
            let scaleRatio = state.scale / scale;
            let newFocalPoint = {
                x: state.focus.x - deltaX + (deltaX * scaleRatio),
                y: state.focus.y - deltaY + (deltaY * scaleRatio)
            };

            instance.model.setState({
                scale: scale,
                scaleOrigin: focus,
                focus: newFocalPoint
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

    Object.assign(instance, options);

    instance.initialize = function () {
        instance.isTransitioning = false;
        instance.listenTo(instance.model, 'change:state', instance._update);
        
        if (instance.template) {
            instance.el.innerHTML = instance.template();
        }
        instance.content = instance.el.querySelector(':first-child');
        instance.content.setAttribute('draggable', false);
        
        instance.render();
        instance.onInitialize();
        
        return instance;
    };

    instance.render = function () {
        instance.setWidth(instance.width);
        instance.setHeight(instance.height);
        instance._update(instance.model, instance.model.get('state'), {});
        
        return instance;
    };

    instance.events = function () {
        return {
            'click'         : '_onClick',
            'mousedown'     : '_onMouseDown',
            'mouseleave'    : '_onMouseLeave',
            'mousemove'     : '_onMouseMove',
            'mouseup'       : '_onMouseUp',
            'wheel'         : utils.throttleToFrame(instance._wheelZoom),
            'transitionend' : '_onTransitionEnd'
        };
    };

    instance._onTransitionEnd = function (event) {
        instance.isTransitioning = false;
    };
    
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