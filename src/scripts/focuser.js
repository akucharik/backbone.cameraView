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