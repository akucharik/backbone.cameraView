'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Factory: Creates {@link http://backbonejs.org/#View|Backbone.View} height and width sizing functionality used for object composition.
*
* @constructs SizableView
* @extends Backbone.View
* @returns {SizableView} A new SizableView object.
*/
var SizableView = function () {
    /**
    * @lends SizableView.prototype
    */
    var instance = {};

    /**
    * Sets the height of the view.
    *
    * @param {number|string|Element} height - A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
    */
    instance.setHeight = function (height) {
        if (_.isNumber(height)) {
            this.$el.height(height);
        }
        else if (_.isElement(height)) {
            this.$el.height(height.clientHeight);
        }
        else if (_.isFunction(height)) {
            this.$el.height(height());
        }
    };

    /**
    * Sets the width of the view.
    *
    * @param {number|string|Element} width - A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
    */
    instance.setWidth = function (width) {
        if (_.isNumber(width)) {
            this.$el.width(width);
        }
        else if (_.isElement(width)) {
            this.$el.width(width.clientWidth);
        }
        else if (_.isFunction(width)) {
            this.$el.width(width());
        }
    };

    return instance;
};

/**
* @namespace constants
*/
var constants = {
    /**
    * @namespace
    * @memberof constants
    */
    defaults: {
        /**
        * @readonly
        * @constant {number}
        * @default
        */
        PIXEL_PRECISION: 2,
        TRANSITION: {
            /**
            * @readonly
            * @constant {string}
            * @default
            */
            DELAY: '0s',
            /**
            * @readonly
            * @constant {string}
            * @default
            */
            DURATION: '500ms',
            PROPERTY: 'transform',
            /**
            * @readonly
            * @constant {string}
            * @default
            */
            TIMING_FUNCTION: 'ease-out'
        }
    },
    /**
    * Enum for zoom direction.
    * @enum {number}
    * @memberof constants
    */
    zoom: {
        /**
        * Zoom in.
        * @readonly
        */
        IN: 1,
        /**
        * Zoom out.
        * @readonly
        */
        OUT: 0
    }
};

/**
* Factory: Creates a CameraView's model.
*
* @constructs CameraModel
* @extends Backbone.Model
* @param {Object} [options] - The options object.
* @param {number} [options.scale=1] - The starting zoom of the view's content. 
* @param {number} [options.increment=0.02] - The base increment at which the content will be zoomed.
* @param {number} [options.minScale=0.1] - The minimum value the content can be zoomed.
* @param {number} [options.maxScale=4.0] - The maximum value the content can be zoomed.
* @param {number} [options.focus]
* @param {number} [options.transition]
* @param {number} [options.defaultTransition]
* @returns {CameraModel} A new CameraModel object.
*/
var CameraModel = function (options) {
    var instance = Object.create(Object.assign(
        Backbone.Model.prototype, {
            defaults: {
                /**
                * The current zoom value.
                * @property {number}
                */
                scale: 1,
                /**
                * The base increment at which the content will be zoomed.
                * @property {number}
                */
                increment: 0.02,
                /**
                * The minimum value the content can be zoomed.
                * @property {number}
                */
                minScale: 0.1,
                /**
                * The maximum value the content can be zoomed.
                * @property {number}
                */
                maxScale: 4.0,
                /**
                * The camera's focal point.
                * @property {Object}
                */
                focus: {
                    x: 500,
                    y: 250
                },
                transition: {
                    delay: '0s',
                    duration: '500ms',
                    property: 'transform',
                    timingFunction: 'ease-out'
                },
                defaultTransition: {
                    delay: '0s',
                    duration: '500ms',
                    property: 'transform',
                    timingFunction: 'ease-out'
                }
            }
        }
    ));

    instance.initialize = function () {

    };

    Backbone.Model.call(instance, options);

    return instance;
};

/**
* Factory: Creates a camera to pan and zoom content.
*
* @constructs CameraView
* @extends Backbone.View
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link http://backbonejs.org/#View|Backbone.View}
* @param {CameraModel} [options.model] - The view's model.
* @param {number|string|Element} [options.width] - The view's width. A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
* @param {number|string|Element} [options.height] - The view's height. A number will be converted to pixels. A valid CSS string may also be used. If an Element is provided, the dimension will be sized to match the Element.
* @returns {CameraView} The newly created CameraView object.
*/
var CameraView = function (options) {
    /**
    * @lends CameraView.prototype
    */
    var instance = Object.create(Object.assign(
        Backbone.View.prototype, SizableView()
    ));

    Object.assign(instance, options);

    instance.initialize = function () {
        instance.listenTo(instance.model, 'change:scale', function (model, value, options) {
            instance.focus(options);
        });
        instance.listenTo(instance.model, 'change:focus', function (model, value, options) { 
            instance.focus(options);
        });
        instance.listenTo(instance.model, 'change:transition', function (model, value, options) { 
            utils.setCssTransition(instance.content, value);
        });
        
        return instance;
    };

    instance.render = function () {
        instance.el.innerHTML = instance.template();
        instance.content = instance.el.querySelector(':first-child');
        instance.content.setAttribute('draggable', false);
        instance.update();

        return instance;
    };

    instance.update = function () {
        instance.setWidth(instance.width);
        instance.setHeight(instance.height);

        utils.setCssTransition(instance.content, instance.model.get('transition'));
        instance.focus({ duration: '0s'});

        return instance;
    };

    instance.events = function () {
        return {
            'click'      : 'onClick',
            'mouseenter' : 'onMouseEnter',
            'mousedown'  : 'onMouseDown',
            'mouseleave' : 'onMouseLeave',
            'mousemove'  : 'onMouseMove',
            'mouseup'    : 'onMouseUp',
            'wheel'      : utils.throttleToFrame(instance.onWheel)
        };
    };

    instance.onClick = function ($event) {
        var event = $event.originalEvent;
        console.log({ 
            x: event.clientX - instance.content.getBoundingClientRect().left + window.scrollX,
            y: event.clientY - instance.content.getBoundingClientRect().top + window.scrollX
        });
    };

    instance.stop = function () {
        instance.isActive = false;
    };

    instance.onMouseDown = function ($event) {
        // TODO: Remove console.log() when development is complete.
        //console.log($event.originalEvent);

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

    instance.onMouseEnter = function ($event) {
        document.querySelector('body').style.overflow = 'hidden';
    };

    instance.onMouseLeave = function ($event) {
        instance.stop();
        // TODO: Instead of reverting to 'auto' remove the inline style rule to let any applied stylesheet rule kick in. 
        document.querySelector('body').style.removeProperty('overflow');
    };

    instance.onMouseMove = function ($event) {
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

    instance.onMouseUp = function ($event) {
        instance.stop();
    };

    /**
    * Handle wheel input.
    *
    * @param {$event} $event - A jQuery event object.
    */
    instance.onWheel = function ($event) {
        var event = $event.originalEvent;

        event.preventDefault();
        instance.wheelZoom(event);
    };

    /**
    * Zoom in/out based on wheel input.
    *
    * @param {MouseEvent} event - A MouseEvent object.
    */
    instance.wheelZoom = function (event) {
        if (event.deltaY) {
            var _precision = constants.defaults.PIXEL_PRECISION;
            var _direction = null;
            var _delta = 0;
            var _scale = instance.model.get('scale');
            var _newScale = _scale;
            var _increment = instance.model.get('increment');
            var _min = instance.model.get('minScale');
            var _max = instance.model.get('maxScale');
            var _originX = (event.clientX - instance.content.getBoundingClientRect().left) / _scale;
            var _originY = (event.clientY - instance.content.getBoundingClientRect().top) / _scale;

            if (event.deltaY) {
                _direction = event.deltaY > 0 ? constants.zoom.OUT : constants.zoom.IN;
            } 
            else if (event.wheelDelta) {
                _direction = event.deltaY > 0 ? constants.zoom.OUT : constants.zoom.IN;
            } 
            else if (event.detail) {
                _direction = event.detail > 0 ? constants.zoom.OUT : constants.zoom.IN;
            }

            // TODO: Use of '_delta' and 'increment' are sloppy and confusing. Clean up.
            // Limit max zoom speed
            _delta = Math.min(Math.abs(event.deltaY), 10) * (_direction === constants.zoom.IN ? 1 : -1);
            console.log(_delta);

            // TODO: Calculate a smoother progressive zoom increment: see https://github.com/fengyuanchen/viewerjs/blob/master/src/js/methods.js "zoom" method
            if (_scale <= 2) {
                _increment = _.round(_increment * _scale, _precision);
            }
            else {
                _increment = _.round(_increment + (Math.round(_scale) / 100), _precision);
            }

            console.log('zIncrement: ', _increment);

            // Determine zoom
            _newScale = _.round(_scale + _increment * _delta, _precision);

            if (_newScale < _min) {
                _newScale = _min;
            }
            else if (_newScale > _max) {
                _newScale = _max;
            }

            // Prevent zooming beyond limits
            _delta = _newScale - _scale;

            if (_scale !== _newScale) {
                instance.zoomAt(_newScale, {
                    x: _originX,
                    y: _originY
                }, {
                    duration: '0s'
                });
                
            }
        }
    };

    /**
    * Zoom in/out at a specific point.
    *
    * @param {number} scale - The scale to zoom to.
    * @param {Object|Element} focus - The point or object at which to focus the zoom.
    * @param {Object} [options] - An object of transition options.
    * @param {string} [options.delay] - A valid CSS transition-delay value.
    * @param {string} [options.duration] - A valid CSS transition-duration value.
    * @param {string} [options.timingFunction] - A valid CSS transition-timing-function value.
    * @returns {CameraView} The view.
    */
    instance.zoomAt = function (scale, focus, options) {
        options = options || {};
        
        // TODO: Decide whether to use separate x/y variables or objects that have x/y properties.
        let focalPoint = instance.model.get('focus');
        let deltaX = focalPoint.x - focus.x;
        let deltaY = focalPoint.y - focus.y;
        let scaleRatio = instance.model.get('scale') / scale;
        let newFocalPoint = {
            x: _.round(focalPoint.x - deltaX + (deltaX * scaleRatio), constants.defaults.PIXEL_PRECISION),
            y: _.round(focalPoint.y - deltaY + (deltaY * scaleRatio), constants.defaults.PIXEL_PRECISION)
        };
        
        instance.model.set({
            scale: scale,
            focus: newFocalPoint
        }, {
            transition: options
        });

        return instance;
    };

    /**
    * Zoom in/out and focus the camera on a specific point.
    *
    * @param {number} scale - The scale to zoom to.
    * @param {Object|Element} focus - The point or object to focus on.
    * @param {Object} [options] - An object of transition options.
    * @param {string} [options.delay] - A valid CSS transition-delay value.
    * @param {string} [options.duration] - A valid CSS transition-duration value.
    * @param {string} [options.timingFunction] - A valid CSS transition-timing-function value.
    * @returns {CameraView} The view.
    */
    instance.zoomTo = function (scale, focus, options) {
        options = options || {};
        
        instance.model.set({
            scale: scale,
            focus: focus
        }, {
            transition: options
        });
        
        return instance;
    };

    /**
    * Focus the camera on a specific point.
    *
    * @param {Object} [options] - An object of transition options.
    * @param {string} [options.delay] - A valid CSS transition-delay value.
    * @param {string} [options.duration] - A valid CSS transition-duration value.
    * @param {string} [options.timingFunction] - A valid CSS transition-timing-function value.
    * @returns {CameraView} The view.
    */
    instance.focus = function (options) {
        options = options || {};
        
        let focalOffset = instance.getFocalOffset(instance.model.get('focus'), instance.model.get('scale'));

        instance.model.set({
            transition: Object.assign({}, instance.model.get('defaultTransition'), options.transition)
        });
        
        utils.setCssTransform(instance.content, {
            scale: instance.model.get('scale'),
            translateX: focalOffset.x,
            translateY: focalOffset.y
        });
        
        return instance;
    };

    instance.getFocalOffset = function (focus, scale) {
        var _offset = {};
        var _position;
        var _frameCenterX = instance.el.getBoundingClientRect().width / 2;
        var _frameCenterY = instance.el.getBoundingClientRect().height / 2;

        if (_.isElement(focus)) {
            // TODO: Handle Element
            _position = {
                x: 0, // TODO: logic to get centerX of element
                y: 0  // TODO: logic to get centerY of element
            };
        }
        else {
            _position = focus;
        }

        // TODO: Try using CSS translate instead of top left for smoother rendering.
        // TODO: handle setup of _position better so _.isFinite check isn't necessary here.
        if (_.isFinite(_position.x) && _.isFinite(_position.y)) {
            _offset.x = _frameCenterX + (_position.x * scale * -1);
            _offset.y = _frameCenterY + (_position.y * scale * -1);
        }

        return _offset;
    };

    Backbone.View.call(instance, options);

    return instance;
};

/**
* @namespace utils
* @static
*/
var utils = {
    /**
    * Clears inline transition styles.
    *
    * @method utils.clearTransition
    * @param {Element} el - The element on which to clear the inline transition styles.
    * @returns {Element} The element.
    */
    clearCssTransition: function (el) {
        el.style.removeProperty('transition');
        el.style.removeProperty('transitionDelay');
        el.style.removeProperty('transitionDuration');
        el.style.removeProperty('transitionProperty');
        el.style.removeProperty('transitionTimingFunction');

        return el;
    },
    
    /**
    * Get the CSS transform value for an element.
    *
    * @method utils.getCssTransform
    * @param {Element} el - The element for which to get the CSS transform value.
    * @returns {string} The CSS transform value.
    */
    getCssTransform: function (el) {
        let _value = window.getComputedStyle(el).getPropertyValue('transform');

        _value = _value.replace(/^\w+\(/,'').replace(/\)$/,'').split(', ');

        // TODO: Put this logic into the set method.
        if (_value[0] === 'none') {
            _value = [1, 0, 0, 1, 0, 0];
        }

        return _value;
    },

    /**
    * Set the CSS transform value for an element.
    *
    * @method utils.setCssTransform
    * @param {Element} el - The element for which to set the CSS transform value.
    * @param {Object} options - An object of CSS transform values.
    * @param {string} [options.scale] - A valid CSS transform 'scale' function value to apply to both X and Y axes.
    * @param {string} [options.scaleX] - A valid CSS transform 'scale' function value to apply to the X axis.
    * @param {string} [options.scaleY] - A valid CSS transform 'scale' function value to apply to the Y axis.
    * @param {string} [options.skewX] - A valid CSS transform 'skew' function value to apply to the X axis.
    * @param {string} [options.skewY] - A valid CSS transform 'skew' function value to apply to the Y axis.
    * @param {string} [options.translate] - A valid CSS transform 'translate' function value to apply to both X and Y axes.
    * @param {string} [options.translateX] - A valid CSS transform 'translate' function value to apply to the X axis.
    * @param {string} [options.translateY] - A valid CSS transform 'translate' function value to apply to the Y axis.
    * @returns {Element} The element.
    */

    // TODO: This is a very simplistic solution.
    // Ideally would handle 'rotate' option.
    // Ideally would handle 3D Matrix.
    setCssTransform: function (el, options) {
        options = options || {};
        
        let _value = utils.getCssTransform(el);
        const MATRIX_2D = {
            scaleX: 0,
            scaleY: 3,
            skewY: 1,
            skewX: 2,
            translateX: 4,
            translateY: 5
        };

        if (options.scale) {
            options.scaleX = options.scaleY = options.scale;
        }

        if (options.translate) {
            options.translateX = options.translateY = options.translate;
        }

        for (let key in MATRIX_2D) {
            if (options[key]) {
                if (_.isFinite(options[key])) {
                    _value[MATRIX_2D[key]] = options[key];
                }
                else {
                    throw new Error('Cannot set an invalid CSS matrix value');
                }

            }
        }
        
        el.style.transform = 'matrix(' + _value.join(', ') + ')';
        
        return el;
    },
    
    /**
    * Set the CSS transition properties for an element.
    *
    * @method utils.setCssTransition
    * @param {Element} el - The element for which to set the CSS transition properties.
    * @param {Object} properties - An object of CSS transition properties.
    * @param {string} [properties.delay] - A valid CSS transition-delay value.
    * @param {string} [properties.duration] - A valid CSS transition-duration value.
    * @param {string} [properties.property] - A valid CSS transition-property value.
    * @param {string} [properties.timingFunction] - A valid CSS transition-timing-function value.
    * @returns {Element} The element.
    */
    setCssTransition: function (el, properties) {
        properties = properties || {};
        
        let cssTransitionProperties = {
            transitionDelay: properties.delay || constants.defaults.TRANSITION.DELAY,
            transitionDuration: properties.duration || constants.defaults.TRANSITION.DURATION,
            transitionProperty: properties.property || constants.defaults.TRANSITION.PROPERTY,
            transitionTimingFunction: properties.timingFunction || constants.defaults.TRANSITION.TIMING_FUNCTION
        };
        
        for (let key in cssTransitionProperties) {
            el.style[key] = cssTransitionProperties[key];
        }
    },
    
    /**
    * Throttling using requestAnimationFrame.
    *
    * @method utils.throttleToFrame
    * @param {Function} func - The function to throttle.
    * @returns {Function} A new function throttled to the next Animation Frame.
    */
    throttleToFrame: function (func) {
        let _this, args;
        let isProcessing = false;

        return function () {
            _this = this;
            args = arguments;

            if (!isProcessing) {
                isProcessing = true;

                window.requestAnimationFrame(function() {
                    func.apply(_this, args);
                    isProcessing = false;
                });    
            }
        };
    }
};