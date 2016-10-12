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
* The Lodash library.
* @external Lodash
* @see http://lodash.com
*/

/**
* The Zepto library.
* @external Zepto
* @see http://zeptojs.com
*/

/**
* GSAP's TweenMax.
* @external TweenMax
* @see http://greensock.com/docs/#/HTML5/GSAP/TweenMax/
*/

/**
* GSAP's TimelineMax.
* @external TimelineMax
* @see http://greensock.com/docs/#/HTML5/GSAP/TimelineMax/
*/

/**
* GSAP's Easing.
* @external Easing
* @see http://greensock.com/docs/#/HTML5/GSAP/Easing/
*/

// TODO: Remove from the window object

// Utilities (allows for easy swapping)
var clamp = _.clamp;
var isElement = _.isElement;
var isFinite = _.isFinite;
var isFunction = _.isFunction;
var isObject = _.isObject;
var isString = _.isString;
var pick = _.pick;
var uniqueId = _.uniqueId;

//var DebugView = DebugView;
//var Scene = Scene;
var Matrix2 = Oculo.Matrix2;
var Vector2 = Oculo.Vector2;

/**
* Factory: Creates a camera to view a scene.
* Requires {@link external:Lodash} and {@link external:Zepto}.
* 
* @constructs Camera
* @extends external:Backbone.View
* @mixes SizableView
* @param {Object} [options] - An object of options. Includes all Backbone.View options. See {@link external:Backbone.View}.
* @param {number|string|Element} [options.width] - The camera's {@link Camera.width|width}.
* @param {number|string|Element} [options.height] - The camera's {@link Camera.height|height}.
* @param {Object|Element} [options.position] - A {@link Camera.position|position} object.
* @param {number} [options.minZoom] - The {@link Camera.minZoom|minimum zoom}.
* @param {number} [options.maxZoom] - The {@link Camera.maxZoom|maximum zoom}.
* @param {number} [options.zoom] - A {@link Camera.zoom|zoom} ratio.
* @param {number} [options.zoomIncrement] - The base {@link Camera.zoomIncrement|zoom increment}.
*/
var Camera = function (options) {
    options = options || {};
    this.config = options || {};
    options.position = this._parsePosition(options.position);
    
    // Compose object
    Object.assign(this, Backbone.Events);
    
    /**
    * @property {Element} - The view.
    */
    this.view = utils.DOM.parseView(options.view);
    
    /**
    * @property {Element} - TODO.
    */
    this.$view = $(this.view);
    
    
    
    
    
    
    /**
    * The scene which the camera is viewing.
    * @property {Camera.Scene}
    */
    this.scene = new Scene(options.scene);
    
    /**
    * @property {Animation3} - The active camera animation.
    */
    this.animation = new Animation3(this);
    
    /**
    * @property {Object} - An object containing of all current and future animations.
    */
    this.animations = {};

    /**
    * @property {Object} - Whether the camera is in debug mode or not.
    * @default false
    */
    this.debug = options.debug ? true : false;
    
    /**
    * The default ease.
    * @name Camera#defaultEase
    * @property {Object} - Gets or sets the default ease.
    */
    Object.defineProperty(this, 'defaultEase', {
        get: function () {
            return TweenLite.defaultEase;
        },

        set: function (value) {
            TweenLite.defaultEase = value;
        }
    });
    
    this.defaultEase = options.defaultEase || Power2.easeOut;
    
    /**
    * Whether the scene is animating or not.
    * @name Camera#isAnimating
    * @property {boolean} - Gets whether the scene is animating or not.
    */
    Object.defineProperty(this, 'isAnimating', {
        get: function () {
            return this.animation.isActive();
        }
    });

    /**
    * @property {boolean} - Whether the camera's position is draggable or not.
    * @default false
    */
    this.isDraggable = options.draggable ? true : false;

    /**
    * @property {boolean} - Whether the camera's drag capability is enabled or not.
    * @default false
    */
    Object.defineProperty(this, 'isDragEnabled', {
        get: function () {
            var isEnabled = false;
            
            if (this.draggable) {
                isEnabled = this.draggable.enabled();
            }
            
            return isEnabled;
        }
    });
    
    /**
    * @property {boolean} - Whether the camera is being dragged or not.
    * @default false
    */
    this.isDragging = false;
    
    /**
    * Whether the camera is paused or not.
    * @name Camera#isPaused
    * @property {boolean} - Gets whether the camera is paused or not.
    */
    Object.defineProperty(this, 'isPaused', {
        get: function () {
            return this.animation.paused();
        }
    });

    /**
    * @property {boolean} - Whether the camera is pressed or not.
    * @default
    */
    this.isPressed = false;
    
    /**
    * @property {boolean} - Whether the camera has been rendered or not.
    * @default
    */
    this.isRendered = false;
    
    /**
    * Whether the camera is rotated or not.
    * @name Camera#isRotated
    * @property {number} - Gets whether the camera is rotated or not.
    */
    Object.defineProperty(this, 'isRotated', {
        get: function () {
            return this.rotation !== 0;
        }
    });
    
    /**
    * @property {boolean} - Whether the scene is shaking or not.
    * @default
    */
    this.isShaking = false;
    
    /**
    * @property {boolean} - Whether the scene has an active CSS transition or not.
    * @default
    */
    this.isTransitioning = false;
    
    /**
    * @property {boolean} - Whether the camera is manually zoomable or not.
    * @default false
    */
    this.isManualZoomable = options.manualZoomable ? true : false;    
    
    /**
    * @property {boolean} - Whether the manual zoom is enabled or not.
    * @default false
    */
    this.isManualZoomEnabled = options.manualZoomable ? true : false; 
    
    /**
    * Whether the camera is zoomed or not.
    * @name Camera#isZoomed
    * @property {number} - Gets whether the camera is zoomed or not.
    */
    Object.defineProperty(this, 'isZoomed', {
        get: function () {
            return this.zoom !== 1;
        }
    });
    
    /**
    * The maximum value the scene can be zoomed.
    * @property {number} - See {@link Camera.zoom|zoom}.
    * @default 3
    */
    this.maxZoom = isFinite(options.maxZoom) ? options.maxZoom : 3;
    
    /**
    * The minimum value the scene can be zoomed.
    * @property {number} - See {@link Camera.zoom|zoom}.
    * @default 0.5
    */
    this.minZoom = isFinite(options.minZoom) ? options.minZoom : 0.5;
    
    /**
    * @property {Vector2} - The offset on the scene.
    * @default
    */
    this.offset = new Vector2();
    
    /**
    * The camera's X offset on the scene.
    * @name Camera#x
    * @property {number} - Gets or sets the camera's X offset on the scene.
    */
    Object.defineProperty(this, 'offsetX', {
        get: function () {
            return this.offset.x;
        },

        set: function (value) {
            this.offset.x = value;
        }
    });
    
    /**
    * The camera's Y offset on the scene.
    * @name Camera#y
    * @property {number} - Gets or sets the camera's Y offset on the scene.
    */
    Object.defineProperty(this, 'offsetY', {
        get: function () {
            return this.offset.y;
        },

        set: function (value) {
            this.offset.y = value;
        }
    });
    
    /**
    * @property {Vector2} - The position within the world.
    * @default
    */
    this.position = new Vector2(options.position.x, options.position.y);
    
    /**
    * The camera's X position within the world.
    * @name Camera#x
    * @property {number} - Gets or sets the camera's X position within the world.
    */
    Object.defineProperty(this, 'x', {
        get: function () {
            return this.position.x;
        },

        set: function (value) {
            this.position.x = value;
        }
    });
    
    /**
    * The camera's Y position within the world.
    * @name Camera#y
    * @property {number} - Gets or sets the camera's Y position within the world.
    */
    Object.defineProperty(this, 'y', {
        get: function () {
            return this.position.y;
        },

        set: function (value) {
            this.position.y = value;
        }
    });
    
    /**
    * @property {number} - The amount of rotation in degrees.
    * @default
    */
    this.rotation = options.rotation || 0;
    
    /**
    * The X value of the transformation origin.
    * @name Camera#sceneOriginX
    * @property {number} - Gets the X value of the transformation origin.
    */
    Object.defineProperty(this, 'sceneOriginX', {
        get: function () {
            return this.scene.origin.x;
        }
    });
    
    /**
    * The Y value of the transformation origin.
    * @name Camera#sceneOriginY
    * @property {number} - Gets the Y value of the transformation origin.
    */
    Object.defineProperty(this, 'sceneOriginY', {
        get: function () {
            return this.scene.origin.y;
        }
    });

    /**
    * The width of the scene.
    * @name Camera#sceneWidth
    * @property {number} - Gets the width of the scene.
    */
    Object.defineProperty(this, 'sceneWidth', {
        get: function () {
            return this.scene.width;
        }
    });
    
    /**
    * The height of the scene.
    * @name Camera#sceneHeight
    * @property {number} - Gets the height of the scene.
    */
    Object.defineProperty(this, 'sceneHeight', {
        get: function () {
            return this.scene.height;
        }
    });
    
    /**
    * The scaled width of the scene.
    * @name Camera#sceneScaledHeight
    * @property {number} - Gets the scaled width of the scene.
    */
    Object.defineProperty(this, 'sceneScaledWidth', {
        get: function () {
            return this.scene.width * this.zoom;
        }
    });
    
    /**
    * The scaled height of the scene.
    * @name Camera#sceneScaledHeight
    * @property {number} - Gets the scaled height of the scene.
    */
    Object.defineProperty(this, 'sceneScaledHeight', {
        get: function () {
            return this.scene.height * this.zoom;
        }
    });

    /**
    * The transformation of the scene.
    * @name Camera#sceneTransformation
    * @property {Matrix2} - Gets the transformation of the scene.
    */
    Object.defineProperty(this, 'sceneTransformation', {
        get: function () {
            return new Matrix2().scale(this.zoom, this.zoom).rotate(Oculo.Math.degToRad(-this.rotation));
        }
    });
    
    /**
    * @property {number} - The shake intensity. A value between 0 and 1.
    */
    this.shakeIntensity = 0;
    
    /**
    * @property {boolean} - Whether the camera should shake on the x axis.
    * @default
    */
    this.shakeHorizontal = true;

    /**
    * @property {boolean} - Whether the camera should shake on the y axis.
    * @default
    */
    this.shakeVertical = true;
    
    /**
    * The center point.
    * @name Camera#center
    * @property {Vector2} - Gets the camera's center point.
    */
    Object.defineProperty(this, 'viewportCenter', {
        get: function () {
            return new Vector2(this.viewportWidth, this.viewportHeight).multiplyScalar(0.5);
        }
    });
    
    /**
    * The x coordinate of the center point.
    * @name Camera#centerX
    * @property {number} - Gets the x coordinate of the camera's center point.
    */
    Object.defineProperty(this, 'viewportCenterX', {
        get: function () {
            return this.viewportCenter.x;
        }
    });
    
    /**
    * The y coordinate of the center point.
    * @name Camera#centerY
    * @property {number} - Gets the y coordinate of the camera's center point.
    */
    Object.defineProperty(this, 'viewportCenterY', {
        get: function () {
            return this.viewportCenter.y;
        }
    });
    
    /**
    * The width of the viewport.
    * @name Camera#viewportWidth
    * @property {number} - Gets the viewport's width. Excludes the element's border.
    */
    Object.defineProperty(this, 'viewportWidth', {
        get: function () {
            return this.view.clientWidth;
        }
    });

    /**
    * The height of the viewport.
    * @name Camera#viewportHeight
    * @property {number} - Gets the viewport's height. Excludes the element's border.
    */
    Object.defineProperty(this, 'viewportHeight', {
        get: function () {
            return this.view.clientHeight;
        }
    });
    
    /**
    * The width.
    * @name Camera#width
    * @property {number} - Gets or sets the view's width. Includes border and padding. A "change:width" event is emitted if the value has changed.
    * @default 960
    */
    Object.defineProperty(this, 'width', {
        get: function () {
            var computedStyle = window.getComputedStyle(this.view);

            return this.view.clientWidth + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));
        },

        set: function (value) {
            if (value != this.width) {
                this.$view.width(value);
                this.trigger('change:width', value);
            }
        }
    });
    
    this.width = isFinite(options.width) ? options.width : 960;

    /**
    * The height.
    * @name Camera#height
    * @property {number} - Gets or sets the view's height. Includes border and padding. A "change:height" event is emitted if the value has changed.
    * @default 540
    */
    Object.defineProperty(this, 'height', {
        get: function () {
            var computedStyle = window.getComputedStyle(this.view);

            return this.view.clientHeight + parseFloat(computedStyle.getPropertyValue('border-top-width')) + parseFloat(computedStyle.getPropertyValue('border-bottom-width'));
        },

        set: function (value) {
            if (value != this.height) {
                this.$view.height(value);
                this.trigger('change:height', value);
            }
        }
    });
    
    this.height = isFinite(options.height) ? options.height : 540;
    
    /**
    * The base increment at which the scene will be zoomed.
    * @property {number} - See {@link Camera.zoom|zoom}.
    * @default 0.01
    */
    this.zoomIncrement = isFinite(options.zoomIncrement) ? options.zoomIncrement : 0.01;
    
    /**
    * @property {number} - The amount of zoom. A ratio where 1 = 100%.
    * @default
    */
    this.zoom = options.zoom || 1;
    
    /**
    * The camera's bounds. Set to null if no bounds are desired.
    * @property {Object} - An object representing the camera's bounds.
    * @default The size of the scene/world.
    */
//    this.bounds = options.bounds !== undefined ? options.bounds : function () {
//        return {
//            minX: this.viewportCenter.x,
//            minY: this.viewportCenter.y,
//            maxX: this.sceneWidth - this.viewportCenter.x,
//            maxY: this.sceneHeight - this.viewportCenter.y
//        }
//    };
    
    this._bounds = null;
    
    Object.defineProperty(this, 'bounds', {
        get: function () {
            return this._bounds;
        },
        
        set: function (value) {
            var bounds;
            
            this._bounds = value;
        
            if (value === null) {
                bounds = {
                    minX: null,
                    minY: null,
                    maxX: null,
                    maxY: null
                };
            }
            else if (isFunction(value)) {
                bounds = value.call(this);
            }
            else {
                bounds = value;
            }
            
            this.minX = bounds.minX;
            this.minY = bounds.minY;
            this.maxX = bounds.maxX;
            this.maxY = bounds.maxY;
        }
    });
    
    Object.defineProperty(this, 'hasBounds', {
        get: function () {
            return this._bounds !== null;
        }
    });
    
    this.minX = null;
    this.minY = null;
    this.maxX = null;
    this.maxY = null;
    
    this._calculateDraggableBounds = function () {
        var bounds = null;
        
        if (this.hasBounds) {
            var minOffset = new Vector2();
            var maxOffset = new Vector2();
            
            minOffset.copy(this._calculateOffset(new Vector2(this.maxX, this.maxY), this.viewportCenter, this.scene.origin, this.sceneTransformation));
            maxOffset.copy(this._calculateOffset(new Vector2(this.minX, this.minY), this.viewportCenter, this.scene.origin, this.sceneTransformation));

            bounds = {
                minX: -minOffset.x,
                minY: -minOffset.y,
                maxX: -maxOffset.x,
                maxY: -maxOffset.y
            }
        }
        
        return bounds;
    };
    
    this.applyBounds = function (newBounds) {
        if (newBounds !== undefined) {
            this.bounds = newBounds;
        }
        
        if (this.hasBounds) {
            this.position.set(clamp(this.position.x, this.minX, this.maxX), clamp(this.position.y, this.minY, this.maxY));
            this.offset.copy(this._calculateOffset(this.position, this.viewportCenter, this.scene.origin, this.sceneTransformation));
        }
        
        if (this.isDraggable) {
            this.draggable.applyBounds(this._calculateDraggableBounds());
        }
        
        return this;
    };
    
    this.bounds = options.bounds !== undefined ? options.bounds : function () {
        return {
            minX: this.viewportCenter.x,
            minY: this.viewportCenter.y,
            maxX: this.sceneWidth - this.viewportCenter.x,
            maxY: this.sceneHeight - this.viewportCenter.y
        }
    };
    
    
    
    /**
    * @property {external:Draggable} - The drag control.
    * @default null
    */
    this.draggable = !this.isDraggable ? null : new Draggable(this.scene.view, {
        bounds: this._calculateDraggableBounds(),
        onDrag: function (camera) {
            // 'this' refers to the Draggable instance
            var offset = new Vector2(-this.x, -this.y);
            camera.position.copy(camera._calculatePosition(offset, camera.viewportCenter, camera.scene.origin, camera.sceneTransformation));
            camera.offset.copy(offset);
            camera._renderDebug();
        },
        onDragParams: [this],
        zIndexBoost: false
    });
    
    /**
    * The debugging information view.
    * @property {Backbone.View} - The debugging information view.
    */
    this.debugView = new DebugView({
        model: this,
        className: 'oculo-debug'
    });
    
    // Initialize standard events and behaviors
    var onDragstart = (event) => {
        event.preventDefault();
        return false;
    };
    
    var onPress = (event) => {
        if (this.isDraggable) {
            this.view.addEventListener('mouseup', onDragRelease);
            this.view.addEventListener('mouseleave', onDragLeave);
            this.view.addEventListener('mousemove', onDragMove);
            this.view.addEventListener('touchend', onDragRelease);
            this.view.addEventListener('touchcancel', onDragRelease);
            this.view.addEventListener('touchmove', onDragMove);
        }
        
        this.isPressed = true;
        this._renderDebug();
    };
    
    var onRelease = (event) => {
        release();
    };
    
    var onLeave = (event) => {
        release();
    };
    
    var onTransitionEnd = (event) => {
        this.isTransitioning = false;
    };
    
    var release = () => {
        this.isPressed = false;
        this._renderDebug();
    };
    
    this.view.addEventListener('dragstart', onDragstart);
    this.view.addEventListener('mousedown', onPress);
    this.view.addEventListener('mouseup', onRelease);
    this.view.addEventListener('mouseleave', onLeave);
    this.view.addEventListener('touchstart', onPress);
    this.view.addEventListener('touchend', onRelease);
    this.view.addEventListener('touchcancel', onRelease);
    this.view.addEventListener('transitionend', onTransitionEnd);
    
    // Initialize drag events and behaviors
    var onDragRelease = (event) => {
        endDrag(event);
    };
    
    var onDragLeave = (event) => {
        endDrag(event);
    };
    
    var onDragMove = (event) => {
        if (this.isPressed && !this.isDragging) {
            this.draggable.startDrag(event);
            this.isDragging = true;
        }
    };
    
    var endDrag = (event) => {
        if (this.isDragging) {
            this.draggable.endDrag(event);
            this.view.removeEventListener('mouseup', onDragRelease);
            this.view.removeEventListener('mouseleave', onDragLeave);
            this.view.removeEventListener('mousemove', onDragMove);
            this.view.removeEventListener('touchend', onDragRelease);
            this.view.removeEventListener('touchcancel', onDragRelease);
            this.view.removeEventListener('touchmove', onDragMove);
            this.isDragging = false;
            this._renderDebug();
        }
    };
    
    if (this.isDraggable) {
        this.view.style.cursor = 'move';
    }
    
    // Initialize zoom events and behaviors
    var onZoomLeave = (event) => {
        document.body.style.removeProperty('overflow');
    };
    
    var onZoomWheel = (event) => {
        event.preventDefault();
        document.body.style.overflow = 'hidden';
        
        if (event.deltaY && this.isManualZoomEnabled) {
            var direction = event.deltaY > 0 ? constants.zoom.OUT : constants.zoom.IN;
            var cameraRect;
            var cameraContextPosition = new Vector2();
            var sceneContextPosition = new Vector2();
            var origin = this.scene.origin;
            var zoom = this.clampZoom(this.zoom + this.zoomIncrement * Math.abs(event.deltaY) * this.zoom * (direction === constants.zoom.IN ? 1 : -1));

            // Performance Optimization: If zoom has not changed because it's at the min/max, don't zoom.
            if (zoom !== this.zoom) {
                cameraRect = this.view.getBoundingClientRect();
                cameraContextPosition.set(event.clientX - cameraRect.left, event.clientY - cameraRect.top);
                sceneContextPosition = this._calculatePosition(this.offset, cameraContextPosition, this.scene.origin, this.sceneTransformation);
                console.log('offset: ', this.offset);
                console.log('ccp: ', cameraContextPosition);
                console.log('scp: ', sceneContextPosition);
                if (Math.round(origin.x) !== Math.round(sceneContextPosition.x) || Math.round(origin.y) !== Math.round(sceneContextPosition.y)) {
                    origin = this._calculatePosition(this.offset, cameraContextPosition, this.scene.origin, this.sceneTransformation);
                }

                this.animation = new Animation3(this).zoomAt(origin, zoom, 0).resume();
            }
        }
        
        //document.body.style.removeProperty('overflow');
    };

    if (this.isManualZoomable) {
        this.view.addEventListener('mouseleave', onZoomLeave);
        this.view.addEventListener('wheel', utils.throttleToFrame(onZoomWheel));
    }
    
    this.initialize(options);
};

/**
* Shake directions.
* @enum {number}
*/
Camera.shakeDirection = {
    /**
    * Both the x and y axes.
    */
    BOTH: 0,
    /**
    * The x axis.
    */
    HORIZONTAL: 1,
    /**
    * The y axis.
    */
    VERTICAL: 2
};

/**
* @lends Camera.prototype
*/
var p = Camera.prototype;

p._markPoint = function (x, y) {
    var pointElement = document.getElementById('point');
    var point = new Vector2(x, y).transform(new Matrix2().scale(this.zoom, this.zoom).rotate(Oculo.Math.degToRad(-this.rotation)));
    
    pointElement.style.top = (point.y - 2) + 'px';
    pointElement.style.left = (point.x - 2) + 'px';
};

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
* Animates the camera's scene.
*
* @private
* @param {Object} properties - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {TimelineMax} The animation timeline.
*/
p._animate = function (properties, duration, options) {

    return this;
};

/**
* Calculate the position in the scene given the state of the camera and the scene.
*
* @private
* @param {Vector2} cameraOffset - The camera's position on the scene.
* @param {Vector2} cameraContextPosition - The position within the camera.
* @param {Vector2} sceneOrigin - The scene's origin.
* @param {Matrix2} sceneTransformation - The scene's transformation matrix.
* @returns {Vector2} The camera's position.
*/
p._calculatePosition = function (cameraOffset, cameraContextPosition, sceneOrigin, sceneTransformation) {
    var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

    return cameraOffset.clone().add(sceneOriginOffset, cameraContextPosition).transform(sceneTransformation.getInverse());
};

/**
* Calculate the position within the camera of the provided raw point on the scene.
*
* @private
* @param {Vector2} scenePosition - The raw point on the scene.
* @param {Vector2} cameraPosition - The raw point on the scene on which the camera is positioned.
* @param {Vector2} cameraCenter - The camera's center point.
* @param {Matrix2} sceneTransformation - The scene's transformation matrix.
* @returns {Vector2} The position within the camera.
*/
p._calculateContextPosition = function (scenePosition, cameraPosition, cameraCenter, sceneTransformation) {
    var cameraOffset = this._calculateOffset(cameraPosition, cameraCenter, new Vector2(), sceneTransformation);

    return scenePosition.clone().transform(sceneTransformation).subtract(cameraOffset);
};

/**
* Calculate the camera's offset on the scene given a raw point on the scene to be placed at a point on the camera.
*
* @private
* @param {Vector2} scenePosition - The raw point on the scene.
* @param {Vector2} cameraContext - The point on the camera.
* @param {Vector2} sceneOrigin - The scene's origin.
* @param {Matrix2} sceneTransformation - The scene's transformation matrix.
* @returns {Vector2} The camera's offset.
*/
p._calculateOffset = function (scenePosition, cameraContextPosition, sceneOrigin, sceneTransformation) {
    var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

    return scenePosition.clone().transform(sceneTransformation).subtract(sceneOriginOffset, cameraContextPosition);
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
* Render debug info.
*
* @private
*/
p._renderDebug = function () {
    if (this.debug) {
        this.debugView.update();
    }
};

// TODO: Refactor to use use GSAP's Draggable.
/**
* Drag the scene.
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

/**
* End dragging the scene.
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
* Parse the position of the given input within the world.
*
* @private
* @param {string|Element|Object} [input] - The input to parse.
* @returns {Vector2} The position.
*/
p._parsePosition = function (input) {
    var objectPosition;
    var position = new Vector2();
    
    if (isString(input)) {
        input = document.querySelector(input);
    }

    if (isElement(input)) {
        objectPosition = this.camera.scene.getObjectWorldPosition(input);
        position.copy(objectPosition);
    }
    else if (isObject(input)) {
        position.copy(input);
    }
    
    return position;
};

/**
* Called when the camera has been created. The default implementation of initialize is a no-op. Override this function with your own code.
*
* @param {Object} [options] - The options passed to the constructor when the camera was created.
* @returns {this} self
*/
p.initialize = function (options) {
    return this;
};

/**
* TODO
*
* @param {number} value - TODO.
* @returns {number} The clamped zoom.
*/
p.clampZoom = function (value) {
    return clamp(value, this.minZoom, this.maxZoom);
};

// TODO: Temp rework of clampZoom to figure out maintaining aspect ratio.
p._clampZoom = function (x, y, maintainRatio) {
    var clampedZoom = {
        x: x,
        y: y
    };
    var zoomXDiff = 0;
    var zoomYDiff = 0;
    var zoomRatio = this.zoomX / this.zoomY;
    
    if (maintainRatio === true) {
        if (x > this.maxZoom || y > this.maxZoom) {
            var zoomXDiff = x - this.maxZoom;
            var zoomYDiff = y - this.maxZoom;

            if (zoomXDiff > zoomYDiff) {
                clampedZoom.x = this.maxZoom;
                clampedZoom.y = this.maxZoom / zoomRatio; 
            }
            if (zoomYDiff > zoomXDiff) {
                clampedZoom.y = this.maxZoom;
                clampedZoom.x = this.maxZoom / zoomRatio; 
            }
        }

        if (x < this.minZoom || y < this.minZoom) {
            var zoomXDiff = x - this.minZoom;
            var zoomYDiff = y - this.minZoom;

            if (zoomXDiff < zoomYDiff) {
                clampedZoom.x = this.minZoom;
                clampedZoom.y = this.minZoom * zoomRatio; 
            }
            if (zoomYDiff < zoomXDiff) {
                clampedZoom.y = this.minZoom;
                clampedZoom.x = this.minZoom * zoomRatio; 
            }
        }
    }
    else {
        clampedZoom.x = clamp(x, this.minZoom, this.maxZoom);
        clampedZoom.y = clamp(y, this.minZoom, this.maxZoom);
    }
    
    return clampedZoom;
}

/**
* Move the camera on an element.
*
* @param {Element} position - An element.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*//**
* Move the camera on a point.
*
* @param {number} x - The 'x' position on the unzoomed scene.
* @param {number} y - The 'y' position on the unzoomed scene.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p.moveTo = function (x, y, duration, options) {

    return this;
};

/**
* Triggered before the camera has rendered.
*/
p.onBeforeRender = function () {

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
p.render = function (animation) {
    this.onBeforeRender();
    
    if (!this.isRendered) {
        this.view.appendChild(this.scene.view);
        
        if (this.debug) {
            this.debugView.render().attach(document.body);
        }
        
        this.isRendered = true;
    }
    
    if (animation) {
        this.animation = animation;
        animation.invalidate().restart();
    }
    else {
        this.animation = new Animation3(this).animate({
            position: this.position,
            origin: this.scene.origin,
            rotation: this.rotation,
            zoom: this.zoom
        }, 0).resume();
    }
    
    this.onRender();

    return this;
};

/**
* Pauses all animations.
*
* @returns {Camera} The view.
*/
p.pause = function () {
    this.animation.pause();
    this._renderDebug();

    return this;
};

/**
* Plays all animations from the current playhead position.
*
* @returns {Camera} The view.
*/
p.play = function () {
    this.animation.play();

    return this;
};

/**
* Rotates at a specific element.
*
* @param {number|string} rotation - TODO.
* @param {Element} position - The element.
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

    return this;
};

/**
* Rotates at the current position.
*
* @param {number|string} rotation - TODO.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p.rotateTo = function (rotation, duration, options) {

    return this;
};

/**
* Zooms in/out at a specific element.
*
* @param {number} zoom - A {@link Camera.zoom|zoom} ratio.
* @param {Element} position - The element.
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

    return this;
};

/**
* Zooms in/out at the current position.
*
* @param {number} zoom - A {@link Camera.zoom|zoom} ratio.
* @param {number} duration - TODO.
* @param {Object} [options] - TODO.
* @returns {Camera} The view.
*/
p.zoomTo = function (zoom, duration, options) {

    return this;
};