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
* @class Scene
* @param {string|Element} [view] - The view for the scene. It can be a selector or an element.
*/
class Scene {
    constructor (view) {
        /**
        * @property {Element} - The view. An HTML element.
        */
        this.view = utils.DOM.parseView(view);

        /**
        * @property {Vector2} - The transformation origin.
        * @default
        */
        this.origin = new Vector2(0, 0);

        /**
        * @property {Vector2} - The position.
        * @default
        */
        this.position = new Vector2(0, 0);
        
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
    }   
}


/**
* The position on the X axis.
* @name Scene#x
* @property {number} - Gets or sets the position on the X axis.
*/
Object.defineProperty(Scene.prototype, 'x', {
    get: function () {
        return this.position.x;
    },
    
    set: function (value) {
        this.position.set(value, null);
    }
});

/**
* The position on the Y axis.
* @name Scene#y
* @property {number} - Gets or sets the position on the Y axis.
*/
Object.defineProperty(Scene.prototype, 'y', {
    get: function () {
        return this.position.y;
    },
    
    set: function (value) {
        this.position.set(null, value);
    }
});

/**
* The raw/untransformed width.
* @name Scene#rawWidth
* @property {number} - Gets the raw/untransformed width.
*/
Object.defineProperty(Scene.prototype, 'rawWidth', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.view);
        
        return this.view.clientWidth + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));
    }
});

/**
* The raw/untransformed height.
* @name Scene#rawHeight
* @property {number} - Gets the raw/untransformed height.
*/
Object.defineProperty(Scene.prototype, 'rawHeight', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.view);
        
        return this.view.clientHeight + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));;
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