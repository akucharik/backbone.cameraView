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
    }   
}

/**
* The width.
* @name Scene#width
* @property {number} - Gets the width.
*/
Object.defineProperty(Scene.prototype, 'width', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.view);
        
        return this.view.clientWidth + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));
    }
});

/**
* The height.
* @name Scene#height
* @property {number} - Gets the height.
*/
Object.defineProperty(Scene.prototype, 'height', {
    get: function () {
        var computedStyle = window.getComputedStyle(this.view);
        
        return this.view.clientHeight + parseFloat(computedStyle.getPropertyValue('border-left-width')) + parseFloat(computedStyle.getPropertyValue('border-right-width'));;
    }
});