'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/*
var test = new Camera.Animation(camera, { paused: true }).zoomTo(2,1).shake(0.1,2).resume();
*/

/**
* @class Camera.Animation
* @constructor
* @memberof Camera
* @extends external:TimelineMax
* @param {Camera} camera - The camera on which the animation will be applied.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
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
* Zooms in/out at a specific point.
*
* @private
* @param {number} zoomX - A {@link Camera#zoomX|zoomX} ratio for the x axis.
* @param {number} zoomY - A {@link Camera#zoomY|zoomY} ratio for the y axis.
* @param {number} x - A x axis anchor value.
* @param {number} y - A y axis anchor value.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @param {number} [position] - The placement of the effect in the timeline.
* @returns {Camera.Animation} The animation.
*/
a._zoomAtXY = function (zoomX, zoomY, x, y, duration, options, position) {
    zoomX = this.camera.clampZoom(zoomX === null ? this.camera.zoomX : zoomX);
    zoomY = this.camera.clampZoom(zoomY === null ? this.camera.zoomY : zoomY);
    x = x === null ? this.camera.focusX : x;
    y = y === null ? this.camera.focusY : y;
    
    var anchor = this.camera.checkFocusBounds(x, y);
    var focusX = this.camera.getContentFocusAxisValue(this.camera.focusX, anchor.x, this.camera.zoomX / zoomX);
    var focusY = this.camera.getContentFocusAxisValue(this.camera.focusY, anchor.y, this.camera.zoomY / zoomY);
    var positionX = this.camera.getContentPositionAxisValue(focusX, this.camera.viewportWidth, zoomX);
    var positionY = this.camera.getContentPositionAxisValue(focusY, this.camera.viewportHeight, zoomY);
    
    this.camera.zoomOriginX = x;
    this.camera.zoomOriginY = y;

    this.add(TweenMax.to(this.camera, duration, Object.assign({}, options, { 
        contentX: positionX,
        contentY: positionY,
        focusX: focusX,
        focusY: focusY,
        zoomX: zoomX,
        zoomY: zoomY
    })), position);

    return this;
};

/**
* Shakes the camera.
*
* @param {number} intensity - A {@link Camera#shakeIntensity|shake intensity}.
* @param {number} duration - A duration.
* @param {Camera.shakeDirection} [direction=Camera.shakeDirection.BOTH] - A shake direction. 
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options plus:
* @param {Object} [options.easeIn] - An {@link external:Easing|Easing}.
* @param {Object} [options.easeOut] - An {@link external:Easing|Easing}.
* @param {number} [position] - The placement of the effect in the timeline.
* @returns {Camera.Animation} The animation.
*
* @example
* animation.shake(0.1, 4, camera.shakeDirection.BOTH, { easeIn: Power2.easeIn, easeOut: Power2.easeOut })
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
* Zooms in/out at the current focus.
*
* @param {number} zoom - A zoom ratio for both axes.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @param {number} [position] - The placement of the effect in the timeline.
* @returns {Camera.Animation} The animation.
*
* @example
* animation.zoomTo(2, 1, { ease: Power2.easeIn })
*/
a.zoomTo = function (zoom, duration, options, position) {
    this._zoomAtXY(zoom, zoom, null, null, duration, options, position);

    return this;
};

/**
* Zooms the x axis in/out at the current focus.
*
* @param {number} zoom - A {@link Camera#zoomX|zoomX} ratio for the x axis.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @param {number} [position] - The placement of the effect in the timeline.
* @returns {Camera.Animation} The animation.
*
* @example
* animation.zoomXTo(2, 1, { ease: Power2.easeIn })
*/
a.zoomXTo = function (zoomX, duration, options, position) {
    this._zoomAtXY(zoomX, null, null, null, duration, options, position);

    return this;
};

/**
* Zooms the y axis in/out at the current focus.
*
* @param {number} zoom - A {@link Camera#zoomY|zoomY} ratio for the y axis.
* @param {number} duration - A duration.
* @param {Object} [options] - An object of {@link external:TweenMax|TweenMax} options.
* @param {number} [position] - The placement of the effect in the timeline.
* @returns {Camera.Animation} The animation.
*
* @example
* animation.zoomYTo(2, 1, { ease: Power2.easeIn })
*/
a.zoomYTo = function (zoomY, duration, options, position) {
    this._zoomAtXY(null, zoomY, null, null, duration, options, position);

    return this;
};

Camera.Animation = Animation;