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
    * Calculate the raw point on the scene on which the camera is focused.
    *
    * @param {Vector2} cameraPosition - The camera's position on the scene.
    * @param {Vector2} cameraCenter - The camera's center point.
    * @param {Vector2} sceneOrigin - The scene's origin.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The camera's focus.
    */
    this.calculateCameraFocus = function (cameraPosition, cameraCenter, sceneOrigin, sceneTransformation) {
        var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

        return cameraPosition.clone().add(sceneOriginOffset, cameraCenter).transform(sceneTransformation.getInverse());
    };
    
    /**
    * Calculate the position within the camera of the provided raw point on the scene.
    *
    * @param {Vector2} scenePosition - The raw point on the scene.
    * @param {Vector2} cameraFocus - The raw point on the scene on which the camera is focused.
    * @param {Vector2} cameraCenter - The camera's center point.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The position within the camera.
    */
    this.calculateCameraContextPosition = function (scenePosition, cameraFocus, cameraCenter, sceneTransformation) {
        var cameraPosition = this.calculateCameraPosition(cameraFocus, cameraCenter, new Vector2(), sceneTransformation);
        
        return scenePosition.clone().transform(sceneTransformation).subtract(cameraPosition);
    };
    
    /**
    * Calculate the camera's position on the scene given a raw point on the scene to be placed at a point on the camera.
    *
    * @param {Vector2} scenePosition - The raw point on the scene.
    * @param {Vector2} cameraContext - The point on the camera.
    * @param {Vector2} sceneOrigin - The scene's origin.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The camera's position.
    */
    this.calculateCameraPosition = function (scenePosition, cameraContextPosition, sceneOrigin, sceneTransformation) {
        var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);
        
        return scenePosition.clone().transform(sceneTransformation).subtract(sceneOriginOffset, cameraContextPosition);
    };
};

Focuser.prototype.constructor = Focuser;