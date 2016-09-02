'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* @class Camera.Animation
* @constructor
* @memberof Camera
* @extends external:TimelineMax
* @param {Camera} camera - The camera on which the animation will be applied.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
*
* @example
* var myAnimation = new Camera.Animation(myCamera, { paused: true }).zoomTo(2,1).shake(0.1,2).resume();
*/
var Animation = function (camera, options) {
    /**
    * @property {Camera} - The camera on which the animation will be applied.
    */
    this.camera = camera;
    
    TimelineMax.call(this, Object.assign({}, options, {
        data: {
            id: uniqueId()
        },
        paused: true,
        callbackScope: this,
        onStart: function () { 
            this.camera.isAnimating = true;
            this.camera.draggable.disable();
        },
        onUpdate: function () {
            var x = this.camera.contentX;
            var y = this.camera.contentY;
            
            if (this.camera.isShaking) {
                if (this.camera.shakeHorizontal) {
                    x += Math.random() * this.camera.shakeIntensity * this.camera.width * 2 - this.camera.shakeIntensity * this.camera.width;
                }

                if (this.camera.shakeVertical) {
                    y += Math.random() * this.camera.shakeIntensity * this.camera.height * 2 - this.camera.shakeIntensity * this.camera.height;
                }
            }
            
            // render
            TweenMax.set(this.camera.content.transformEl, { 
                css: {
                    scaleX: this.camera.zoomX,
                    scaleY: this.camera.zoomY,
                    x: x,
                    y: y
                }
            });

            this.camera._renderDebug();
        },
        onComplete: function () { 
            console.log('camera TL complete');
            // render position without effects applied
            TweenMax.set(this.camera.content.transformEl, { 
                css: {
                    x: this.camera.contentX,
                    y: this.camera.contentY
                }
            });
            this.camera.isAnimating = false;
            this.camera.draggable.enable();
            this.camera._renderDebug();
        }
    }));
}

Animation.prototype = Object.create(TimelineMax.prototype);
Animation.prototype.constructor = Animation;

/**
* @lends Camera.Animation.prototype
*/
var a = Animation.prototype;

/**
* Focus the camera on a point.
*
* @private
* @param {number} x - The x position on the unzoomed content.
* @param {number} y - The y position on the unzoomed content.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @returns {this} self
*/
a._focusOnXY = function (x, y, duration, options, position) {
    this.add(TweenMax.to(this.camera, duration, Object.assign({}, options, { 
        data: {
            x: x === null ? this.camera.focusX : x,
            y: y === null ? this.camera.focusY : y
        },
        callbackScope: this,
        onStart: function (tween) { 
            var focus = this.camera.checkFocusBounds(tween.data.x, tween.data.y);
            var vector = this.camera.getContentPosition(focus.x, focus.y, this.camera.viewportWidth, this.camera.viewportHeight, this.camera.zoomX);
            // TODO: This must be a 2D matrix. Ensure a 2D matrix is returned.
            var tMatrix = utils.getTransformMatrix(this.camera.content.rotateEl);
            var tPositionX = vector.x * tMatrix[0] + vector.y * tMatrix[2];
            var tPositionY = vector.x * tMatrix[1] + vector.y * tMatrix[3];
            
            tween.updateTo({
                contentX: tPositionX, 
                contentY: tPositionY,
                focusX: focus.x,
                focusY: focus.y,
            });
        },
        onStartParams: ['{self}']
    })), position);

    return this;
};

/**
* Zooms in/out at a specific point.
*
* @private
* @param {number} zoomX - A {@link Camera#zoomX|zoomX} value for the x axis.
* @param {number} zoomY - A {@link Camera#zoomY|zoomY} value for the y axis.
* @param {number} x - A x axis anchor value.
* @param {number} y - A y axis anchor value.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @param {number} [position] - The placement of the effect in the timeline.
* @returns {this} self
*/
a._zoomAtXY = function (zoomX, zoomY, x, y, duration, options, position) {
    this.add(TweenMax.to(this.camera, duration, Object.assign({}, options, {
        data: {
            zoomX: this.camera.clampZoom(zoomX === null ? this.camera.zoomX : zoomX),
            zoomY: this.camera.clampZoom(zoomY === null ? this.camera.zoomY : zoomY),
            x: x === null ? this.camera.focusX : x,
            y: y === null ? this.camera.focusY : y
        },
        callbackScope: this,
        onStart: function (tween) { 
            var anchor = this.camera.checkFocusBounds(tween.data.x, tween.data.y);
            var focusX = this.camera.getContentFocusAxisValue(this.camera.focusX, anchor.x, this.camera.zoomX / tween.data.zoomX);
            var focusY = this.camera.getContentFocusAxisValue(this.camera.focusY, anchor.y, this.camera.zoomY / tween.data.zoomY);
            var positionX = this.camera.getContentPositionAxisValue(focusX, this.camera.viewportWidth, tween.data.zoomX);
            var positionY = this.camera.getContentPositionAxisValue(focusY, this.camera.viewportHeight, tween.data.zoomY);

            this.camera.zoomOriginX = tween.data.x;
            this.camera.zoomOriginY = tween.data.y;
            
            tween.updateTo({
                contentX: positionX,
                contentY: positionY,
                focusX: focusX,
                focusY: focusY,
                zoomX: tween.data.zoomX,
                zoomY: tween.data.zoomY
            });
        },
        onStartParams: ['{self}']
    })), position);
    
    return this;
};

a._zoomTo = function (zoomX, zoomY, duration, options, position) {
    this.add(TweenMax.to(this.camera, duration, Object.assign({}, options, { 
        data: {
            zoomX: this.camera.clampZoom(zoomX === null ? this.camera.zoomX : zoomX),
            zoomY: this.camera.clampZoom(zoomY === null ? this.camera.zoomY : zoomY)
        },
        callbackScope: this,
        onStart: function (tween) { 
            var positionX = this.camera.getContentPositionAxisValue(this.camera.focusX, this.camera.viewportWidth, tween.data.zoomX);
            var positionY = this.camera.getContentPositionAxisValue(this.camera.focusY, this.camera.viewportHeight, tween.data.zoomY);
            
            this.camera.zoomOriginX = this.camera.focusX;
            this.camera.zoomOriginY = this.camera.focusY;
            
            tween.updateTo({
                contentX: positionX,
                contentY: positionY,
                focusX: this.camera.focusX,
                focusY: this.camera.focusY,
                zoomX: tween.data.zoomX,
                zoomY: tween.data.zoomY
            });
        },
        onStartParams: ['{self}']
    })), position);

    return this;
};

/**
* Focus on an element.
*
* @param {Element} focus - An element.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @returns {this} self
*//**
* Focus on a point.
*
* @param {number} x - The x position on the unzoomed content.
* @param {number} y - The y position on the unzoomed content.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @returns {this} self
*/
a.focusOn = function (x, y, duration, options, position) {
    // Focus on an element
    if (arguments.length >= 2 && _.isElement(arguments[0])) {
        var el = x;
        var duration = y;
        var options = duration;
        var position = options;
        var vector = this.camera.getElementFocus(window, this.camera.content.transformEl.getBoundingClientRect(), el.getBoundingClientRect(), this.camera.zoom);

        this._focusOnXY(vector.x, vector.y, duration, options, position);
    }

    // Focus on a vector
    else if (arguments.length >= 3) {
        this._focusOnXY(x, y, duration, options, position);
    }

    else {
        throw new Error(constants.errorMessage.METHOD_SIGNATURE);
    }

    return this;
};

/**
* Shakes.
*
* @param {number} intensity - A {@link Camera#shakeIntensity|shake intensity}.
* @param {number} duration - A duration.
* @param {Camera.shakeDirection} [direction=Camera.shakeDirection.BOTH] - A shake direction. 
* @param {Object} [options] - An object of {@link external:TimelineMax|TimelineMax} options plus:
* @param {Object} [options.easeIn] - An {@link external:Easing|Easing}.
* @param {Object} [options.easeOut] - An {@link external:Easing|Easing}.
* @param {number} [position] - The placement of the effect in the timeline.
* @returns {this} self
*
* @example
* myAnimation.shake(0.1, 4, camera.shakeDirection.BOTH, { easeIn: Power2.easeIn, easeOut: Power2.easeOut })
*/
a.shake = function (intensity, duration, direction, options, position) {
	options = options || {};
    
    this.camera.shakeHorizontal = direction === Camera.shakeDirection.VERTICAL ? false : true;
    this.camera.shakeVertical = direction === Camera.shakeDirection.HORIZONTAL ? false : true;
    
    var timeline = new TimelineMax(Object.assign({}, options, {
        onStart: function (timeline) {
            this.camera.isShaking = true;
        },
        onStartParams: ['{self}'],
        onStartScope: this,
        onComplete: function (timeline) {
            TweenMax.set(this, { 
                shakeIntensity: 0
            });
            this.camera.isShaking = false;
        },
        onCompleteParams: ['{self}'],
        onCompleteScope: this
    })).to(this, duration, {}, 0);
    
    if (options.ease) {
        timeline.fromTo(this.camera, duration, {
            shakeIntensity: 0
        }, {
            ease: options.ease || Power0.easeNone,
            shakeIntensity: intensity
        }, 0);
    }
    else if (options.easeIn || options.easeOut) {
        timeline.fromTo(this.camera, duration * 0.5, {
            shakeIntensity: 0
        }, {
            ease: options.easeIn || Power0.easeNone,
            shakeIntensity: intensity
        }, 0);
        
        timeline.to(this.camera, duration * 0.5, {
            ease: options.easeOut || Power0.easeNone,
            shakeIntensity: 0
        }, duration * 0.5);
    }
    else {
        this.camera.shakeIntensity = intensity;
    }
    
    this.add(timeline, position);
    
    return this;
};

/**
* Zooms in/out at a specific element.
*
* @param {number} zoom - A zoom value for both axes.
* @param {number} [zoom.x] - A {@link Camera.zoomX|zoomX} value for the x axis.
* @param {number} [zoom.y] - A {@link Camera.zoomY|zoomY} value for the y axis.
* @param {Element} focus - An element.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @returns {this} self.
*
* @example
* myAnimation.zoomTo(2, document.getElementById('door'), 1)
* myAnimation.zoomTo({x: 2}, document.getElementById('door'), 1)
* myAnimation.zoomTo({y: 2}, document.getElementById('door'), 1)
* myAnimation.zoomTo({x:2, y: 0.5}, document.getElementById('door'), 1)
*//**
* Zooms in/out at a specific point.
*
* @param {number} zoom - A zoom value for both axes.
* @param {number} [zoom.x] - A {@link Camera.zoomX|zoomX} value for the x axis.
* @param {number} [zoom.y] - A {@link Camera.zoomY|zoomY} value for the y axis.
* @param {number} x - The x position on the unzoomed content.
* @param {number} y - The y position on the unzoomed content.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @returns {this} self.
*
* @example
* myAnimation.zoomTo(2, 100, 100, 1)
* myAnimation.zoomTo({x: 2}, 100, 100, 1)
* myAnimation.zoomTo({y: 2}, 100, 100, 1)
* myAnimation.zoomTo({x:2, y: 0.5}, 100, 100, 1)
*/
a.zoomAt = function (zoom, x, y, duration, options, position) {
    var zoomX = null;
    var zoomY = null;
    
    if (isFinite(zoom)) {
        zoomX = zoom;
        zoomY = zoom;
    }
    else if (isObject(zoom)) {
        zoomX = zoom.x === undefined ? null : zoom.x;
        zoomY = zoom.y === undefined ? null : zoom.y;
    }
    else {
        throw new Error(constants.errorMessage.METHOD_SIGNATURE);
    }
    
    // Zoom at an element
    if (arguments.length >= 3 && _.isElement(x)) {
        var el = x;
        var duration = y;
        var options = duration;
        var vector = this.camera.getElementFocus(window, this.camera.content.transformEl.getBoundingClientRect(), el.getBoundingClientRect(), this.camera.zoom);

        x = vector.x;
        y = vector.y;
        
    }
    else if (arguments.length < 3){
        throw new Error(constants.errorMessage.METHOD_SIGNATURE);
    }
    
    this._zoomAtXY(zoomX, zoomY, x, y, duration, options, position);

    return this;
};

/**
* Zooms in/out at the current focus.
*
* @param {number|Object} zoom - A zoom value for both axes.
* @param {number} [zoom.x] - A {@link Camera.zoomX|zoomX} value for the x axis.
* @param {number} [zoom.y] - A {@link Camera.zoomY|zoomY} value for the y axis.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @param {number} [position] - The placement of the effect in the timeline.
* @returns {this} self
*
* @example
* myAnimation.zoomTo(2, 1)
* myAnimation.zoomTo({x: 2}, 1)
* myAnimation.zoomTo({y: 2}, 1)
* myAnimation.zoomTo({x:2, y: 0.5}, 1)
*/
a.zoomTo = function (zoom, duration, options, position) {
    var zoomX = null;
    var zoomY = null;
    
    if (isFinite(zoom)) {
        zoomX = zoom;
        zoomY = zoom;
    }
    else if (isObject(zoom)) {
        zoomX = zoom.x === undefined ? null : zoom.x;
        zoomY = zoom.y === undefined ? null : zoom.y;
    }
    else {
        throw new Error(constants.errorMessage.METHOD_SIGNATURE);
    }
    
    this._zoomTo(zoomX, zoomY, duration, options, position);

    return this;
};

Camera.Animation = Animation;