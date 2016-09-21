'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

var Matrix2 = Oculo.Matrix2;
var Vector2 = Oculo.Vector2;

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
    * @returns {Vector2} The element's focus position. An x/y position object representing the center point of the element in relation to the container.
    */
    this.getElementCentre = function (container, element, scaleX, scaleY) {
        var x = (element.offsetWidth / 2) + element.offsetLeft - container.offsetLeft; 
        var y = (element.offsetHeight / 2) + element.offsetTop - container.offsetTop;
        
        return new Vector2(x, y);
    };
    
    /**
    * Get the position within the camera of a point on the content.
    *
    * @param {number} contentX - The x coordinate on the content.
    * @param {number} contentY - The y coordinate on the content.
    * @param {number} focusX - The x coordinate on the content that is in focus.
    * @param {number} focusY - The y coordinate on the content that is in focus.
    * @param {number} rotation - The rotation.
    * @param {number} scaleX - The x-axis zoom.
    * @param {number} scaleY - The y-axis zoom.
    * @returns {Vector2} The position of the content's point within the camera.
    */
    this.calculateCameraContextPosition = function (contentX, contentY, focusX, focusY, rotation, scaleX, scaleY) {
        var transformationMatrix = new Matrix2(scaleX, 0, 0, scaleY).rotate(Oculo.Math.degToRad(-rotation));
        var position = new Vector2(contentX, contentY).transform(transformationMatrix);
        var cameraPosition = this.calculateCameraPosition(focusX, focusY, this.halfViewportWidth, this.halfViewportHeight, 0, 0, rotation, scaleX, scaleY);
        
        return Vector2.clone(position).subtract(cameraPosition);
    };
    
    /**
    * Get the position of the camera on the content.
    *
    * @param {number} contentX - The x coordinate on the content.
    * @param {number} contentY - The y coordinate on the content.
    * @param {number} cameraContextX - The x coordinate on the content that is in focus.
    * @param {number} cameraContextY - The y coordinate on the content that is in focus.
    * @param {number} originX - The x coordinate of the origin.
    * @param {number} originY - The y coordinate of the origin.
    * @param {number} rotation - The rotation.
    * @param {number} scaleX - The x-axis zoom.
    * @param {number} scaleY - The y-axis zoom.
    * @returns {Vector2} The position of the camera.
    */
    this.calculateCameraPosition = function (contentX, contentY, cameraContextPositionX, cameraContextPositionY, originX, originY, rotation, scaleX, scaleY) {
        var transformationMatrix = new Matrix2(scaleX, 0, 0, scaleY).rotate(Oculo.Math.degToRad(-rotation));
        var contentPosition = new Vector2(contentX, contentY).transform(transformationMatrix);
        var cameraContextPosition = new Vector2(cameraContextPositionX, cameraContextPositionY);
        var origin = new Vector2(originX, originY);
        var originOffset = Vector2.clone(origin).transform(transformationMatrix).subtract(origin);
        
        return Vector2.clone(contentPosition).subtract(originOffset, cameraContextPosition);
    };
};

Focuser.prototype.constructor = Focuser;