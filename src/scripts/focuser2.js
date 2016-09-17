'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

/**
* Focus functionality for a standalone object or object composition.
* Requires {@link external:lodash}.
*
* @class
* @constructor
*/
var Focuser = function () {
    /**
    * Get the x/y focus point for an element.
    *
    * @param {Object} containerRect - The boundingClientRect object for the element that contains all focusable positions.
    * @param {Element} elRect - The boundingClientRect object for the element on which to determine the focus position.
    * @param {number} scale - The currently rendered scale ratio.
    * @returns {Object} The element's focus position. An x/y position object representing the center point of the element in relation to the container.
    */
    this.getElementFocus = function (window, containerRect, elRect, scale) {
        return {
            x: _.round((elRect.width / scale / 2) + (elRect.left / scale + window.scrollX) - (containerRect.left / scale + window.scrollX), 2),
            y: _.round((elRect.height / scale / 2) + (elRect.top / scale + window.scrollY) - (containerRect.top / scale + window.scrollY), 2)
        };
    };
    
    this.getElementCenter = function (window, containerRect, elRect, scaleX, scaleY) {
        return {
            x: (elRect.width / scaleX / 2) + elRect.left - containerRect.left,
            y: (elRect.height / scaleY / 2) + elRect.top - containerRect.top
        };
    };
    
    this.getElementCentre = function (container, element, scaleX, scaleY) {
        return {
            x: (element.offsetWidth / 2) + element.offsetLeft - container.offsetLeft,
            y: (element.offsetHeight / 2) + element.offsetTop - container.offsetTop
        };
    };

    /**
    * Get the x/y container offset to focus/center on a position.
    *
    * @param {Object} frameRect - The boundingClientRect object for the frame.
    * @param {Object} position - The position that will be brought to focus. An x/y point object (at a scale ratio of 1).
    * @param {number} scale - The destination scale ratio.
    * @returns {Object} The offset. An x/y point object representing the position of the content's container in order for the frame to focus on the position.
    */
    this.getFocusOffset = function (frameRect, position, scale) {
        if (_.isFinite(position.x) && _.isFinite(position.y)) {
            return {
                x: _.round((frameRect.width / 2) - (position.x * scale), 2),
                y: _.round((frameRect.height / 2) - (position.y * scale), 2)
            };
        }
        else {
            throw new Error('Cannot determine focus offset from an invalid position');
        }
    };
    
    /**
    * Get the x/y focus position given a different current focus.
    *
    * @param {number} focusX - The x value of the current focus (at a scale ratio of 1).
    * @param {number} focusY - The y value of the current focus (at a scale ratio of 1).
    * @param {number} deltaX - The x delta between the current focus and the zoom anchor.
    * @param {number} deltaY - The y delta between the current focus and the zoom anchor.
    * @param {number} scale - The destination scale ratio.
    * @returns {Object} The focus. An x/y point object representing the position of the focus in order to maintain the zoom anchor.
    */
    this.getContentFocus = function (focusX, focusY, deltaX, deltaY, scaleRatio) {
        if (_.isFinite(focusX) && _.isFinite(focusY)) {
            return {
                x: focusX - deltaX + (deltaX * scaleRatio),
                y: focusY - deltaY + (deltaY * scaleRatio)
            };
        }
        else {
            throw new Error('Cannot determine focus');
        }
    };
    
    this.getContentFocusAxisValue = function (axisValue, newAxisValue, scaleRatio) {
        if (_.isFinite(axisValue) && _.isFinite(newAxisValue)) {
            var deltaAxisValue = axisValue - newAxisValue;
            
            return axisValue - deltaAxisValue + (deltaAxisValue * scaleRatio);
        }
        else {
            throw new Error('Cannot determine focus');
        }
    };
    
    this.calculateFocus = function (focusX, focusY, anchorX, anchorY, scaleRatioX, scaleRatioY, rotation) {
        if (_.isFinite(focusX) && _.isFinite(focusY) && _.isFinite(anchorX) && _.isFinite(anchorY)) {
            var deltaX = focusX - anchorX;
            var deltaY = focusY - anchorY;
            
            return {
                x: focusX - deltaX + (deltaX * scaleRatioX),
                y: focusY - deltaY + (deltaY * scaleRatioY)
            }
            axisValue - deltaAxisValue + (deltaAxisValue * scaleRatio);
        }
        else {
            throw new Error('Cannot determine focus');
        }
    };
    
    /**
    * Get the x/y position of the content in relation to the frame given a focus position.
    *
    * @param {number} positionX - The x value that will be brought to focus (at a scale ratio of 1).
    * @param {number} positionY - The y value that will be brought to focus (at a scale ratio of 1).
    * @param {number} frameWidth - The frame width.
    * @param {number} frameHeight - The frame height.
    * @param {number} scale - The destination scale ratio.
    * @returns {Object} The position. An x/y point object representing the position of the content within the frame.
    */
    this.getContentPosition = function (positionX, positionY, frameWidth, frameHeight, scale) {
        if (_.isFinite(positionX) && _.isFinite(positionY)) {
            return {
                x: _.round((frameWidth / 2) - (positionX * scale), 2),
                y: _.round((frameHeight / 2) - (positionY * scale), 2)
            };
        }
        else {
            throw new Error('Cannot determine position');
        }
    };

    this.calculateRawPosition = function (camera, focusX, focusY) {
        return new Vector2(focusX - camera.halfViewportWidth, focusY - camera.halfViewportHeight);
    };
    
    this.calculateRawFocus = function (camera) {
        var focus = new Vector2(camera.halfViewportWidth + camera.rawX, camera.halfViewportHeight + camera.rawY);
        
        return focus;
    };
    
    // rawX: 200, rawY: 50
    // -300, -200
    // -100, -150
    this.calculatePosition99 = function (camera) {
        var rawFocus = camera.calculateRawFocus(camera);
        var scaleMatrix = new Matrix2(_.round(camera.previousZoomX, 6), 0, 0, _.round(camera.previousZoomY, 6));
        var scaleMatrix1 = new Matrix2(_.round(camera.zoomX, 6), 0, 0, _.round(camera.zoomY, 6));
        
        var position = Vector2.transform(rawFocus, scaleMatrix1).subtract(new Vector2(camera.halfViewportWidth, camera.halfViewportHeight));
        
        //console.log('sm: ', scaleMatrix.e11, scaleMatrix.e22);
        //console.log('sm1: ', scaleMatrix1.e11, scaleMatrix1.e22);
        console.log('delta scale: ', camera.zoomX - camera.previousZoomX);
        
        var rawContentSize = new Vector2(camera.content.width, camera.content.height);
        var contentSize = Vector2.transform(rawContentSize, scaleMatrix);
        var contentSize1 = Vector2.transform(rawContentSize, scaleMatrix1);
        var deltaContentSize = Vector2.subtract(contentSize1, contentSize);
        
        //console.log('cs: ', contentSize.x, contentSize.y);
        //console.log('cs1: ', contentSize1.x, contentSize1.y);
        
        deltaContentSize.x *= (rawFocus.x / camera.content.width);
        deltaContentSize.y *= (rawFocus.y / camera.content.height);
        //console.log(deltaContentSize.x, deltaContentSize.y);
        //position.subtract(deltaContentSize);
        //console.log(focus.x, focus.y);
        
        //console.log(position.x, position.y);
        
        return position;
    };
    
    this.calculatePosition = function (focusX, focusY, cameraWidth, cameraHeight, scaleX, scaleY, rotation) {
        if (_.isFinite(focusX) && _.isFinite(focusY)) {
            var focus = new Vector2(focusX, focusY);
            var rotationOrigin = new Vector2(this.rotationOriginX, this.rotationOriginY);
            var rotationMatrix = new Matrix2().rotate(Oculo.Math.degToRad(-rotation));
            var scaleMatrix = new Matrix2(scaleX, 0, 0, scaleY);
            var transformedFocus = Vector2.clone(focus).subtract(rotationOrigin).transform(rotationMatrix).add(rotationOrigin).transform(scaleMatrix);
            var position = new Vector2(transformedFocus.x  - (cameraWidth / 2), transformedFocus.y - (cameraHeight / 2));
            
            return position;
        }
        else {
            throw new Error('Cannot determine position');
        }
    };
    
        this.calculateStaticFocusPosition = function (focusX, focusY, cameraWidth, cameraHeight, scaleX, scaleY) {
        if (_.isFinite(focusX) && _.isFinite(focusY)) {
            var focus = new Vector2(focusX, focusY).transform(new Matrix2(scaleX, 0, 0, scaleY));

            return {
                x: _.round(focus.x - (cameraWidth / 2), 2),
                y: _.round(focus.y - (cameraHeight / 2), 2)
            };
        }
        else {
            throw new Error('Cannot determine position');
        }
    };
    
    this.calculatePosition2 = function (camera, focusX, focusY, scaleX, scaleY, rotation) {
        var v = new Vector2(focusX, focusY);
        var m = new Matrix2(scaleX, 0, 0, scaleY).rotate(Oculo.Math.degToRad(-rotation));

        return v.transform(m).subtract(new Vector2(camera.halfViewportWidth, camera.halfViewportHeight));
    };
    
    this.getContentPositionAxisValue = function (axisValue, axisFrameSize, scale) {
        if (_.isFinite(axisValue)) {
            return _.round((axisFrameSize / 2) - (axisValue * scale), 2);
        }
        else {
            throw new Error('Cannot determine position');
        }
    };
    
};

Focuser.prototype.constructor = Focuser;