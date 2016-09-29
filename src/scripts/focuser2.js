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
    * Get an object's position in the world.
    *
    * @param {Element} object - The object.
    * @param {Element} world - The world.
    * @returns {Vector2} The object's position.
    */
    this.getObjectWorldPosition = function (object, world) {
        var x = (object.offsetWidth / 2) + object.offsetLeft - world.offsetLeft; 
        var y = (object.offsetHeight / 2) + object.offsetTop - world.offsetTop;
        
        return new Vector2(x, y);
    };
    
    /**
    * Calculate the raw point on the scene on which the camera is positioned.
    *
    * @param {Vector2} cameraOffset - The camera's position on the scene.
    * @param {Vector2} cameraCenter - The camera's center point.
    * @param {Vector2} sceneOrigin - The scene's origin.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The camera's position.
    */
    this.calculateCameraPosition = function (cameraOffset, cameraCenter, sceneOrigin, sceneTransformation) {
        var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);

        return cameraOffset.clone().add(sceneOriginOffset, cameraCenter).transform(sceneTransformation.getInverse());
    };
    
    /**
    * Calculate the position within the camera of the provided raw point on the scene.
    *
    * @param {Vector2} scenePosition - The raw point on the scene.
    * @param {Vector2} cameraPosition - The raw point on the scene on which the camera is positioned.
    * @param {Vector2} cameraCenter - The camera's center point.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The position within the camera.
    */
    this.calculateCameraContextPosition = function (scenePosition, cameraPosition, cameraCenter, sceneTransformation) {
        var cameraOffset = this.calculateCameraOffset(cameraPosition, cameraCenter, new Vector2(), sceneTransformation);
        
        return scenePosition.clone().transform(sceneTransformation).subtract(cameraOffset);
    };
    
    /**
    * Calculate the camera's offset on the scene given a raw point on the scene to be placed at a point on the camera.
    *
    * @param {Vector2} scenePosition - The raw point on the scene.
    * @param {Vector2} cameraContext - The point on the camera.
    * @param {Vector2} sceneOrigin - The scene's origin.
    * @param {Matrix2} sceneTransformation - The scene's transformation matrix.
    * @returns {Vector2} The camera's offset.
    */
    this.calculateCameraOffset = function (scenePosition, cameraContextPosition, sceneOrigin, sceneTransformation) {
        var sceneOriginOffset = sceneOrigin.clone().transform(sceneTransformation).subtract(sceneOrigin);
        
        return scenePosition.clone().transform(sceneTransformation).subtract(sceneOriginOffset, cameraContextPosition);
    };
};

Focuser.prototype.constructor = Focuser;