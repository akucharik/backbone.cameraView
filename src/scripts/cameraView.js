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
* The jQuery library.
* @external jQuery
* @see http://jquery.com
*/

/**
* The lodash library.
* @external lodash
* @see http://lodash.com
*/

/**
* The underscore library.
* @external underscore
* @see http://underscorejs.org
*/

/**
* The zepto library.
* @external zepto
* @see http://zeptojs.com
*/

/**
* Factory: Creates a camera to pan and zoom content.
* Requires {@link external:lodash}, and {@link external:jQuery} or {@link external:zepto}.
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
    SizableView,
    /**
    * @lends CameraView.prototype
    */                                                
    {
        /**
        * The content.
        * @name content
        * @property {Element} - The element to treat as the camera's content.
        */
        content: null,

        /**
        * The content's height.
        * @name contentHeight
        * @property {number} - The content's height.
        */
        contentHeight: 0,

        /**
        * The content's width.
        * @name contentWidth
        * @property {number} - The content's width.
        */
        contentWidth: 0,

        /**
        * The content's focusable bounds. If set, the camera will keep focus within the bounds.
        * @name bounds
        * @property {Object} - An object representing the content's focusable bounds.
        */
        bounds: null,

        /**
        * The focus.
        * @name focus
        * @property {Object|Element} - An 'x' {number}, 'y' {number} pixel coordinate object or an Element.
        * @default null
        */
        focus: {
            x: 0,
            y: 0
        },

        /**
        * The camera's height.
        * @name height
        * @property {number|string|Element} - A number, a valid CSS height value, or an element. If an element is set, the camera's height will be sized to match the element.
        * @default null
        */
        height: null,

        /**
        * @name isDragging
        * @property {boolean} - Whether the content is being dragged or not.
        * @default false
        */
        isDragging: false,

        /**
        * @name isTransitioning
        * @property {boolean} - Whether the content is transitioning or not.
        * @default false
        */
        isTransitioning: false,

        /**
        * The maximum value the content can be scaled.
        * @name maxScale
        * @property {number} - See {@link CameraView.scale|scale}.
        * @default
        */
        maxScale: 6.0,

        /**
        * The minimum value the content can be scaled.
        * @name minScale
        * @property {number} - See {@link CameraView.scale|scale}.
        * @default
        */
        minScale: 0.25,

        /**
        * The scale.
        * @name scale
        * @property {number} - A scale ratio where 1 = 100%.
        * @default
        */
        scale: 1,

        /**
        * The previous scale.
        * @name previousScale
        * @property {number} - A scale ratio where 1 = 100%.
        * @default
        */
        previousScale: 1,

        /**
        * The base increment at which the content will be scaled.
        * @name scaleIncrement
        * @property {number} - See {@link CameraView.scale|scale}.
        * @default
        */
        scaleIncrement: 0.01,

        /**
        * The scale origin.
        * @name scaleOrigin
        * @property {Object} - An 'x' {number}, 'y' {number} pixel coordinate object.
        * @default null
        */
        scaleOrigin: null,

        /**
        * The camera's position on the content.
        * @name position
        * @property {Object} - An 'x' {number}, 'y' {number} pixel coordinate object.
        */
        position: {
            x: 0,
            y: 0
        },

        /**
        * The camera's 'x' position on the content.
        * @name x
        * @property {number} - The camera's 'x' position on the content.
        */
        x: 0,

        /**
        * The camera's 'y' position on the content.
        * @name y
        * @property {number} - The camera's 'y' position on the content.
        */
        y: 0,

        /**
        * The camera's width.
        * @name width
        * @property {number|string|Element} - A number, a valid CSS width value, or an element. If an element is set, the camera's width will be sized to match the element.
        * @default null
        */
        width: null,
    
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
            this._wheelZoom(event);

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
                            x: (event.clientX - this.content.getBoundingClientRect().left) / this.scale,
                            y: (event.clientY - this.content.getBoundingClientRect().top) / this.scale
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
            this.x = x - this.width / 2;
            this.y = y - this.height / 2;

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
            
            this.scale = 1;
            this.x = 0;
            this.y = 0;
            
            Object.assign(this, _.pick(options, [
                'content',
                'bounds',
                'focus',
                'height',
                'maxScale',
                'minScale',
                'position',
                'scale',
                'scaleIncrement',
                'scaleOrigin',
                'width',
                'x',
                'y',
            ]));
            
            var contentRect = options.content.getBoundingClientRect();
            
            this.contentHeight = contentRect.height;
            this.contentWidth = contentRect.width;
        
            // TODO: In development
            this.transitionDelay = '0s';
            this.transitionDuration = '500ms';
            this.transitionTimingFunciton = 'ease-out';
            
            // TODO: In development
            this.tweenScale = null;
            this.tweenX = null;
            this.tweenY = null;
            
            // TODO: In development
            /**
            * The current transition.
            * @name transition
            * @property {Object} - An object of the current camera transition.
            * @memberOf CameraView
            */
            this.transition = {
                zoom: {
                    isComplete: false,
                    elapsedTime: 0,
                    startTime: null,
                    startValue: 1,
                    endValue: 2,
                    delay: 0,
                    duration: 1000,
                    timingFunction: createjs.Ease.cubicOut,
                    update: function (camera, timestamp) {
                        if (!this.startTime) {
                            this.startTime = timestamp;
                        }
                        
                        this.elapsedTime = timestamp - this.startTime;
                        
                        if (this.elapsedTime >= this.delay) {
                            if (!camera.tweenScale) {
                                camera.tweenScale = createjs.Tween.get(camera, { paused: true }).to({ scale: this.endValue }, this.duration, this.timingFunction);
                            }
                            
                            camera.tweenScale.setPosition(Math.min(this.elapsedTime - this.delay, this.duration));
                            
                            //var percent = Math.min(this.elapsedTime - this.delay, this.duration) / this.duration;

                            //var value = this.startValue + (this.endValue - this.startValue) * percent;

                            if (this.elapsedTime >= this.duration) {
                                this.isComplete = true;
                                camera.tweenScale = null;
                            }
                            
                            //camera.scale = value;
                        }
                    }
                },
                positionX: {
                    isComplete: false,
                    elapsedTime: 0,
                    startTime: null,
                    startValue: 0,
                    endValue: 100,
                    delay: 0,
                    duration: 1000,
                    timingFunction: createjs.Ease.cubicOut,
                    update: function (camera, timestamp) {
                        if (!this.startTime) {
                            this.startTime = timestamp;
                        }

                        this.elapsedTime = timestamp - this.startTime;
                        
                        if (this.elapsedTime >= this.delay) {
                            if (!camera.tweenX) {
                                camera.tweenX = createjs.Tween.get(camera, { paused: true }).to({ x: this.endValue }, this.duration, this.timingFunction);
                            }
                            
                            camera.tweenX.setPosition(Math.min(this.elapsedTime - this.delay, this.duration));
                            
                            //var percent = Math.min(this.elapsedTime - this.delay, this.duration) / this.duration;
                            
                            //var value = this.startValue + (this.endValue - this.startValue) * percent;

                            if (this.elapsedTime >= this.duration) {
                                this.isComplete = true;
                                camera.tweenX = null;
                            }
                            
                            //camera.position.x = value;
                        }
                    }
                },
                positionY: {
                    isComplete: false,
                    elapsedTime: 0,
                    startTime: null,
                    startValue: 0 ,
                    endValue: -150,
                    delay: 0,
                    duration: 1000,
                    timingFunction: createjs.Ease.cubicOut,
                    update: function (camera, timestamp) {
                        if (!this.startTime) {
                            this.startTime = timestamp;
                        }

                        this.elapsedTime = timestamp - this.startTime;
                        
                        if (this.elapsedTime >= this.delay) {
                            if (!camera.tweenY) {
                                camera.tweenY = createjs.Tween.get(camera, { paused: true }).to({ y: this.endValue }, this.duration, this.timingFunction);
                            }
                            
                            camera.tweenY.setPosition(Math.min(this.elapsedTime - this.delay, this.duration));
                            
                            //var percent = Math.min(this.elapsedTime - this.delay, this.duration) / this.duration;
                            
                            //var value = this.startValue + (this.endValue - this.startValue) * percent ;

                            if (this.elapsedTime >= this.duration) {
                                this.isComplete = true;
                                camera.tweenY = null;
                            }
                            
                            //camera.position.y = value;
                        }
                    }
                }
            };
            
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
            this.listenTo(this, 'change:size', this.update);
            this.listenTo(this, 'change:state', this._onStateChange);
            
            this.onInitialize(options);

            return this;
        },

        // TODO: In development
        testUpdate: function (timeStamp) {
            var isComplete = true;
            
            for (let key in this.transition) {
                let transitionType = this.transition[key];
                
                if (transitionType) {
                    transitionType.update(this, timeStamp);
                    if (!transitionType.isComplete) {
                        isComplete = false;
                    }
                    else {
                        transitionType = null;
                    }
                }
            }
            
            utils.setCssTransition(this.content, {
                duration: '100ms',
                property: 'transform',
                timingFunction: 'linear'
            });
            
            utils.setCssTransform(this.content, {
                scale: this.scale,
                translateX: this.x,
                translateY: this.y
            }, this);
            
            if (!isComplete) {
                window.requestAnimationFrame(this.testUpdate.bind(this));
            }
            
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

            this.setViewWidth();
            this.setViewHeight();
            
            var position = {};

            if (_.isElement(this.focus)) {
                position = this.getElementFocus(window, this.content.getBoundingClientRect(), this.focus, this.previousScale);
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
            
            var focusOffset = this.getFocusOffset(this.el.getBoundingClientRect(), position, this.scale);
            
            utils.setCssTransition(this.content, {
                delay: this.transitionDelay,
                duration: this.transitionDuration,
                timingFunction: this.transitionTimingFunction
            });
            utils.setCssTransform(this.content, {
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
        
        positionX: 0,
        positionY: 0,
        defaultTweenOptions: {
            ease: Power2.easeOut
        },
        gs_zoom: function (scale, duration, options) {
            this.gs_zoomAtXY(scale, this.focus.x, this.focus.y, duration, options);

            return this;
        },
        
        gs_zoomAtXY: function (scale, x, y, duration, options) {
            var currentFocus, scaleRatio, state;
            var delta = {};
            var newFocus = {};

            scaleRatio = this.scale / scale;

            delta.x = this.focus.x - x;
            delta.y = this.focus.y - y;

            newFocus.x = this.focus.x - delta.x + (delta.x * scaleRatio);
            newFocus.y = this.focus.y - delta.y + (delta.y * scaleRatio);
            
            var contentX = this.getFocusOffset(this.el.getBoundingClientRect(), newFocus, scale).x;
            var contentY = this.getFocusOffset(this.el.getBoundingClientRect(), newFocus, scale).y;
            
            var tweenOptions = Object.assign({}, options, this.defaultTweenOptions, { 
                scale: scale,
                positionX: contentX,
                positionY: contentY,
                css: {
                    scale: scale,
                    x: contentX,
                    y: contentY
                }
            });

            TweenMax.to([this, this.content], duration, tweenOptions);

            return this;
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
                focus = this._getElementFocus(focus, this.content, this.scale);
            }

            if (_.isElement(currentFocus)) {
                currentFocus = this._getElementFocus(currentFocus, this.content, this.scale);
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