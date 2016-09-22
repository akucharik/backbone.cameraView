'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

var isElement = _.isElement;
var isString = _.isString;
var Vector2 = Oculo.Vector2;

/**
* Creates a scene.
* 
* @constructs Scene
* @param {string|Element} [element] - The element containing the scene. It can be a selector or an element.
*/
class Scene {
    constructor (element) {
        if (isString(element)) {
            element = document.querySelector(element);
        }
        if (!isElement(element)) {
            element = document.createElement('div');
        }
        
        /**
        * @property {Element} - The view. An HTML element.
        */
        this.element = element;

        /**
        * @property {number} - The transformation origin.
        * @default
        */
        this.origin = new Vector2(0, 0);

        /**
        * @property {number} - The rotation in degrees.
        * @default
        */
        this.rotation = 0;

        /**
        * @property {number} - The scale of the X axis.
        * @default
        */
        this.scaleX = 1;

        /**
        * @property {number} - The scale of the Y axis.
        * @default
        */
        this.scaleY = 1;

        /**
        * @property {number} - The position on the X axis.
        * @default
        */
        this.x = 0;

        /**
        * @property {number} - The position on the Y axis.
        * @default
        */
        this.y = 0;
    }   
}

/**
* The position.
* @name Scene#position
* @property {Vector2} - Gets or sets the position.
*/
Object.defineProperty(Scene.prototype, 'position', {
    get: function () {
        return new Vector2(this.x, this.y);
    },
    
    set: function (value) {
        this.x = value.x;
        this.y = value.y;
    }
});

/**
* The raw/untransformed width.
* @name Scene#rawWidth
* @property {number} - Gets the raw/untransformed width.
*/
Object.defineProperty(Scene.prototype, 'rawWidth', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.element);
        
        return this.element.clientWidth + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));
    }
});

/**
* The raw/untransformed height.
* @name Scene#rawHeight
* @property {number} - Gets the raw/untransformed height.
*/
Object.defineProperty(Scene.prototype, 'rawHeight', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.element);
        
        return this.element.clientHeight + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));;
    }
});

/**
* The width.
* @name Scene#width
* @property {number} - Gets the width including any applied transformations.
*/
Object.defineProperty(Scene.prototype, 'width', {
    get: function () {
        return this.rawWidth * this.scaleX;
    }
});

/**
* The height.
* @name Scene#height
* @property {number} - Gets the height including any applied transformations.
*/
Object.defineProperty(Scene.prototype, 'height', {
    get: function () {
        return this.rawHeight * this.scaleY;
    }
});