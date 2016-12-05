'use strict';
/**
* @author       Adam Kucharik <akucharik@gmail.com>
* @copyright    Adam Kucharik
* @license      {@link https://github.com/akucharik/backbone.cameraView/license.txt|MIT License}
*/

import Utils     from './utils';
import Vector2   from './math/vector2';

/**
* Creates a scene.
* 
* @class Oculo.Scene
* @param {Oculo.Camera} [camera=null] - The camera that owns this Scene.
* @param {string|Element} [view=null] - The view for the scene. It can be a selector or an element.
*/
class Scene {
    constructor (camera = null, view = null) {
        /**
        * @property {Oculo.Camera} - The camera.
        */
        this.camera = camera;
        
        /**
        * @property {Element} - The view. An HTML element.
        */
        this.view = Utils.DOM.parseView(view);
        
        // View setup
        if (this.view && this.view.parentNode) {
            this.view.parentNode.removeChild(this.view);
        }
    }
    
    /**
    * @name Scene#width
    * @property {number} - The width.
    * @readonly
    */
    get width () {
        return this.view ? this.view.offsetWidth : 0;
    }

    /**
    * @name Scene#height
    * @property {number} - The height.
    * @readonly
    */
    get height () {
        return this.view ? this.view.offsetHeight : 0;
    }
    
    /**
    * @name Scene#scaledWidth
    * @property {number} - The scaled width.
    * @readonly
    */
    get scaledWidth () {
        return this.view ? this.width * this.camera.zoom : this.width;
    }
    
    /**
    * @name Scene#scaledHeight
    * @property {number} - The scaled height.
    * @readonly
    */
    get scaledHeight () {
        return this.view ? this.height * this.camera.zoom : this.height;
    }
    
    /**
    * Destroys the scene and prepares it for garbage collection.
    *
    * @returns {this} self
    */
    destroy () {
        this.camera = null;
        this.view = null;
        
        return this;
    }
}

export default Scene;