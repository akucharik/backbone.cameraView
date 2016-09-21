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
    * Calculate the position within the camera of the provided point on the content.
    *
    * @param {Vector2} contentPosition - The point on the content.
    * @param {Vector2} focus - The point on the content that is in focus.
    * @param {Matrix2} transformation - The transformation matrix.
    * @returns {Vector2} The position within the camera of the provided point on the content.
    */
    this.calculateCameraContextPosition = function (contentPosition, focus, transformation) {
        var cameraContextPosition = new Vector2(this.halfViewportWidth, this.halfViewportHeight);
        var origin = new Vector2(0, 0);
        var cameraPosition = this.calculateCameraPosition(focus, cameraContextPosition, origin, transformation);
        
        return Vector2.clone(contentPosition).transform(transformation).subtract(cameraPosition);
    };
    
    /**
    * Calculate the position of the camera given a point on the content to be placed at a point on the camera.
    *
    * @param {Vector2} contentPosition - The point on the content.
    * @param {Vector2} cameraContext - The point on the camera.
    * @param {Vector2} origin - The origin.
    * @param {Matrix2} transformation - The transformation matrix.
    * @returns {Vector2} The position of the camera.
    */
    this.calculateCameraPosition = function (contentPosition, cameraContextPosition, origin, transformation) {
        var originOffset = Vector2.clone(origin).transform(transformation).subtract(origin);
        
        return Vector2.clone(contentPosition).transform(transformation).subtract(originOffset, cameraContextPosition);
    };
};

Focuser.prototype.constructor = Focuser;