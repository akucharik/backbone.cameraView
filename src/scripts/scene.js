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
* @class Scene
* @param {string|Element} [view] - The view for the scene. It can be a selector or an element.
*/
class Scene {
    constructor (view, camera) {
        /**
        * @property {Oculo.Camera} - The camera.
        */
        this.camera = camera || null;
        
        /**
        * @property {number} - The X transformation origin.
        * @default
        */
        this.originX = 0;
        
        /**
        * @property {number} - The Y transformation origin.
        * @default
        */
        this.originY = 0;
        
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
    * @name Scene#origin
    * @property {Vector2} - The transformation origin.
    * @readonly
    */
    get origin () {
        return new Vector2(this.originX, this.originY);
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