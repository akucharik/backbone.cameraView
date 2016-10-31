'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import isElement from 'lodash/isElement';
import isString  from 'lodash/isString';
import Utils     from './utils';
import Vector2   from './math/vector2';

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
        this.view = Utils.DOM.parseView(view);

        /**
        * @property {Vector2} - The transformation origin.
        * @default
        */
        this.origin = new Vector2();
    }
}

/**
* The width.
* @name Scene#width
* @property {number} - Gets the width.
*/
Object.defineProperty(Scene.prototype, 'width', {
    get: function () {
        return this.view ? this.view.offsetWidth : 0;
    }
});

/**
* The height.
* @name Scene#height
* @property {number} - Gets the height.
*/
Object.defineProperty(Scene.prototype, 'height', {
    get: function () {
        return this.view ? this.view.offsetHeight : 0;
    }
});

export default Scene;